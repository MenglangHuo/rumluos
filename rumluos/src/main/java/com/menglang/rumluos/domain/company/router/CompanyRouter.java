package com.menglang.rumluos.domain.company.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class CompanyRouter {

    @Bean
    public RouterFunction<ServerResponse> companyRoutes(CompanyHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/companies", builder -> builder
                        .POST("", handler::create)
                        .GET("", handler::getAll)
                        .GET("/me", handler::getMe)
                        .PUT("/me", handler::updateMe)
                        .GET("/{id}", handler::getById)
                        .PUT("/{id}", handler::update)
                        .DELETE("/{id}", handler::delete)
                        .PATCH("/{id}/restore", handler::restore)
                        .PATCH("/{id}/toggle-active", handler::toggleActive)
                )
                .build();
    }
}
