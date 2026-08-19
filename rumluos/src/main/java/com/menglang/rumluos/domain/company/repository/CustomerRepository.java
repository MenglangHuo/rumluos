package com.menglang.rumluos.domain.company.repository;

import com.menglang.rumluos.domain.company.entity.Customer;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CustomerRepository extends ReactiveCrudRepository<Customer, Long>,
        ReactiveSortingRepository<Customer, Long> {
    @Query("SELECT * FROM \"customers\" WHERE \"id\" = :id AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Customer> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT * FROM \"customers\" WHERE LOWER(\"name\") LIKE :nameQuery AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Customer> searchByNameAndCompanyId(String nameQuery, Long companyId);

    @Query("SELECT * FROM \"customers\" WHERE \"phone\" = :phone AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Customer> findByPhoneAndCompanyId(String phone, Long companyId);

    @Query("SELECT * FROM \"customers\" WHERE \"national_id\" = :nationalId AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Customer> findByNationalIdAndCompanyId(String nationalId, Long companyId);

    @Query("SELECT * FROM \"customers\" WHERE \"is_active\" = :isActive AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Flux<Customer> findAllByIsActiveAndCompanyId(boolean isActive, Long companyId);

    @Query("SELECT COUNT(*) FROM \"customers\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Long> countAllByCompanyId(Long companyId);

    @Query("SELECT EXISTS(SELECT 1 FROM \"customers\" WHERE \"phone\" = :phone AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL)")
    Mono<Boolean> existsByPhoneAndCompanyId(String phone, Long companyId);

    @Query("UPDATE \"customers\" SET \"deleted_at\" = now() WHERE \"id\" = :id AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Long> softDeleteByIdAndCompanyId(Long id, Long companyId);
}

