package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.PermissionGrant;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PermissionGrantRepository extends R2dbcRepository<PermissionGrant, Long> {
    Flux<PermissionGrant> findAllByPermissionIdAndCompanyId(Long permissionId, Long companyId);

    Mono<PermissionGrant> findByPermissionIdAndActionIdAndCompanyId(
            Long permissionId, Long actionId, Long companyId);

    Mono<Boolean> existsByPermissionIdAndActionIdAndCompanyId(
            Long permissionId, Long actionId, Long companyId);

    Flux<PermissionGrant> findAllByCompanyId(Long companyId);

    @Query("""
            SELECT "pg".* FROM "permission_grants" "pg"
            JOIN "permissions" "p" ON "p"."id" = "pg"."permission_id"
            WHERE "p"."name" = :permissionName
              AND "pg"."company_id" = :companyId
              AND "pg"."disabled" = false
              AND "pg"."deleted_at" IS NULL
            """)
    Flux<PermissionGrant> findActiveGrantsByPermissionNameAndCompany(
            String permissionName, Long companyId);
}

