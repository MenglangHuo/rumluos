package com.menglang.rumluos.domain.product.repository;

import com.menglang.rumluos.domain.product.entity.Product;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ProductRepository extends ReactiveCrudRepository<Product, Long>, ReactiveSortingRepository<Product, Long> {

    @Query("SELECT * FROM \"products\" WHERE \"id\" = :id AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Product> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT * FROM \"products\" WHERE LOWER(\"name\") LIKE :nameQuery AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Product> searchByNameAndCompanyId(String nameQuery, Long companyId);

    @Query("SELECT * FROM \"products\" WHERE \"category_id\" = :categoryId AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Product> findByCategoryIdAndCompanyId(Long categoryId, Long companyId);

    @Query("SELECT * FROM \"products\" WHERE \"brand_id\" = :brandId AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Product> findByBrandIdAndCompanyId(Long brandId, Long companyId);

    @Query("SELECT * FROM \"products\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Product> findByCompanyId(Long companyId);

    @Query("SELECT * FROM \"products\" WHERE \"serial_number\" = :serialNumber AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Product> findBySerialNumberAndCompanyId(String serialNumber, Long companyId);

    /**
     * Search products by matching JSONB attributes using PostgreSQL GIN index containment operator (@>).
     * e.g. jsonQuery = '{"color": "red"}'
     */
    @Query("SELECT * FROM \"products\" WHERE \"attributes\" @> :jsonQuery::jsonb AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Product> searchByAttributesAndCompanyId(String jsonQuery, Long companyId);
}

