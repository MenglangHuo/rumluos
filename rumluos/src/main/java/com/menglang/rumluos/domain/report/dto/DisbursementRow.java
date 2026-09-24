package com.menglang.rumluos.domain.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisbursementRow {
    private Long loanId;
    private String loanKey;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long branchId;
    private String branchName;
    private Long loanOfficerId;
    private String loanOfficerName;
    private BigDecimal principal;
    private BigDecimal deposit;
    private String currency;
    private String interestMethod;
    private String term;
    private Integer numberOfPeriods;
    private short interestRateBps;
    private Instant disbursedAt;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
}
