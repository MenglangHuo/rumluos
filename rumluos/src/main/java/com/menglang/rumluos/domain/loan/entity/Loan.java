package com.menglang.rumluos.domain.loan.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
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
 * Core loan record.
 *
 * <p>interestRateBps is in basis points: 500 = 5.00%.
 * All monetary fields are in the currency specified by {@code currency}.
 */
@Table("loans")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Loan extends BaseTenantEntity {

    /** Human-readable unique key, e.g. "LN-2024-001000". */
    @Column("loan_key")
    private String loanKey;

    @Column("branch_id")
    private Long branchId;

    @Column("loan_officer_id")
    private Long loanOfficerId;

    /** FK to customers.id. */
    @Column("customer_id")
    private Long customerId;

    /** ISO 4217 currency code. FK to currencies.code. */
    @Column("currency")
    private String currency;

    /** Repayment frequency. Stored as VARCHAR via LoanTerm.name(). */
    @Column("term")
    private String term;

    /** Amortization strategy method. Stored as VARCHAR via InterestMethod.name(). */
    @Column("interest_method")
    private String interestMethod = com.menglang.rumluos.common.enums.InterestMethod.EMI.name();

    /** Interest rate in basis points: 500 = 5.00%. */
    @Column("interest_rate_bps")
    private short interestRateBps;

    /** The original full price of the asset. */
    @Column("asset_price")
    private BigDecimal assetPrice;

    @Column("principal")
    private BigDecimal principal;

    /** Pre-computed total interest for the full loan term. */
    @Column("total_interest")
    private BigDecimal totalInterest;

    /** Security deposit collected upfront. Default 0. */
    @Column("deposit")
    private BigDecimal deposit = BigDecimal.ZERO;

    @Column("status")
    private String status = LoanStatus.PENDING.name();

    @Column("days_in_arrears")
    private Integer daysInArrears = 0;

    @Column("start_date")
    private LocalDate startDate;

    @Column("end_date")
    private LocalDate endDate;

    /** Number of repayment periods (e.g. 48). */
    @Column("number_of_periods")
    private Integer numberOfPeriods;

    @Column("description")
    private String description;

    // ── Reserved fields ─────────────────────────────────────────

    /** User who approved this loan. */
    @Column("approved_by")
    private String approvedBy;

    /** When the loan was approved. */
    @Column("approved_at")
    private Instant approvedAt;

    /** When the loan was disbursed. */
    @Column("disbursed_at")
    private Instant disbursedAt;

    /** When the loan was closed/completed. */
    @Column("closed_at")
    private Instant closedAt;

    /** Internal notes about this loan. */
    @Column("notes")
    private String notes;

    /** If this loan is a restructure/refinance, points to the original loan. */
    @Column("parent_loan_id")
    private Long parentLoanId;
}