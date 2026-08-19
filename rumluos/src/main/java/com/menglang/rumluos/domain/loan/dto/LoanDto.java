package com.menglang.rumluos.domain.loan.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.JsonNodeDeserializer;
import com.menglang.rumluos.domain.loan.entity.Loan;
import com.menglang.rumluos.domain.loan.entity.LoanItem;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class LoanDto {

    @Data
    public static class CreateRequest {
        private String loanKey;
        private Long branchId;
        private Long loanOfficerId;
        private Long customerId;
        private BigDecimal assetPrice;
        private BigDecimal deposit;
        private BigDecimal principal;
        private BigDecimal totalInterest;
        private String currency;
        private String term;
        private Integer numberOfPeriods;
        private String interestMethod;
        private Short interestRateBps;
        private LocalDate startDate;
        private String description;
        private String notes;
        private List<LoanItemRequest> items;
    }

    @Data
    public static class LoanItemRequest {
        private Long productId;
        private String productName;
        private String productModel;
        private String serialNumber;
        private String condition;
        private BigDecimal unitPriceSnapshot;
        private BigDecimal totalCostSnapshot;
        private String currency;
        private Integer quantity;
        @JsonDeserialize(using = JsonNodeDeserializer.class)
        private JsonNode attributesSnapshot;
    }

    @Data
    public static class RestructureRequest {
        private Integer newNumberOfPeriods;
        private String newInterestMethod;
        private BigDecimal outstandingPrincipal;
    }

    public static Loan toEntity(CreateRequest req) {
        Loan loan = new Loan();
        loan.setLoanKey(req.getLoanKey());
        loan.setBranchId(req.getBranchId());
        loan.setLoanOfficerId(req.getLoanOfficerId());
        loan.setCustomerId(req.getCustomerId());
        loan.setAssetPrice(req.getAssetPrice());
        BigDecimal deposit = req.getDeposit() != null ? req.getDeposit() : BigDecimal.ZERO;
        loan.setDeposit(deposit);
        
        if (req.getPrincipal() != null) {
            loan.setPrincipal(req.getPrincipal());
        } else if (req.getAssetPrice() != null) {
            loan.setPrincipal(req.getAssetPrice().subtract(deposit));
        } else {
            loan.setPrincipal(BigDecimal.ZERO);
        }
        
        if (req.getTotalInterest() != null) {
            loan.setTotalInterest(req.getTotalInterest());
        } else {
            loan.setTotalInterest(BigDecimal.ZERO);
        }
        
        loan.setCurrency(req.getCurrency());
        loan.setTerm(req.getTerm() != null ? req.getTerm() : "MONTHLY");
        loan.setNumberOfPeriods(req.getNumberOfPeriods() != null ? req.getNumberOfPeriods() : 1);
        loan.setInterestMethod(req.getInterestMethod() != null ? req.getInterestMethod() : "EMI");
        if (req.getInterestRateBps() != null) {
            loan.setInterestRateBps(req.getInterestRateBps());
        }
        loan.setStartDate(req.getStartDate() != null ? req.getStartDate() : LocalDate.now());
        loan.setDescription(req.getDescription());
        loan.setNotes(req.getNotes());
        return loan;
    }

    public static LoanItem toItemEntity(LoanItemRequest req, String defaultCurrency) {
        LoanItem item = new LoanItem();
        item.setProductId(req.getProductId());
        item.setProductName(req.getProductName());
        item.setProductModel(req.getProductModel());
        item.setSerialNumber(req.getSerialNumber());
        item.setCondition(req.getCondition());
        item.setUnitPriceSnapshot(req.getUnitPriceSnapshot());
        item.setTotalCostSnapshot(req.getTotalCostSnapshot());
        item.setCurrency(req.getCurrency() != null ? req.getCurrency() : defaultCurrency);
        item.setQuantity(req.getQuantity() != null ? req.getQuantity() : 1);
        item.setAttributesSnapshot(req.getAttributesSnapshot());
        return item;
    }
}

