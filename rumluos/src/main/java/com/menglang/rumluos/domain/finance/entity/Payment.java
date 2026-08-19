package com.menglang.rumluos.domain.finance.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import com.menglang.rumluos.common.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Payment received against an invoice and/or loan schedule row.
 */
@Table("payments")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Payment extends BaseTenantEntity {

    /** Unique payment reference, e.g. "PAY-2024-005000". */
    @Column("payment_ref")
    private String paymentRef;

    @Column("branch_id")
    private Long branchId;

    @Column("collected_by_staff_id")
    private Long collectedByStaffId;

    @Column("category_id")
    private Long categoryId;

    /** Nullable FK to invoices.id. */
    @Column("invoice_id")
    private Long invoiceId;

    /** Nullable FK to loan_schedules.id. */
    @Column("loan_schedule_id")
    private Long loanScheduleId;

    /** ISO 4217 currency in which the payment was made. */
    @Column("payment_currency")
    private String paymentCurrency;

    /** Amount actually received. Must be > 0. */
    @Column("amount_paid")
    private BigDecimal amountPaid;

    /** Exchange rate snapshot at time of payment. */
    @Column("exchange_rate_snapshot")
    private BigDecimal exchangeRateSnapshot;

    /** amountPaid converted to system base currency. */
    @Column("amount_in_base_currency")
    private BigDecimal amountInBaseCurrency;

    /** Penalty collected with this payment. Default 0. */
    @Column("penalty_amount")
    private BigDecimal penaltyAmount = BigDecimal.ZERO;

    /** Payment channel: CASH, WING, ABA, etc. */
    @Column("payment_method")
    private String paymentMethod;

    /** Calendar date the payment was received. */
    @Column("payment_date")
    private LocalDate paymentDate;

    /** COMPLETED, REVERSED, PENDING. */
    @Column("status")
    private String status = PaymentStatus.COMPLETED.name();

    @Column("notes")
    private String notes;

    // ── Reserved fields ─────────────────────────────────────────

    /** URL to payment receipt scan/image. */
    @Column("receipt_url")
    private String receiptUrl;

    /** FK to customers.id. Denormalized for quick lookup. */
    @Column("customer_id")
    private Long customerId;
}
