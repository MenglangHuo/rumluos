package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.Permission;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PermissionRepository extends R2dbcRepository<Permission,Long> {
    Flux<Permission> findAllByCompanyId(Long companyId);

    Mono<Permission> findByNameAndCompanyId(String name, Long companyId);

    Mono<Boolean> existsByNameAndCompanyId(String name, Long companyId);

    @Query("""
        SELECT "p".* FROM "permissions" "p"
        WHERE "p"."company_id" = :companyId
          AND "p"."deleted_at" IS NULL
        ORDER BY "p"."name" ASC
        """)
    Flux<Permission> findAllActiveByCompanyId(Long companyId);
}

