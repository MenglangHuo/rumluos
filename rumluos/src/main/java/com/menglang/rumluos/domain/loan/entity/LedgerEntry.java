package com.menglang.rumluos.domain.loan.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Immutable financial ledger entry for accounting.
 *
 * <p>Rows are NEVER updated or deleted. Corrections are new REVERSAL entries.
 */
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table("ledger_entries")
public class LedgerEntry extends BaseTenantEntity {

    /** FK to income_expense_categories.id. */
    @Column("category_id")
    private Long categoryId;

    /** Entry type: INCOME, EXPENSE, PENALTY, REVERSAL, ADJUSTMENT. */
    @Column("entry_type")
    private String entryType;

    @Column("amount")
    private BigDecimal amount;

    /** ISO 4217 currency. FK to currencies.code. */
    @Column("currency")
    private String currency;

    /** Polymorphic reference type: PAYMENT, INVOICE, LOAN, etc. */
    @Column("ref_type")
    private String refType;

    /** Polymorphic reference ID. No FK constraint. */
    @Column("ref_id")
    private Long refId;

    @Column("description")
    private String description;

    /** Business date of the entry. */
    @Column("entry_date")
    private LocalDate entryDate;
}