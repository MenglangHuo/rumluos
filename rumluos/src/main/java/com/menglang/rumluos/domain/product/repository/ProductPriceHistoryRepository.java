package com.menglang.rumluos.domain.product.repository;

import com.menglang.rumluos.domain.product.entity.ProductPriceHistory;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ProductPriceHistoryRepository extends ReactiveCrudRepository<ProductPriceHistory, Long> {

    @Query("SELECT * FROM \"product_price_history\" WHERE \"product_id\" = :productId ORDER BY \"created_at\" DESC")
    Flux<ProductPriceHistory> findByProductId(Long productId);
}

