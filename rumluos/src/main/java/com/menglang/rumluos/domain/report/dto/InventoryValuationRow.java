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
public class InventoryValuationRow {
    private Long productId;
    private String productName;
    private String productModel;
    private String serialNumber;
    private String condition;
    private Long branchId;
    private String branchName;
    private Integer quantityAvailable;
    private BigDecimal unitPrice;
    private BigDecimal estimatedValue;
    private String currency;
}
