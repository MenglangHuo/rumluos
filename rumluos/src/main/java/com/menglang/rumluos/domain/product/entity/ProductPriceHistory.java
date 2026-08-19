package com.menglang.rumluos.domain.product.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

/**
 * Immutable audit log of product price changes.
 *
 * <p>Uses inherited createdAt/createdBy from BaseEntity for
 * change timestamp and actor — no custom changedAt/changedBy needed.
 */
@Table("product_price_history")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ProductPriceHistory extends BaseLongEntity {

    @Column("product_id")
    private Long productId;

    @Column("old_base_price")
    private BigDecimal oldBasePrice;

    @Column("new_base_price")
    private BigDecimal newBasePrice;

    @Column("old_sell_price")
    private BigDecimal oldSellPrice;

    @Column("new_sell_price")
    private BigDecimal newSellPrice;

    /** ISO 4217 currency code. FK to currencies.code. */
    @Column("currency")
    private String currency;

    /** Human-readable reason for the price change. */
    @Column("reason")
    private String reason;
}
