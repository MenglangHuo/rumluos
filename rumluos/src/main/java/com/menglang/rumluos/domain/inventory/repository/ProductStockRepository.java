package com.menglang.rumluos.domain.inventory.repository;

import com.menglang.rumluos.domain.inventory.entity.ProductStock;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface ProductStockRepository extends ReactiveCrudRepository<ProductStock, Long> {
    Mono<ProductStock> findByProductIdAndBranchId(Long productId, Long branchId);
}
