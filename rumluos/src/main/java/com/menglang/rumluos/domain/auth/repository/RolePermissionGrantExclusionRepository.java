package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.RolePermissionGrantExclusion;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface RolePermissionGrantExclusionRepository extends R2dbcRepository<RolePermissionGrantExclusion, Long> {
    Flux<RolePermissionGrantExclusion> findByRoleId(Long roleId);
    Mono<Void> deleteByRoleIdAndPermissionGrantId(Long roleId, Long permissionGrantId);
}
