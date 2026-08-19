package com.menglang.rumluos.domain.finance.repository;

import com.menglang.rumluos.domain.finance.entity.Invoice;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface InvoiceRepository extends R2dbcRepository<Invoice, Long> {

    Mono<Invoice> findByIdAndCompanyId(Long id, Long companyId);

    Mono<Invoice> findByInvoiceNoAndCompanyId(String invoiceNo, Long companyId);

    Flux<Invoice> findByCustomerIdAndCompanyId(Long customerId, Long companyId);

    Flux<Invoice> findByLoanIdAndCompanyId(Long loanId, Long companyId);
    
    Mono<Invoice> findByLoanScheduleIdAndCompanyId(Long loanScheduleId, Long companyId);

    Mono<Invoice> findByLoanScheduleId(Long loanScheduleId);

    Flux<Invoice> findByStatusAndCompanyId(String status, Long companyId);

    @org.springframework.data.r2dbc.repository.Query("SELECT * FROM \"invoices\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL ORDER BY \"created_at\" DESC")
    Flux<Invoice> findAllByCompanyId(Long companyId);

    @org.springframework.data.r2dbc.repository.Query("SELECT * FROM \"invoices\" WHERE \"company_id\" = :companyId AND \"deleted_at\" IS NULL AND (LOWER(\"invoice_no\") LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(\"description\") LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY \"created_at\" DESC")
    Flux<Invoice> searchByQuery(Long companyId, String query);
}
