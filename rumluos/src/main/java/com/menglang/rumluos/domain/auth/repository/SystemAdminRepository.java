package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.SystemAdmin;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface SystemAdminRepository extends R2dbcRepository<SystemAdmin, Long> {
    Mono<SystemAdmin> findByUsername(String username);
    Mono<SystemAdmin> findByEmail(String email);
    Mono<SystemAdmin> findByAdminKey(java.util.UUID adminKey);
    @Query("SELECT CASE WHEN COUNT(\"u\".\"id\") > 0 THEN true ELSE false END FROM \"system_admins\" \"u\" WHERE \"u\".\"username\" = :username OR \"u\".\"email\" = :email")
    Mono<Boolean> existsByUsernameOrEmail(String username, String email);
}

