package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.UserPermissionGrant;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserPermissionGrantRepository extends R2dbcRepository<UserPermissionGrant, Long> {
    Flux<UserPermissionGrant> findByUserId(Long userId);
    Mono<Void> deleteByUserIdAndPermissionGrantId(Long userId, Long permissionGrantId);
}
