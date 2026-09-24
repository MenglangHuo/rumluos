package com.menglang.rumluos.domain.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanPortfolioRow {
    private Long loanId;
    private String loanKey;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long branchId;
    private String branchName;
    private Long loanOfficerId;
    private String loanOfficerName;
    private String currency;
    private BigDecimal principal;
    private BigDecimal totalInterest;
    private BigDecimal deposit;
    private BigDecimal outstandingBalance;
    private String status;
    private Integer daysInArrears;
    private String interestMethod;
    private String term;
    private Integer numberOfPeriods;
    private LocalDate startDate;
    private LocalDate endDate;
}
