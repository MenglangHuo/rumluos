package com.menglang.rumluos.domain.inventory.repository;

import com.menglang.rumluos.domain.inventory.entity.InventoryTransaction;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface InventoryTransactionRepository extends ReactiveCrudRepository<InventoryTransaction, Long> {
}
