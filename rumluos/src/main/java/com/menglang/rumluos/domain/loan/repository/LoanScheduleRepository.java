package com.menglang.rumluos.domain.loan.repository;

import com.menglang.rumluos.domain.loan.entity.LoanSchedule;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDate;

@Repository
public interface LoanScheduleRepository extends ReactiveCrudRepository<LoanSchedule, Long> {

    @Query("SELECT * FROM \"loan_schedules\" WHERE \"loan_id\" = :loanId AND \"deleted_at\" IS NULL ORDER BY \"period_number\" ASC")
    Flux<LoanSchedule> findByLoanId(Long loanId);

    @Query("SELECT * FROM \"loan_schedules\" WHERE \"status\" IN ('PENDING', 'ACTIVE') AND \"due_date\" <= :dueDate AND \"deleted_at\" IS NULL ORDER BY \"due_date\" ASC")
    Flux<LoanSchedule> findOverdueSchedules(LocalDate dueDate);

    @Query("SELECT s.* FROM \"loan_schedules\" s " +
           "JOIN \"loans\" l ON s.\"loan_id\" = l.\"id\" " +
           "LEFT JOIN \"invoices\" i ON i.\"loan_schedule_id\" = s.\"id\" AND i.\"deleted_at\" IS NULL " +
           "WHERE l.\"status\" = 'ACTIVE' " +
           "  AND s.\"status\" IN ('PENDING', 'PARTIALLY_PAID') " +
           "  AND s.\"due_date\" <= :cutoffDate " +
           "  AND s.\"deleted_at\" IS NULL " +
           "  AND i.\"id\" IS NULL " +
           "ORDER BY s.\"due_date\" ASC")
    Flux<LoanSchedule> findUpcomingSchedulesWithoutInvoice(LocalDate cutoffDate);

    @Query("SELECT s.* FROM \"loan_schedules\" s " +
           "JOIN \"loans\" l ON s.\"loan_id\" = l.\"id\" " +
           "WHERE l.\"status\" = 'ACTIVE' " +
           "  AND s.\"status\" IN ('PENDING', 'PARTIALLY_PAID') " +
           "  AND s.\"due_date\" < :currentDate " +
           "  AND s.\"deleted_at\" IS NULL " +
           "ORDER BY s.\"due_date\" ASC")
    Flux<LoanSchedule> findUnpaidSchedulesPastDueDate(LocalDate currentDate);
}

