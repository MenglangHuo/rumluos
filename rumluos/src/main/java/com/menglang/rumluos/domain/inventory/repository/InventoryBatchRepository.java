package com.menglang.rumluos.domain.inventory.repository;

import com.menglang.rumluos.domain.inventory.entity.InventoryBatch;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface InventoryBatchRepository extends ReactiveCrudRepository<InventoryBatch, Long> {
    
    @Query("SELECT * FROM \"inventory_batches\" WHERE \"product_id\" = :productId AND \"branch_id\" = :branchId AND \"status\" = 'ACTIVE' AND \"deleted_at\" IS NULL ORDER BY \"received_at\" ASC")
    Flux<InventoryBatch> findActiveBatchesOrderByReceivedAtAsc(Long productId, Long branchId);
}

