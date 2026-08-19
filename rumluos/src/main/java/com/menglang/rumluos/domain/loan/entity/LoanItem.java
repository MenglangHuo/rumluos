package com.menglang.rumluos.domain.loan.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

/**
 * Line item linking a product to a loan at a fixed price snapshot.
 *
 * <p>All snapshot fields capture the product's state at loan-creation time,
 * ensuring loan records remain accurate even if the product catalog changes later.
 *
 * <p>{@code subtotal} is a PostgreSQL GENERATED column — marked @Transient so
 * R2DBC won't try to INSERT it. Use {@link #getSubtotal()} for the computed value.
 */
@Table("loan_items")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LoanItem extends BaseLongEntity {

    @Column("loan_id")
    private Long loanId;

    @Column("product_id")
    private Long productId;

    @Column("quantity")
    private int quantity = 1;

    /** Product sell price captured at loan-creation time. */
    @Column("unit_price_snapshot")
    private BigDecimal unitPriceSnapshot;

    /** ISO 4217 currency. Should match loans.currency. */
    @Column("currency")
    private String currency;

    /** The exact calculated cost (FIFO) at loan creation time. */
    @Column("total_cost_snapshot")
    private BigDecimal totalCostSnapshot;

    // ── Snapshot fields (frozen at loan creation) ────────────────

    /** Product name at loan creation, e.g. "Honda Dream 2020". */
    @Column("product_name")
    private String productName;

    /** Product model at loan creation, e.g. "Wave 125i". */
    @Column("product_model")
    private String productModel;

    /** Serial number (VIN/IMEI) at loan creation. */
    @Column("serial_number")
    private String serialNumber;

    /** Product condition at loan creation (NEW, USED, REFURBISHED). */
    @Column("condition")
    private String condition;

    /** Full JSONB attributes snapshot at loan creation. */
    @Column("attributes_snapshot")
    private JsonNode attributesSnapshot;

    // ── Computed ─────────────────────────────────────────────────

    /**
     * DB-generated: quantity * unit_price_snapshot.
     * Marked @Transient — computed in getter fallback.
     */
    @Transient
    private BigDecimal subtotal;

    /** Returns subtotal, computing from quantity * unitPriceSnapshot if null. */
    public BigDecimal getSubtotal() {
        if (subtotal != null) return subtotal;
        if (unitPriceSnapshot == null) return BigDecimal.ZERO;
        return unitPriceSnapshot.multiply(BigDecimal.valueOf(quantity));
    }
}
