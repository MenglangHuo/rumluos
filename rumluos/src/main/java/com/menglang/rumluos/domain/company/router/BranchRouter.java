package com.menglang.rumluos.domain.company.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class BranchRouter {

    @Bean
    public RouterFunction<ServerResponse> branchRoutes(BranchHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/branches", builder -> builder
                        .POST("", handler::create)
                        .GET("", handler::search)
                        .GET("/{id}", handler::getById)
                        .PUT("/{id}", handler::update)
                        .DELETE("/{id}", handler::delete)
                        .PATCH("/{id}/restore", handler::restore)
                )
                .build();
    }
}
