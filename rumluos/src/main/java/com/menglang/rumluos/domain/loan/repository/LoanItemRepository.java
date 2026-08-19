package com.menglang.rumluos.domain.loan.repository;

import com.menglang.rumluos.domain.loan.entity.LoanItem;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface LoanItemRepository extends ReactiveCrudRepository<LoanItem, Long> {

    @Query("SELECT * FROM \"loan_items\" WHERE \"loan_id\" = :loanId AND \"deleted_at\" IS NULL")
    Flux<LoanItem> findByLoanId(Long loanId);
}

