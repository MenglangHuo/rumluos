package com.menglang.rumluos.domain.finance.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.io.Serializable;

/**
 * ISO 4217 currency reference table.
 *
 * <p>Primary key is the 3-char ISO code (e.g. "USD", "KHR", "EUR").
 * This is intentionally NOT a surrogate bigserial — currency codes
 * are stable, short, and human-readable, making them ideal natural PKs.
 *
 * <p>This entity does NOT extend {@code BaseLongEntity} because its PK
 * is a String, not a Long. It implements {@link Persistable} directly.
 *
 * <p>The {@code isNewFlag} is managed by {@code EntityCallbackConfig.currencyAfterConvert()}
 * which sets it to {@code false} after loading from the database.
 */
@Table("currencies")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Currency implements Persistable<String>, Serializable {

    /** ISO 4217 three-letter code, e.g. "USD", "KHR". */
    @Id
    @Column("code")
    private String code;

    @Column("name")
    private String name;

    /** Display symbol, e.g. "$", "៛". */
    @Column("symbol")
    private String symbol;

    /**
     * Number of decimal places for this currency.
     * KHR = 0, USD = 2, BHD = 3.
     */
    @Column("decimal_places")
    private int decimalPlaces = 2;

    @Column("is_active")
    private boolean isActive = true;

    @Transient
    private boolean isNewFlag = true;

    @Override
    public String getId() {
        return this.code;
    }

    @Override
    public boolean isNew() {
        return this.isNewFlag;
    }

    /**
     * Marks this entity as already persisted.
     * Called by {@code EntityCallbackConfig} after loading from DB.
     */
    public void markPersisted() {
        this.isNewFlag = false;
    }
}