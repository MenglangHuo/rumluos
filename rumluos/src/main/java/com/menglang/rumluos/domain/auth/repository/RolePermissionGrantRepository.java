package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.RolePermissionGrant;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface RolePermissionGrantRepository extends R2dbcRepository<RolePermissionGrant, Long> {
    Flux<RolePermissionGrant> findByRoleId(Long roleId);
    Mono<Void> deleteByRoleId(Long roleId);
    Mono<Void> deleteByRoleIdAndPermissionGrantId(Long roleId, Long permissionGrantId);
}
