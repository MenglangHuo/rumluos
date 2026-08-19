package com.menglang.rumluos.domain.finance.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Daily exchange rate snapshot between two currencies.
 *
 * <p>Rows are IMMUTABLE once inserted. Corrections are new rows.
 */
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table("exchange_rates")
public class ExchangeRate extends BaseLongEntity {

    @Column("from_currency")
    private String fromCurrency;

    @Column("to_currency")
    private String toCurrency;

    /** Multiplicative rate: amount * rate = converted amount. */
    @Column("rate")
    private BigDecimal rate;

    @Column("rate_date")
    private LocalDate rateDate;

    // ── Reserved field ──────────────────────────────────────────

    /** Source of the rate, e.g. "NBC", "ECB", "MANUAL". */
    @Column("source")
    private String source;
}
