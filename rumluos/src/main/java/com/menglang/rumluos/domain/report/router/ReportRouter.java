package com.menglang.rumluos.domain.report.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Configuration
public class ReportRouter {

    @Bean
    public RouterFunction<ServerResponse> reportRoutes(ReportHandler handler) {
        return route(GET("/api/v1/reports/dashboard"), handler::getDashboardSummary)
                .andRoute(GET("/api/v1/reports/loan-portfolio"), handler::getLoanPortfolio)
                .andRoute(GET("/api/v1/reports/collections"), handler::getCollections)
                .andRoute(GET("/api/v1/reports/overdue"), handler::getOverdueSchedules)
                .andRoute(GET("/api/v1/reports/disbursements"), handler::getDisbursements)
                .andRoute(GET("/api/v1/reports/income-expense"), handler::getIncomeExpenseSummary)
                .andRoute(GET("/api/v1/reports/inventory-valuation"), handler::getInventoryValuation)
                .andRoute(GET("/api/v1/reports/officer-performance"), handler::getLoanOfficerPerformance);
    }
}
