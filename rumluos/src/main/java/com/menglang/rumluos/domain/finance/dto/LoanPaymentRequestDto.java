package com.menglang.rumluos.domain.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanPaymentRequestDto {

    private Long loanId;
    
    private Long loanScheduleId;

    private Long collectedByStaffId;

    private Long categoryId;
    
    private BigDecimal amountPaid;
    
    private String paymentMethod;
    
    private String paymentCurrency;
    
    private LocalDate paymentDate;
    
    private String notes;
    
    private String receiptUrl;

}
