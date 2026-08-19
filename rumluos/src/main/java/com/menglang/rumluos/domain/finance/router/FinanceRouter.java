package com.menglang.rumluos.domain.finance.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.*;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Configuration
public class FinanceRouter {

    @Bean
    public RouterFunction<ServerResponse> financeRoutes(FinanceHandler handler) {
        return route(GET("/api/v1/finance/invoices"), handler::searchInvoices)
                .andRoute(POST("/api/v1/finance/invoices"), handler::generateInvoice)
                .andRoute(GET("/api/v1/finance/invoices/{id}"), handler::getInvoiceById)
                .andRoute(GET("/api/v1/finance/payments"), handler::searchPayments)
                .andRoute(POST("/api/v1/finance/payments"), handler::processPayment);
    }
}
