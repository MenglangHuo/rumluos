package com.menglang.rumluos.domain.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomeExpenseSummaryRow {
    private Long categoryId;
    private String categoryTitle;
    private String entryType;
    private String currency;
    private BigDecimal totalAmount;
    private long transactionCount;
}
