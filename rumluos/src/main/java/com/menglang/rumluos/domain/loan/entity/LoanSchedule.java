package com.menglang.rumluos.domain.loan.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import com.menglang.rumluos.common.enums.LoanStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Amortisation / repayment schedule row for a single period.
 *
 * <p>One row per repayment period. Generated in bulk when a loan
 * transitions from PENDING → ACTIVE.
 *
 * <p>Audit fields (createdAt, createdBy, updatedAt, updatedBy) inherited
 * from BaseLongEntity. Do NOT redeclare them.
 */
@Table("loan_schedules")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LoanSchedule extends BaseLongEntity {

    @Column("loan_id")
    private Long loanId;

    /** 1-based period counter within this loan. */
    @Column("period_number")
    private short periodNumber;

    /** Date this payment is due. */
    @Column("due_date")
    private LocalDate dueDate;

    /** Principal portion due this period. */
    @Column("principal_due")
    private BigDecimal principalDue;

    /** Interest portion due this period. */
    @Column("interest_due")
    private BigDecimal interestDue;

    /** Outstanding principal balance at the START of this period. */
    @Column("principal_balance")
    private BigDecimal principalBalance;

    /** Outstanding balance AFTER this period's payment. */
    @Column("outstanding_balance")
    private BigDecimal outstandingBalance;

    /** True if this is a penalty extension row. */
    @Column("is_penalty")
    private boolean isPenalty = false;

    /** PENDING, ACTIVE, COMPLETED, DEFAULTED. */
    @Column("status")
    private String status = LoanStatus.PENDING.name();

    // ── Reserved fields ─────────────────────────────────────────

    /** When this schedule row was actually paid. */
    @Column("paid_at")
    private Instant paidAt;

    /** Amount actually paid for this period. */
    @Column("paid_amount")
    private BigDecimal paidAmount;

    /** Total payment due this period = principalDue + interestDue. */
    public BigDecimal getTotalDue() {
        BigDecimal p = principalDue != null ? principalDue : BigDecimal.ZERO;
        BigDecimal i = interestDue != null ? interestDue : BigDecimal.ZERO;
        return p.add(i);
    }
}
