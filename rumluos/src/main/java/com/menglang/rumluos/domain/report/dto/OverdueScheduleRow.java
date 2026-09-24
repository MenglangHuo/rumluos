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
public class OverdueScheduleRow {
    private Long scheduleId;
    private Long loanId;
    private String loanKey;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long branchId;
    private String branchName;
    private short periodNumber;
    private LocalDate dueDate;
    private BigDecimal principalDue;
    private BigDecimal interestDue;
    private BigDecimal totalDue;
    private BigDecimal paidAmount;
    private BigDecimal remainingDue;
    private int daysOverdue;
    private String status;
    private String currency;
}
