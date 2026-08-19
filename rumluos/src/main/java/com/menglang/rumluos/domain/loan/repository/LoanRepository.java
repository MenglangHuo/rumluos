package com.menglang.rumluos.domain.loan.repository;

import com.menglang.rumluos.domain.loan.entity.Loan;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.data.repository.reactive.ReactiveSortingRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive repository for {@link Loan}.
 *
 * <p>Every query is scoped to {@code company_id} to enforce SaaS tenant isolation.
 * No loan record is accessible without a matching companyId.
 */
@Repository
public interface LoanRepository extends ReactiveCrudRepository<Loan, Long>, ReactiveSortingRepository<Loan, Long> {

    /** Find a loan by its human-readable key within the tenant's scope. */
    @Query("SELECT * FROM \"loans\" WHERE \"loan_key\" = :loanKey AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Loan> findByLoanKeyAndCompanyId(String loanKey, Long companyId);

    /** Find all loans for a customer within the tenant. */
    @Query("SELECT * FROM \"loans\" WHERE \"customer_id\" = :customerId AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"created_at\" DESC")
    Flux<Loan> findByCustomerIdAndCompanyId(Long customerId, Long companyId);

    /** Find all loans in a specific status for a customer within the tenant. */
    @Query("SELECT * FROM \"loans\" WHERE \"customer_id\" = :customerId AND \"status\" = :status AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"created_at\" DESC")
    Flux<Loan> findByCustomerIdAndStatusAndCompanyId(Long customerId, String status, Long companyId);

    /** Find all loans in a given status within the tenant. */
    @Query("SELECT * FROM \"loans\" WHERE \"status\" = :status AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"created_at\" DESC")
    Flux<Loan> findByStatusAndCompanyId(String status, Long companyId);

    /** Look up a single loan by ID guarded by tenant isolation. */
    @Query("SELECT * FROM \"loans\" WHERE \"id\" = :id AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Loan> findByIdAndCompanyId(Long id, Long companyId);

    /** Count active loans for a customer (used for eligibility checks). */
    @Query("SELECT COUNT(*) FROM \"loans\" WHERE \"customer_id\" = :customerId AND \"status\" IN ('PENDING','ACTIVE') AND \"company_id\" = :companyId AND \"deleted_at\" IS NULL")
    Mono<Long> countActiveByCustomerIdAndCompanyId(Long customerId, Long companyId);

    /** Find all loans for a company. */
    @Query("SELECT * FROM \"loans\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"created_at\" DESC")
    Flux<Loan> findAllByCompanyId(Long companyId);

    /** Search loans by query (loan_key or description) for a company. */
    @Query("SELECT * FROM \"loans\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL AND (LOWER(\"loan_key\") LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(\"description\") LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY \"created_at\" DESC")
    Flux<Loan> searchByQuery(Long companyId, String query);
}

