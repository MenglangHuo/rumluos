package com.menglang.rumluos.domain.finance.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import com.menglang.rumluos.common.enums.InvoiceStatus;
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
 * Invoice issued to a customer, optionally tied to a loan.
 *
 * <p>Status lifecycle: DRAFT → SENT → PARTIALLY_PAID → PAID → VOID
 */
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table("invoices")
public class Invoice extends BaseTenantEntity {

    /** Human-readable invoice number, e.g. "INV-2024-001000". */
    @Column("invoice_no")
    private String invoiceNo;

    @Column("branch_id")
    private Long branchId;

    @Column("category_id")
    private Long categoryId;

    /** FK to customers.id. */
    @Column("customer_id")
    private Long customerId;

    /** FK to loans.id. Nullable. */
    @Column("loan_id")
    private Long loanId;

    /** FK to loan_schedules.id. Nullable. Bills for a specific period. */
    @Column("loan_schedule_id")
    private Long loanScheduleId;

    @Column("subtotal")
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column("tax_amount")
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column("discount_amount")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /** Final billable = subtotal + tax - discount. */
    @Column("total_amount")
    private BigDecimal totalAmount;

    /** ISO 4217 currency code. FK to currencies.code. */
    @Column("currency")
    private String currency;

    @Column("status")
    private String status = InvoiceStatus.DRAFT.name();

    @Column("description")
    private String description;

    // ── Reserved fields ─────────────────────────────────────────

    /** Payment deadline. */
    @Column("due_date")
    private LocalDate dueDate;

    /** When invoice was fully paid. */
    @Column("paid_at")
    private Instant paidAt;

    /** When invoice was issued/sent. */
    @Column("issued_at")
    private Instant issuedAt;
}
