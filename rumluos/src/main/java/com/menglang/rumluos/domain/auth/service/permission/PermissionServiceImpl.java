package com.menglang.rumluos.domain.auth.service.permission;

import com.menglang.rumluos.domain.auth.dto.PermissionDto;
import com.menglang.rumluos.domain.auth.entity.Action;
import com.menglang.rumluos.domain.auth.entity.Permission;
import com.menglang.rumluos.domain.auth.entity.PermissionGrant;
import com.menglang.rumluos.domain.auth.repository.ActionRepository;
import com.menglang.rumluos.domain.auth.repository.PermissionGrantRepository;
import com.menglang.rumluos.domain.auth.repository.PermissionRepository;
import com.menglang.rumluos.domain.company.repository.CompanyRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionGrantRepository grantRepository;
    private final ActionRepository actionRepository;
    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Mono<Integer> seedPermissionsForCompany(Long companyId) {
        return companyRepository.findById(companyId)
                .flatMap(company -> {
                    boolean alreadySeeded = company.getMetaData() != null && 
                            company.getMetaData().has("seeded_permission") && 
                            company.getMetaData().get("seeded_permission").asBoolean();
                    
                    if (alreadySeeded) {
                        log.info("Permissions already seeded for company {}", companyId);
                        return Mono.just(0);
                    }
                    
                    return resolveActionMap(companyId)
                            .flatMap(actionMap -> seedAllDefinitions(companyId, actionMap, false))
                            .flatMap(count -> {
                                ObjectNode meta = company.getMetaData() != null && company.getMetaData().isObject()
                                        ? (ObjectNode) company.getMetaData() 
                                        : objectMapper.createObjectNode();
                                meta.put("seeded_permission", true);
                                company.setMetaData(meta);
                                return companyRepository.save(company).thenReturn(count);
                            });
                })
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Company not found: " + companyId)));
    }

    @Override
    public Mono<Integer> reseedMissingPermissions(Long companyId) {
        return resolveActionMap(companyId)
                .flatMap(actionMap -> seedAllDefinitions(companyId, actionMap, true));
    }

    @Override
    public Flux<PermissionDto.PermissionWithGrantsResponse> getAllPermissions(Long companyId) {
        return permissionRepository.findAllActiveByCompanyId(companyId)
                .switchIfEmpty(reseedMissingPermissions(companyId).thenMany(permissionRepository.findAllActiveByCompanyId(companyId)))
                .flatMap(permission -> buildPermissionWithGrants(permission, companyId));
    }

    @Override
    public Flux<PermissionDto.ActionResponse> getAllActions() {
        return actionRepository.findAll()
                .map(a -> new PermissionDto.ActionResponse(a.getId(), a.getName(), a.getDescription()));
    }


    //+++++++++++++++++++++Helper Method+++++++++++++++++++++

    private Mono<Map<String, Action>> resolveActionMap(Long companyId) {
        // Collect all unique action names from the definition registry
        var allActionNames = PermissionSeedDefinition.DEFINITIONS.stream()
                .flatMap(d -> d.getActions().stream())
                .collect(Collectors.toSet());

        return actionRepository.findAllByNameInAndCompanyId(allActionNames, companyId)
                .collectMap(Action::getName, Function.identity())
                .flatMap(existing -> {
                    var missing = allActionNames.stream()
                            .filter(n -> !existing.containsKey(n))
                            .map(n -> {
                                var a = new Action();
                                a.setCompanyId(companyId);
                                a.setName(n);
                                a.setDescription(n + " Action");
                                return a;
                            }).toList();
                    if (missing.isEmpty()) return Mono.just(existing);
                    return actionRepository.saveAll(missing)
                            .collectMap(Action::getName, Function.identity())
                            .map(saved -> {
                                existing.putAll(saved);
                                return existing;
                            });
                });
    }

    private Mono<Integer> seedAllDefinitions(
            Long companyId,
            Map<String, Action> actionMap,
            boolean skipIfExists) {

        return Flux.fromIterable(PermissionSeedDefinition.DEFINITIONS)
                .concatMap(def -> seedSingleDomain(companyId, actionMap, def, skipIfExists))
                .reduce(0, Integer::sum);
    }

    private Mono<Integer> seedSingleDomain(
            Long companyId,
            Map<String, Action> actionMap,
            PermissionSeedDefinition.DomainPermission def,
            boolean skipIfExists
    ) {
        Mono<Permission> permissionMono = permissionRepository.findByNameAndCompanyId(
                def.getDomain(), companyId
        ).switchIfEmpty(createPermission(def, companyId));

        return permissionMono.flatMap(permission ->
                Flux.fromIterable(def.getActions())
                        .concatMap(actionName -> {
                            Action action = actionMap.get(actionName);
                            if (action == null) return Mono.just(0);

                            return grantRepository
                                    .existsByPermissionIdAndActionIdAndCompanyId(
                                            permission.getId(), action.getId(), companyId)
                                    .flatMap(exists -> {
                                        if (exists && skipIfExists) return Mono.just(0);
                                        if (exists) return Mono.just(0); // idempotent

                                        PermissionGrant grant = new PermissionGrant();
                                        grant.setPermissionId(permission.getId());
                                        grant.setActionId(action.getId());
                                        grant.setCompanyId(companyId);
                                        grant.setDisabled(false);

                                        return grantRepository.save(grant).thenReturn(1);
                                    });
                        })
                        .reduce(0, Integer::sum)
        );
    }


    private Mono<Permission> createPermission(PermissionSeedDefinition.DomainPermission def, Long companyId) {
        Permission p = new Permission();
        p.setName(def.getDomain());
        p.setDescription(def.getDescription());
        p.setCompanyId(companyId);
        return permissionRepository.save(p);
    }
    private Mono<PermissionDto.PermissionWithGrantsResponse> buildPermissionWithGrants(Permission permission, Long companyId) {
        return grantRepository
                .findAllByPermissionIdAndCompanyId(permission.getId(), companyId)
                .flatMap(grant -> actionRepository.findById(grant.getActionId())
                        .map(action -> new PermissionDto.GrantedActionResponse(
                                grant.getId(),
                                action.getId(),
                                action.getName(),
                                Boolean.TRUE.equals(grant.getDisabled()))))
                .collectList()
                .map(grants -> new PermissionDto.PermissionWithGrantsResponse(
                        permission.getId(),
                        permission.getName(),
                        permission.getDescription(),
                        permission.getCompanyId(),
                        grants));
    }



}
