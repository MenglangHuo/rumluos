package com.menglang.rumluos.domain.finance.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Category for income/expense ledger entries.
 */
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table("income_expense_categories")
public class IncomeExpenseCategory extends BaseTenantEntity {

    @Column("title")
    private String title;

    @Column("description")
    private String description;

    /** Entry type discriminator: INCOME, EXPENSE, PENALTY, OTHER. */
    @Column("type")
    private String type;

    @Column("is_active")
    private boolean isActive = true;

    // ── Reserved fields ─────────────────────────────────────────

    /** FK for hierarchical categories. Nullable = root. */
    @Column("parent_id")
    private Long parentId;

    /** Display ordering. Lower = shown first. */
    @Column("sort_order")
    private Integer sortOrder;
}