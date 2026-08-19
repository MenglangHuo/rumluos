package com.menglang.rumluos.domain.product.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class ProductRouter {

    @Bean
    public RouterFunction<ServerResponse> productRoutes(ProductHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/products", builder -> builder
                        .POST("", handler::create)
                        .POST("/import-batch", handler::importBatch)
                        .GET("", handler::search)
                        .GET("/{id}", handler::getById)
                        .PUT("/{id}", handler::update)
                        .DELETE("/{id}", handler::delete)
                )
                .build();
    }
}
