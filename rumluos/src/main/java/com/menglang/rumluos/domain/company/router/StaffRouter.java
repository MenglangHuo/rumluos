package com.menglang.rumluos.domain.company.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class StaffRouter {

    @Bean
    public RouterFunction<ServerResponse> staffRoutes(StaffHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/staffs", builder -> builder
                        .POST("", handler::createOrUpdate)
                        .GET("/{id}", handler::getById)
                        .GET("", handler::search)
                )
                .build();
    }
}
