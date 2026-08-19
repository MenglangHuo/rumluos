package com.menglang.rumluos.domain.inventory.service.impl;

import com.menglang.rumluos.domain.inventory.entity.InventoryBatch;
import com.menglang.rumluos.domain.inventory.entity.InventoryTransaction;
import com.menglang.rumluos.domain.inventory.entity.ProductStock;
import com.menglang.rumluos.domain.inventory.repository.InventoryBatchRepository;
import com.menglang.rumluos.domain.inventory.repository.InventoryTransactionRepository;
import com.menglang.rumluos.domain.inventory.repository.ProductStockRepository;
import com.menglang.rumluos.domain.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceImpl implements InventoryService {

    private final ProductStockRepository productStockRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Override
    @Transactional
    public Mono<Void> addStock(AddStockRequest request) {
        log.info("Adding stock for product {} at branch {}. Qty: {}", request.productId(), request.branchId(), request.quantity());
        
        // 1. Create a new InventoryBatch
        InventoryBatch batch = InventoryBatch.builder()
                .companyId(request.companyId())
                .branchId(request.branchId())
                .productId(request.productId())
                .unitCost(request.unitCost())
                .originalQuantity(request.quantity())
                .remainingQuantity(request.quantity())
                .receivedAt(Instant.now())
                .supplierName(request.supplierName())
                .status("ACTIVE")
                .createdBy(request.createdBy())
                .build();

        return inventoryBatchRepository.save(batch)
                .flatMap(savedBatch -> {
                    // 2. Create the InventoryTransaction log
                    InventoryTransaction tx = InventoryTransaction.builder()
                            .companyId(request.companyId())
                            .branchId(request.branchId())
                            .productId(request.productId())
                            .batchId(savedBatch.getId())
                            .transactionType("STOCK_IN")
                            .quantityChange(request.quantity())
                            .unitCost(request.unitCost())
                            .referenceType(request.referenceType())
                            .referenceId(request.referenceId())
                            .createdBy(request.createdBy())
                            .build();
                    
                    return inventoryTransactionRepository.save(tx).thenReturn(savedBatch);
                })
                .flatMap(savedBatch -> 
                    // 3. Upsert ProductStock
                    productStockRepository.findByProductIdAndBranchId(request.productId(), request.branchId())
                            .flatMap(stock -> {
                                stock.setQuantityAvailable(stock.getQuantityAvailable() + request.quantity());
                                stock.setUpdatedBy(request.createdBy());
                                stock.setUpdatedAt(Instant.now());
                                return productStockRepository.save(stock);
                            })
                            .switchIfEmpty(Mono.defer(() -> {
                                ProductStock newStock = ProductStock.builder()
                                        .companyId(request.companyId())
                                        .branchId(request.branchId())
                                        .productId(request.productId())
                                        .quantityAvailable(request.quantity())
                                        .createdBy(request.createdBy())
                                        .build();
                                return productStockRepository.save(newStock);
                            }))
                )
                .then();
    }

    @Override
    @Transactional
    public Mono<FifoCostResult> deductStock(DeductStockRequest request) {
        log.info("Deducting stock for product {} at branch {}. Qty: {}", request.productId(), request.branchId(), request.quantity());
        
        return productStockRepository.findByProductIdAndBranchId(request.productId(), request.branchId())
                .switchIfEmpty(Mono.error(new IllegalArgumentException("No stock found for this product at this branch.")))
                .flatMap(stock -> {
                    if (stock.getQuantityAvailable() < request.quantity()) {
                        return Mono.error(new IllegalArgumentException(
                                String.format("Insufficient stock. Available: %d, Requested: %d", 
                                        stock.getQuantityAvailable(), request.quantity())));
                    }

                    // Update total stock
                    stock.setQuantityAvailable(stock.getQuantityAvailable() - request.quantity());
                    stock.setUpdatedBy(request.createdBy());
                    stock.setUpdatedAt(Instant.now());
                    
                    return productStockRepository.save(stock);
                })
                .then(
                    // Fetch active batches and deduct sequentially (FIFO)
                    inventoryBatchRepository.findActiveBatchesOrderByReceivedAtAsc(request.productId(), request.branchId())
                            .collectList()
                )
                .flatMap(batches -> {
                    AtomicInteger remainingToDeduct = new AtomicInteger(request.quantity());
                    AtomicReference<BigDecimal> totalCost = new AtomicReference<>(BigDecimal.ZERO);
                    
                    return reactor.core.publisher.Flux.fromIterable(batches)
                            .takeUntil(batch -> remainingToDeduct.get() == 0)
                            .flatMap(batch -> {
                                int needed = remainingToDeduct.get();
                                if (needed == 0) return Mono.just(batch);

                                int availableInBatch = batch.getRemainingQuantity();
                                int deductFromBatch = Math.min(needed, availableInBatch);
                                
                                remainingToDeduct.addAndGet(-deductFromBatch);
                                
                                BigDecimal costForThisDeduction = batch.getUnitCost().multiply(BigDecimal.valueOf(deductFromBatch));
                                totalCost.accumulateAndGet(costForThisDeduction, BigDecimal::add);

                                // Update Batch
                                batch.setRemainingQuantity(availableInBatch - deductFromBatch);
                                if (batch.getRemainingQuantity() == 0) {
                                    batch.setStatus("DEPLETED");
                                }
                                batch.setUpdatedBy(request.createdBy());
                                batch.setUpdatedAt(Instant.now());

                                return inventoryBatchRepository.save(batch)
                                        .flatMap(savedBatch -> {
                                            // Record transaction for this batch deduction
                                            InventoryTransaction tx = InventoryTransaction.builder()
                                                    .companyId(request.companyId())
                                                    .branchId(request.branchId())
                                                    .productId(request.productId())
                                                    .batchId(savedBatch.getId())
                                                    .transactionType("SALE")
                                                    .quantityChange(-deductFromBatch) // Negative for deduction
                                                    .unitCost(savedBatch.getUnitCost())
                                                    .referenceType(request.referenceType())
                                                    .referenceId(request.referenceId())
                                                    .createdBy(request.createdBy())
                                                    .build();
                                            return inventoryTransactionRepository.save(tx);
                                        });
                            })
                            .then(Mono.fromCallable(() -> new FifoCostResult(request.quantity(), totalCost.get())));
                });
    }
}
