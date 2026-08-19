package com.menglang.rumluos.domain.product.repository;

import com.menglang.rumluos.domain.product.entity.Brand;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface BrandRepository extends ReactiveCrudRepository<Brand, Long> {

    @Query("SELECT * FROM \"brands\" WHERE \"id\" = :id AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Brand> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT * FROM \"brands\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Brand> findByCompanyId(Long companyId);

    @Query("SELECT * FROM \"brands\" WHERE LOWER(\"name\") LIKE :nameQuery AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Brand> searchByNameAndCompanyId(String nameQuery, Long companyId);

    @Query("SELECT * FROM \"brands\" WHERE \"is_active\" = :isActive AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Brand> findByIsActiveAndCompanyId(boolean isActive, Long companyId);
}

