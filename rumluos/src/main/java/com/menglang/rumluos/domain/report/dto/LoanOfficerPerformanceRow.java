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
public class LoanOfficerPerformanceRow {
    private Long officerId;
    private String officerName;
    private String officerEmail;
    private Long branchId;
    private String branchName;
    private long totalLoans;
    private long activeLoans;
    private long completedLoans;
    private long defaultedLoans;
    private BigDecimal totalDisbursed;
    private BigDecimal totalPrincipalCollected;
}
