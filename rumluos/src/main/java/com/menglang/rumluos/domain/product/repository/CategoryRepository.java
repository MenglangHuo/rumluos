package com.menglang.rumluos.domain.product.repository;

import com.menglang.rumluos.domain.product.entity.Category;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CategoryRepository extends ReactiveCrudRepository<Category, Long> {

    @Query("SELECT * FROM \"categories\" WHERE \"id\" = :id AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Category> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT * FROM \"categories\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"sort_order\" ASC NULLS LAST, \"name\" ASC")
    Flux<Category> findByCompanyId(Long companyId);

    @Query("SELECT * FROM \"categories\" WHERE \"parent_id\" IS NULL AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"sort_order\" ASC NULLS LAST, \"name\" ASC")
    Flux<Category> findRootCategoriesByCompanyId(Long companyId);

    @Query("SELECT * FROM \"categories\" WHERE \"parent_id\" = :parentId AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"sort_order\" ASC NULLS LAST, \"name\" ASC")
    Flux<Category> findByParentIdAndCompanyId(Long parentId, Long companyId);

    @Query("SELECT * FROM \"categories\" WHERE LOWER(\"name\") LIKE :nameQuery AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Category> searchByNameAndCompanyId(String nameQuery, Long companyId);
}

