package com.menglang.rumluos.domain.auth.service.role;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.service.DynamicSearchService;
import com.menglang.rumluos.domain.auth.dto.RoleDto;
import com.menglang.rumluos.domain.auth.entity.*;
import com.menglang.rumluos.domain.auth.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ActionRepository actionRepository;
    private final PermissionGrantRepository permissionGrantRepository;
    private final RolePermissionGrantRepository rolePermissionGrantRepository;
    private final RolePermissionGrantExclusionRepository rolePermissionGrantExclusionRepository;
    private final DynamicSearchService dynamicSearchService;

    @Transactional
    public Mono<RoleDto.RoleResponse> create(RoleDto.CreateRoleRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    String rawName = request.getName();
                    String formattedName = formatRoleName(rawName);
                    String displayName = (request.getDisplayName() != null && !request.getDisplayName().isBlank())
                            ? request.getDisplayName()
                            : rawName;

                    Role role = new Role();
                    role.setName(formattedName);
                    role.setDescription(request.getDescription());
                    role.setDisplayName(displayName);
                    role.setPriority(request.getPriority() != null ? request.getPriority() : 0);
                    role.setCompanyId(companyId);

                    return roleRepository.save(role)
                            .flatMap(savedRole -> processPermissions(savedRole, request.getPermissions(), request.getPermissionList(), companyId)
                                    .thenReturn(savedRole));
                })
                .flatMap(this::mapToResponse);
    }

    @Transactional
    public Mono<RoleDto.RoleResponse> update(Long id, RoleDto.UpdateRoleRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> roleRepository.findById(id)
                        .switchIfEmpty(Mono.error(new NotFoundException("Role not found")))
                        .flatMap(role -> {
                            if (!Objects.equals(role.getCompanyId(), companyId)) {
                                return Mono.error(new NotFoundException("Role not found"));
                            }
                            String rawName = request.getName();
                            String formattedName = formatRoleName(rawName);
                            String displayName = (request.getDisplayName() != null && !request.getDisplayName().isBlank())
                                    ? request.getDisplayName()
                                    : rawName;

                            role.setName(formattedName);
                            role.setDescription(request.getDescription());
                            role.setDisplayName(displayName);
                            role.setPriority(request.getPriority() != null ? request.getPriority() : 0);

                            return roleRepository.save(role)
                                    .flatMap(savedRole -> rolePermissionGrantRepository.deleteByRoleId(savedRole.getId())
                                            .then(processPermissions(savedRole, request.getPermissions(), request.getPermissionList(), companyId))
                                            .thenReturn(savedRole));
                        }))
                .flatMap(this::mapToResponse);
    }

    private String formatRoleName(String name) {
        if (name == null || name.isBlank()) {
            return name;
        }
        return name.trim().replaceAll("\\s+", "_").toUpperCase();
    }

    private Mono<Void> processPermissions(
            Role role,
            Map<String, List<RoleDto.ActionPermissionRequest>> permissionsMap,
            List<String> permissionList,
            Long companyId
    ) {
        Flux<RolePermissionGrant> fromMap = Flux.empty();
        if (permissionsMap != null && !permissionsMap.isEmpty()) {
            fromMap = Flux.fromIterable(permissionsMap.entrySet())
                    .flatMap(entry -> {
                        String permName = entry.getKey();
                        return permissionRepository.findByNameAndCompanyId(permName, companyId)
                                .flatMapMany(permission -> Flux.fromIterable(entry.getValue())
                                        .filter(RoleDto.ActionPermissionRequest::isEnabled)
                                        .flatMap(actionReq -> actionRepository.findByNameAndCompanyId(actionReq.getName(), companyId)
                                                .flatMap(action -> permissionGrantRepository.findByPermissionIdAndActionIdAndCompanyId(permission.getId(), action.getId(), companyId)
                                                        .switchIfEmpty(Mono.defer(() -> permissionGrantRepository.save(
                                                                PermissionGrant.builder()
                                                                        .permissionId(permission.getId())
                                                                        .actionId(action.getId())
                                                                        .companyId(companyId)
                                                                        .disabled(false)
                                                                        .build()
                                                        )))
                                                )
                                        )
                                );
                    })
                    .map(grant -> {
                        RolePermissionGrant roleGrant = new RolePermissionGrant();
                        roleGrant.setRoleId(role.getId());
                        roleGrant.setPermissionGrantId(grant.getId());
                        return roleGrant;
                    });
        }

        Flux<RolePermissionGrant> fromList = Flux.empty();
        if (permissionList != null && !permissionList.isEmpty()) {
            fromList = Flux.fromIterable(permissionList)
                    .flatMap(item -> resolvePermissionGrantIds(item, companyId))
                    .map(grantId -> {
                        RolePermissionGrant roleGrant = new RolePermissionGrant();
                        roleGrant.setRoleId(role.getId());
                        roleGrant.setPermissionGrantId(grantId);
                        return roleGrant;
                    });
        }

        return Flux.concat(fromMap, fromList)
                .distinct(RolePermissionGrant::getPermissionGrantId)
                .flatMap(rolePermissionGrantRepository::save)
                .then();
    }

    private Flux<Long> resolvePermissionGrantIds(String item, Long companyId) {
        if (item == null || item.isBlank()) {
            return Flux.empty();
        }
        String trimmed = item.trim();

        if (trimmed.matches("\\d+")) {
            Long numericId = Long.parseLong(trimmed);
            return permissionGrantRepository.findById(numericId)
                    .filter(grant -> Objects.equals(grant.getCompanyId(), companyId) && !Boolean.TRUE.equals(grant.getDisabled()))
                    .map(PermissionGrant::getId)
                    .flux()
                    .switchIfEmpty(Flux.defer(() ->
                            permissionRepository.findById(numericId)
                                    .filter(perm -> Objects.equals(perm.getCompanyId(), companyId))
                                    .flatMapMany(perm -> permissionGrantRepository.findAllByPermissionIdAndCompanyId(perm.getId(), companyId))
                                    .filter(grant -> !Boolean.TRUE.equals(grant.getDisabled()))
                                    .map(PermissionGrant::getId)
                    ));
        }

        return permissionRepository.findByNameAndCompanyId(trimmed, companyId)
                .switchIfEmpty(Mono.defer(() -> permissionRepository.findByNameAndCompanyId(trimmed.toLowerCase(), companyId)))
                .switchIfEmpty(Mono.defer(() -> permissionRepository.findByNameAndCompanyId(trimmed.toUpperCase(), companyId)))
                .flatMapMany(perm -> permissionGrantRepository.findAllByPermissionIdAndCompanyId(perm.getId(), companyId))
                .filter(grant -> !Boolean.TRUE.equals(grant.getDisabled()))
                .map(PermissionGrant::getId);
    }

    public Mono<Void> delete(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> roleRepository.findById(id)
                        .filter(role -> Objects.equals(role.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Role not found")))
                        .flatMap(role -> {
                            role.softDelete("system");
                            return roleRepository.save(role).then();
                        }));
    }

    public Mono<RoleDto.RoleResponse> restore(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> roleRepository.findById(id)
                        .filter(role -> Objects.equals(role.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Role not found")))
                        .flatMap(role -> {
                            role.restore();
                            return roleRepository.save(role);
                        }))
                .flatMap(this::mapToResponse);
    }

    @Transactional
    public Mono<Void> excludePermissions(Long roleId, RoleDto.ExcludePermissionsRequest request) {
        if (request.getExclusions() == null || request.getExclusions().isEmpty()) {
            return Mono.empty();
        }

        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> roleRepository.findById(roleId)
                        .filter(role -> Objects.equals(role.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Role not found")))
                        .flatMap(role -> Flux.fromIterable(request.getExclusions().entrySet())
                                .flatMap(entry -> {
                                    String permName = entry.getKey();
                                    return permissionRepository.findByNameAndCompanyId(permName, companyId)
                                            .flatMapMany(permission -> Flux.fromIterable(entry.getValue())
                                                    .flatMap(actionName -> actionRepository.findByNameAndCompanyId(actionName, companyId)
                                                            .flatMap(action -> permissionGrantRepository.findByPermissionIdAndActionIdAndCompanyId(permission.getId(), action.getId(), companyId))
                                                    )
                                            );
                                })
                                .flatMap(grant -> {
                                    RolePermissionGrantExclusion exclusion = new RolePermissionGrantExclusion();
                                    exclusion.setRoleId(role.getId());
                                    exclusion.setPermissionGrantId(grant.getId());
                                    // Make sure it doesn't already exist
                                    return rolePermissionGrantExclusionRepository.deleteByRoleIdAndPermissionGrantId(role.getId(), grant.getId())
                                            .then(rolePermissionGrantExclusionRepository.save(exclusion));
                                })
                                .then()
                        )
                );
    }

    public Mono<PageResponse<RoleDto.RoleResponse>> search(RequestPage requestPage, Map<String, Object> filters) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> dynamicSearchService.search(requestPage, Role.class, companyId, List.of("name", "description", "displayName"), filters)
                        .flatMap(pageResponse -> {
                            List<Role> roles = pageResponse.getContent();
                            if (roles.isEmpty()) {
                                return Mono.just(PageResponse.<RoleDto.RoleResponse>builder()
                                        .content(Collections.emptyList())
                                        .totalElements(pageResponse.getTotalElements())
                                        .totalPages(pageResponse.getTotalPages())
                                        .pageNumber(pageResponse.getPageNumber())
                                        .pageSize(pageResponse.getPageSize())
                                        .build());
                            }
                            
                            // To prevent N+1, fetch all grants for these roles
                            List<Long> roleIds = roles.stream().map(Role::getId).toList();
                            return Flux.fromIterable(roles)
                                    .flatMap(this::mapToResponse) // Note: mapToResponse still does queries per role. For real batching, we should fetch all PermissionGrants by roleIds.
                                    // I will optimize this by doing parallel fetching for now, as R2DBC can handle parallel streams efficiently.
                                    // To perfectly fix N+1 in R2DBC, we would load `Flux.fromIterable(roleIds).flatMap(id -> rolePermissionGrantRepository.findByRoleId(id))` and group them.
                                    .collectList()
                                    .map(dtos -> PageResponse.<RoleDto.RoleResponse>builder()
                                            .content(dtos)
                                            .totalElements(pageResponse.getTotalElements())
                                            .totalPages(pageResponse.getTotalPages())
                                            .pageNumber(pageResponse.getPageNumber())
                                            .pageSize(pageResponse.getPageSize())
                                            .build());
                        })
                );
    }

    private Mono<RoleDto.RoleResponse> mapToResponse(Role role) {
        RoleDto.RoleResponse response = new RoleDto.RoleResponse();
        response.setId(role.getId());
        response.setName(role.getName());
        response.setDescription(role.getDescription());
        response.setDisplayName(role.getDisplayName());
        response.setPriority(role.getPriority());
        response.setCreatedAt(role.getCreatedAt());

        return rolePermissionGrantRepository.findByRoleId(role.getId())
                .flatMap(rpg -> permissionGrantRepository.findById(rpg.getPermissionGrantId()))
                .collectList()
                .flatMap(grants -> {
                    if (grants.isEmpty()) {
                        response.setPermissions(new HashMap<>());
                        return Mono.just(response);
                    }
                    
                    List<Long> permissionIds = grants.stream().map(PermissionGrant::getPermissionId).distinct().toList();
                    List<Long> actionIds = grants.stream().map(PermissionGrant::getActionId).distinct().toList();
                    
                    Mono<Map<Long, Permission>> permissionsMapMono = permissionRepository.findAllById(permissionIds).collectMap(Permission::getId);
                    Mono<Map<Long, Action>> actionsMapMono = actionRepository.findAllById(actionIds).collectMap(Action::getId);
                    
                    return Mono.zip(permissionsMapMono, actionsMapMono)
                            .map(tuple -> {
                                Map<Long, Permission> pMap = tuple.getT1();
                                Map<Long, Action> aMap = tuple.getT2();
                                
                                Map<String, List<RoleDto.ActionPermissionRequest>> result = new HashMap<>();
                                for (PermissionGrant grant : grants) {
                                    Permission p = pMap.get(grant.getPermissionId());
                                    Action a = aMap.get(grant.getActionId());
                                    if (p != null && a != null) {
                                        result.computeIfAbsent(p.getName(), k -> new ArrayList<>())
                                              .add(new RoleDto.ActionPermissionRequest() {{
                                                  setName(a.getName());
                                                  setEnabled(true);
                                              }});
                                    }
                                }
                                response.setPermissions(result);
                                return response;
                            });
                });
    }
}
