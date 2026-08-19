package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.Otp;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Repository
public interface OtpRepository extends R2dbcRepository<Otp, Long> {
    Mono<Otp> findByEmailAndOtpCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
            String email, String otpCode, String purpose, Instant now);
}
