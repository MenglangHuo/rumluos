package com.menglang.rumluos.domain.finance.repository;

import com.menglang.rumluos.domain.finance.entity.Payment;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PaymentRepository extends R2dbcRepository<Payment, Long> {

    Mono<Payment> findByIdAndCompanyId(Long id, Long companyId);

    Mono<Payment> findByPaymentRefAndCompanyId(String paymentRef, Long companyId);

    Flux<Payment> findByCustomerIdAndCompanyId(Long customerId, Long companyId);

    Flux<Payment> findByInvoiceIdAndCompanyId(Long invoiceId, Long companyId);

    Flux<Payment> findByLoanScheduleIdAndCompanyId(Long loanScheduleId, Long companyId);

    @org.springframework.data.r2dbc.repository.Query("SELECT * FROM \"payments\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"created_at\" DESC")
    Flux<Payment> findAllByCompanyId(Long companyId);

    @org.springframework.data.r2dbc.repository.Query("SELECT * FROM \"payments\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL AND (LOWER(\"payment_ref\") LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(\"notes\") LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY \"created_at\" DESC")
    Flux<Payment> searchByQuery(Long companyId, String query);
}
