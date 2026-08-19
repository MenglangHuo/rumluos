package com.menglang.rumluos.domain.inventory.service;

import reactor.core.publisher.Mono;

import java.math.BigDecimal;

public interface InventoryService {

    record AddStockRequest(
            Long companyId,
            Long branchId,
            Long productId,
            Integer quantity,
            BigDecimal unitCost,
            String supplierName,
            String referenceType,
            Long referenceId,
            String createdBy
    ) {}

    record DeductStockRequest(
            Long companyId,
            Long branchId,
            Long productId,
            Integer quantity,
            String referenceType,
            Long referenceId,
            String createdBy
    ) {}

    record FifoCostResult(
            Integer quantityDeducted,
            BigDecimal totalCost
    ) {}

    /**
     * Adds stock to a specific branch and logs an inventory transaction.
     */
    Mono<Void> addStock(AddStockRequest request);

    /**
     * Deducts stock from a branch using FIFO costing.
     * Returns the exact total cost of the deducted items.
     * Throws an error if insufficient stock is available.
     */
    Mono<FifoCostResult> deductStock(DeductStockRequest request);
}
