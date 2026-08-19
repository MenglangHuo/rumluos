package com.menglang.rumluos.domain.auth.service.user;

import com.menglang.rumluos.common.exception.BadRequestException;
import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.service.DynamicSearchService;
import com.menglang.rumluos.domain.auth.dto.AuthDto;
import com.menglang.rumluos.domain.auth.dto.RoleDto;
import com.menglang.rumluos.domain.auth.dto.UserDto;
import com.menglang.rumluos.domain.auth.entity.*;
import com.menglang.rumluos.domain.auth.repository.*;
import com.menglang.rumluos.domain.company.entity.Branch;
import com.menglang.rumluos.domain.company.entity.Company;
import com.menglang.rumluos.domain.company.entity.Staff;
import com.menglang.rumluos.domain.company.repository.BranchRepository;
import com.menglang.rumluos.domain.company.repository.CompanyRepository;
import com.menglang.rumluos.domain.company.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionGrantRepository rolePermissionGrantRepository;
    private final RolePermissionGrantExclusionRepository rolePermissionGrantExclusionRepository;
    private final UserPermissionGrantRepository userPermissionGrantRepository;
    private final UserPermissionGrantExclusionRepository userPermissionGrantExclusionRepository;
    private final PermissionGrantRepository permissionGrantRepository;
    private final PermissionRepository permissionRepository;
    private final ActionRepository actionRepository;
    private final StaffRepository staffRepository;
    private final BranchRepository branchRepository;
    private final CompanyRepository companyRepository;
    private final SystemAdminRepository systemAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final DynamicSearchService dynamicSearchService;

    @Transactional
    public Mono<UserDto.UserResponse> register(AuthDto.RegisterByAdminRequest request, List<Long> roleIds) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> userRepository.existsByUsernameOrEmail(request.getUsername(), request.getEmail())
                        .flatMap(exists -> {
                            if (exists) {
                                return Mono.error(new BadRequestException("Username or email already exists"));
                            }
                            User user = new User();
                            user.setUsername(request.getUsername());
                            user.setEmail(request.getEmail());
                            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                            user.setFirstName(request.getFirstName());
                            user.setLastName(request.getLastName());
                            user.setContact(request.getContact());
                            user.setCompanyId(companyId);
                            user.setTokenVersion(0);
                            user.setLoginAttempt((short) 0);
                            user.setStatus(User.Status.ACTIVE);
                            
                            return userRepository.save(user)
                                    .flatMap(savedUser -> Flux.fromIterable(roleIds != null ? roleIds : Collections.<Long>emptyList())
                                            .flatMap(roleId -> {
                                                UserRole ur = new UserRole();
                                                ur.setUserId(savedUser.getId());
                                                ur.setRoleId(roleId);
                                                return userRoleRepository.save(ur);
                                            })
                                            .then(Mono.just(savedUser))
                                    );
                        })
                )
                .flatMap(this::mapToResponse);
    }

    @Transactional
    public Mono<UserDto.UserResponse> update(Long userId, UserDto.UpdateUserRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> userRepository.findById(userId)
                        .filter(u -> Objects.equals(u.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                        .flatMap(user -> {
                            if (request.getEmail() != null) user.setEmail(request.getEmail());
                            if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
                            if (request.getLastName() != null) user.setLastName(request.getLastName());
                            if (request.getContact() != null) user.setContact(request.getContact());
                            if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
                            else if (request.getAvatarKey() != null) user.setAvatarUrl(request.getAvatarKey());
                            if (request.getIsActive() != null) user.setActive(request.getIsActive());
                            
                            return userRepository.save(user)
                                    .flatMap(savedUser -> {
                                        if (request.getRoleIds() != null) {
                                            return userRoleRepository.deleteByUserId(savedUser.getId())
                                                    .thenMany(Flux.fromIterable(request.getRoleIds())
                                                            .flatMap(roleId -> {
                                                                UserRole ur = new UserRole();
                                                                ur.setUserId(savedUser.getId());
                                                                ur.setRoleId(roleId);
                                                                return userRoleRepository.save(ur);
                                                            })
                                                    ).then(Mono.just(savedUser));
                                        }
                                        return Mono.just(savedUser);
                                    });
                        })
                )
                .flatMap(this::mapToResponse);
    }

    public Mono<UserDto.UserResponse> getById(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> userRepository.findById(id)
                        .filter(u -> Objects.equals(u.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                        .flatMap(this::mapToResponse)
                );
    }

    public Mono<Void> delete(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> userRepository.findById(id)
                        .filter(u -> Objects.equals(u.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                        .flatMap(user -> {
                            user.softDelete("admin");
                            return userRepository.save(user).then();
                        })
                );
    }

    public Mono<UserDto.UserResponse> restore(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> userRepository.findById(id)
                        .filter(u -> Objects.equals(u.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                        .flatMap(user -> {
                            user.restore();
                            return userRepository.save(user);
                        })
                        .flatMap(this::mapToResponse)
                );
    }

    public Mono<PageResponse<UserDto.UserResponse>> search(RequestPage requestPage, Map<String, Object> filters) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> dynamicSearchService.search(requestPage, User.class, companyId, List.of("username", "email", "first_name", "last_name", "contact"), filters)
                        .flatMap(pageResponse -> {
                            List<User> users = pageResponse.getContent();
                            if (users.isEmpty()) {
                                return Mono.just(PageResponse.<UserDto.UserResponse>builder()
                                        .content(Collections.emptyList())
                                        .totalElements(pageResponse.getTotalElements())
                                        .totalPages(pageResponse.getTotalPages())
                                        .pageNumber(pageResponse.getPageNumber())
                                        .pageSize(pageResponse.getPageSize())
                                        .build());
                            }
                            // Parallel mapping to avoid N+1 bottleneck, proper fix requires custom batch queries.
                            return Flux.fromIterable(users)
                                    .flatMap(this::mapToResponse)
                                    .collectList()
                                    .map(dtos -> PageResponse.<UserDto.UserResponse>builder()
                                            .content(dtos)
                                            .totalElements(pageResponse.getTotalElements())
                                            .totalPages(pageResponse.getTotalPages())
                                            .pageNumber(pageResponse.getPageNumber())
                                            .pageSize(pageResponse.getPageSize())
                                            .build());
                        })
                );
    }

    @Transactional
    public Mono<Void> addPermissions(Long userId, UserDto.AddPermissionsRequest request) {
        if (request.getPermissions() == null || request.getPermissions().isEmpty()) return Mono.empty();
        
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> userRepository.findById(userId)
                        .filter(u -> Objects.equals(u.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                        .flatMap(user -> Flux.fromIterable(request.getPermissions().entrySet())
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
                                .flatMap(grant -> {
                                    UserPermissionGrant userGrant = new UserPermissionGrant();
                                    userGrant.setUserId(user.getId());
                                    userGrant.setPermissionGrantId(grant.getId());
                                    // Make sure we don't save duplicates
                                    return userPermissionGrantRepository.deleteByUserIdAndPermissionGrantId(user.getId(), grant.getId())
                                            .then(userPermissionGrantRepository.save(userGrant));
                                })
                                .then()
                        )
                );
    }

    @Transactional
    public Mono<Void> excludePermissions(Long userId, UserDto.ExcludePermissionsRequest request) {
        if (request.getExclusions() == null || request.getExclusions().isEmpty()) return Mono.empty();

        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> userRepository.findById(userId)
                        .filter(u -> Objects.equals(u.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                        .flatMap(user -> Flux.fromIterable(request.getExclusions().entrySet())
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
                                    UserPermissionGrantExclusion exclusion = new UserPermissionGrantExclusion();
                                    exclusion.setUserId(user.getId());
                                    exclusion.setPermissionGrantId(grant.getId());
                                    return userPermissionGrantExclusionRepository.deleteByUserIdAndPermissionGrantId(user.getId(), grant.getId())
                                            .then(userPermissionGrantExclusionRepository.save(exclusion));
                                })
                                .then()
                        )
                );
    }

    public Mono<UserDto.UserResponse> getMe(Long userId, boolean isSystemAdmin) {
        if (isSystemAdmin) {
            return systemAdminRepository.findById(userId)
                    .switchIfEmpty(Mono.error(new NotFoundException("System Admin not found")))
                    .map(admin -> {
                        UserDto.UserResponse response = new UserDto.UserResponse();
                        response.setId(admin.getId());
                        response.setUsername(admin.getUsername());
                        response.setEmail(admin.getEmail());
                        response.setFirstName(admin.getFirstName());
                        response.setLastName(admin.getLastName());
                        response.setActive(admin.isActive());
                        response.setSystemAdmin(true);
                        response.setGrants(List.of("ROLE_SYSTEM_ADMIN"));
                        response.setLastLoginAt(admin.getLastLoginAt());
                        response.setCreatedAt(admin.getCreatedAt());
                        return response;
                    });
        }
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                .flatMap(this::mapToResponse);
    }

    @Transactional
    public Mono<UserDto.UserResponse> updateMe(Long userId, UserDto.UpdateMeProfileRequest request) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                .flatMap(user -> {
                    if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
                    if (request.getLastName() != null) user.setLastName(request.getLastName());
                    if (request.getContact() != null) user.setContact(request.getContact());
                    if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
                    else if (request.getAvatarKey() != null) user.setAvatarUrl(request.getAvatarKey());
                    return userRepository.save(user);
                })
                .flatMap(this::mapToResponse);
    }

    @Transactional
    public Mono<Void> changePassword(Long userId, UserDto.ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return Mono.error(new BadRequestException("New password and confirm password do not match"));
        }
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new NotFoundException("User not found")))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                        return Mono.error(new BadRequestException("Current password is incorrect"));
                    }
                    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                    return userRepository.save(user).then();
                });
    }

    private Mono<UserDto.UserResponse> mapToResponse(User user) {
        UserDto.UserResponse response = new UserDto.UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setContact(user.getContact());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setActive(user.isActive());
        response.setSystemAdmin(false);
        response.setCompanyId(user.getCompanyId());
        response.setLastLoginAt(user.getLastLoginAt());
        response.setCreatedAt(user.getCreatedAt());

        Mono<Void> companyMono = user.getCompanyId() != null
                ? companyRepository.findById(user.getCompanyId())
                        .doOnNext(c -> response.setCompanyName(c.getName()))
                        .then()
                : Mono.empty();

        Mono<Void> staffMono = user.getCompanyId() != null
                ? staffRepository.findByUserIdAndCompanyId(user.getId(), user.getCompanyId())
                        .flatMap(staff -> {
                            UserDto.StaffSummaryDto staffDto = new UserDto.StaffSummaryDto();
                            staffDto.setId(staff.getId());
                            staffDto.setName(staff.getName());
                            staffDto.setPosition(staff.getPosition());
                            staffDto.setPhone(staff.getPhone());
                            staffDto.setEmail(staff.getEmail());
                            staffDto.setBranchId(staff.getBranchId());
                            staffDto.setUrgentContactName(staff.getUrgentContactName());
                            staffDto.setUrgentContactPhone(staff.getUrgentContactPhone());
                            staffDto.setSalary(staff.getSalary());
                            staffDto.setActive(staff.isActive());

                            response.setStaffInfo(staffDto);
                            response.setBranchId(staff.getBranchId());

                            if (staff.getBranchId() != null) {
                                return branchRepository.findById(staff.getBranchId())
                                        .doOnNext(b -> {
                                            staffDto.setBranchName(b.getName());
                                            response.setBranchName(b.getName());
                                        })
                                        .then();
                            }
                            return Mono.empty();
                        })
                        .then()
                : Mono.empty();

        return Mono.when(companyMono, staffMono)
                .then(userRoleRepository.findByUserId(user.getId())
                        .map(UserRole::getRoleId)
                        .collectList()
                        .flatMap(roleIds -> {
                            response.setRoleIds(roleIds);
                            
                            // Fetch all permission grants from roles
                            Mono<List<Long>> roleGrantsMono = Flux.fromIterable(roleIds)
                                    .flatMap(rolePermissionGrantRepository::findByRoleId)
                                    .map(RolePermissionGrant::getPermissionGrantId)
                                    .collectList();
                            
                            // Fetch all permission exclusions from roles
                            Mono<List<Long>> roleExclusionsMono = Flux.fromIterable(roleIds)
                                    .flatMap(rolePermissionGrantExclusionRepository::findByRoleId)
                                    .map(RolePermissionGrantExclusion::getPermissionGrantId)
                                    .collectList();
                            
                            // Fetch all direct permission grants for user
                            Mono<List<Long>> userGrantsMono = userPermissionGrantRepository.findByUserId(user.getId())
                                    .map(UserPermissionGrant::getPermissionGrantId)
                                    .collectList();
                            
                            // Fetch all direct permission exclusions for user
                            Mono<List<Long>> userExclusionsMono = userPermissionGrantExclusionRepository.findByUserId(user.getId())
                                    .map(UserPermissionGrantExclusion::getPermissionGrantId)
                                    .collectList();

                            return Mono.zip(roleGrantsMono, roleExclusionsMono, userGrantsMono, userExclusionsMono)
                                    .flatMap(tuple -> {
                                        Set<Long> effectiveGrantIds = new HashSet<>(tuple.getT1()); // Roles grants
                                        effectiveGrantIds.addAll(tuple.getT3()); // + User direct grants
                                        effectiveGrantIds.removeAll(tuple.getT2()); // - Roles exclusions
                                        effectiveGrantIds.removeAll(tuple.getT4()); // - User exclusions
                                        
                                        if (effectiveGrantIds.isEmpty()) {
                                            response.setPermissions(new HashMap<>());
                                            return Mono.just(response);
                                        }
                                        
                                        return permissionGrantRepository.findAllById(effectiveGrantIds)
                                                .collectList()
                                                .flatMap(grants -> {
                                                    List<Long> permissionIds = grants.stream().map(PermissionGrant::getPermissionId).distinct().toList();
                                                    List<Long> actionIds = grants.stream().map(PermissionGrant::getActionId).distinct().toList();
                                                    
                                                    return Mono.zip(
                                                            permissionRepository.findAllById(permissionIds).collectMap(Permission::getId),
                                                            actionRepository.findAllById(actionIds).collectMap(Action::getId)
                                                    ).map(maps -> {
                                                        Map<Long, Permission> pMap = maps.getT1();
                                                        Map<Long, Action> aMap = maps.getT2();
                                                        
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
                                    });
                        }));
    }
}
