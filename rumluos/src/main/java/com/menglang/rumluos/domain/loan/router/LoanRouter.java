package com.menglang.rumluos.domain.loan.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.*;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Configuration
public class LoanRouter {

    @Bean
    public RouterFunction<ServerResponse> loanRoutes(LoanHandler handler) {
        return route(GET("/api/v1/loans"), handler::search)
                .andRoute(POST("/api/v1/loans"), handler::create)
                .andRoute(PUT("/api/v1/loans/{id}/activate"), handler::activate)
                .andRoute(PUT("/api/v1/loans/{id}/restructure"), handler::restructure)
                .andRoute(PUT("/api/v1/loans/{id}/default"), handler::defaultLoan)
                .andRoute(PUT("/api/v1/loans/{id}/close"), handler::closeLoan)
                .andRoute(GET("/api/v1/loans/{id}"), handler::getById);
    }
}
