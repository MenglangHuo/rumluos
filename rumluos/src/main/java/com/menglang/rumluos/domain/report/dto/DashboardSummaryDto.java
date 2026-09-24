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
public class DashboardSummaryDto {
    private long totalLoans;
    private long activeLoans;
    private long completedLoans;
    private long defaultedLoans;
    private long overdueLoans;
    private BigDecimal totalDisbursed;
    private BigDecimal totalOutstanding;
    private BigDecimal totalCollected;
    private BigDecimal totalOverdueAmount;
    private long totalCustomers;
    private long totalProducts;
}
