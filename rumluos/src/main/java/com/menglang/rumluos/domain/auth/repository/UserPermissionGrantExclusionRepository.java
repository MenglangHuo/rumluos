package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.UserPermissionGrantExclusion;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserPermissionGrantExclusionRepository extends R2dbcRepository<UserPermissionGrantExclusion, Long> {
    Flux<UserPermissionGrantExclusion> findByUserId(Long userId);
    Mono<Void> deleteByUserIdAndPermissionGrantId(Long userId, Long permissionGrantId);
}
