package com.menglang.rumluos.domain.company.repository;

import com.menglang.rumluos.domain.company.entity.Company;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CompanyRepository extends ReactiveCrudRepository<Company, Long>,
        ReactiveSortingRepository<Company, Long> {

    // ── Find helpers ───────────────────────────────────────────────────────────

    @Query("SELECT * FROM \"companies\" WHERE \"id\" = :id AND \"deleted_at\" IS NULL")
    Mono<Company> findByIdAndNotDeleted(Long id);

    /** Used by restore() — must find soft-deleted rows too. */
    @Query("SELECT * FROM \"companies\" WHERE \"id\" = :id")
    Mono<Company> findByIdIncludingDeleted(Long id);

    @Query("SELECT * FROM \"companies\" WHERE \"deleted_at\" IS NULL ORDER BY \"id\"")
    Flux<Company> findAllNotDeleted();

    // ── Search + count (paginated getAll) ─────────────────────────────────────

    Flux<Company> findAllByDeletedAtIsNull(Pageable pageable);

    Mono<Long> countAllByDeletedAtIsNull();

    @Query("""
            SELECT * FROM "companies"
            WHERE "deleted_at" IS NULL
              AND (LOWER("name") LIKE :query OR LOWER("email") LIKE :query)
            """)
    Flux<Company> searchAll(String query, Pageable pageable);

    @Query("""
            SELECT COUNT(*) FROM "companies"
            WHERE "deleted_at" IS NULL
              AND (LOWER("name") LIKE :query OR LOWER("email") LIKE :query)
            """)
    Mono<Long> countSearch(String query);

    // ── Legacy name search ─────────────────────────────────────────────────────

    @Query("SELECT * FROM \"companies\" WHERE LOWER(\"name\") LIKE :nameQuery AND \"deleted_at\" IS NULL")
    Flux<Company> searchByName(String nameQuery);

    @Query("SELECT COUNT(*) FROM \"companies\" WHERE \"deleted_at\" IS NULL")
    Mono<Long> countAllNotDeleted();

    // ── Existence checks ───────────────────────────────────────────────────────

    @Query("SELECT EXISTS(SELECT 1 FROM \"companies\" WHERE LOWER(\"email\") = LOWER(:email) AND \"deleted_at\" IS NULL)")
    Mono<Boolean> existsByEmailIgnoreCase(String email);

    @Query("UPDATE \"companies\" SET \"deleted_at\" = now() WHERE \"id\" = :id AND \"deleted_at\" IS NULL")
    Mono<Long> softDeleteById(Long id);

    Mono<Boolean> existsByEmailAndDeletedAtIsNull(String email);

    Mono<Boolean> existsByEmailAndIdNotAndDeletedAtIsNull(String email, Long id);

    Mono<Boolean> existsByNameAndDeletedAtIsNull(String name);

    Mono<Boolean> existsByNameAndIdNotAndDeletedAtIsNull(String name, Long id);
}

