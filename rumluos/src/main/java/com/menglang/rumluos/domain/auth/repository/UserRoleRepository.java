package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.UserRole;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserRoleRepository extends R2dbcRepository<UserRole, Long> {
    Flux<UserRole> findByUserId(Long userId);
    Mono<Void> deleteByUserId(Long userId);
}
