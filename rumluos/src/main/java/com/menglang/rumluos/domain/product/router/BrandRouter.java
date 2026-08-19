package com.menglang.rumluos.domain.product.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class BrandRouter {

    @Bean
    public RouterFunction<ServerResponse> brandRoutes(BrandHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/brands", builder -> builder
                        .POST("", handler::create)
                        .GET("", handler::search)
                        .GET("/{id}", handler::getById)
                        .PUT("/{id}", handler::update)
                        .DELETE("/{id}", handler::delete)
                )
                .build();
    }
}
