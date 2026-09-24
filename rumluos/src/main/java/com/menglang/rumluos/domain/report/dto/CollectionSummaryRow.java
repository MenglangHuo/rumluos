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
public class CollectionSummaryRow {
    private Long paymentId;
    private String paymentRef;
    private LocalDate paymentDate;
    private BigDecimal amountPaid;
    private String paymentCurrency;
    private BigDecimal penaltyAmount;
    private String paymentMethod;
    private String status;
    private Long customerId;
    private String customerName;
    private Long loanId;
    private String loanKey;
    private Long branchId;
    private String branchName;
    private Long collectedByStaffId;
    private String collectedByStaffName;
    private String notes;
}
