package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.RefreshToken;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Repository
public interface RefreshTokenRepository extends R2dbcRepository<RefreshToken, Long> {
    Mono<RefreshToken> findByTokenSignatureAndIsRevokedFalseAndExpiresAtAfter(String signature, Instant now);
    Mono<Void> deleteByUserIdAndUserType(Long userId, String userType);
}
