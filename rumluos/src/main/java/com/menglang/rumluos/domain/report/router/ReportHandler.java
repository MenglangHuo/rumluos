package com.menglang.rumluos.domain.report.router;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class ReportHandler {

    private final ReportService reportService;

    public Mono<ServerResponse> getDashboardSummary(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Long branchId = parseLong(request.queryParam("branchId").orElse(null));
                    return reportService.getDashboardSummary(companyId, branchId)
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    public Mono<ServerResponse> getLoanPortfolio(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Long branchId = parseLong(request.queryParam("branchId").orElse(null));
                    String status = request.queryParam("status").orElse(null);
                    int page = parseInt(request.queryParam("page").orElse(null), 0);
                    int size = parseInt(request.queryParam("size").orElse(null), 20);

                    return reportService.getLoanPortfolio(companyId, branchId, status, page, size)
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    public Mono<ServerResponse> getCollections(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Long branchId = parseLong(request.queryParam("branchId").orElse(null));
                    String paymentMethod = request.queryParam("paymentMethod").orElse(null);
                    LocalDate startDate = parseLocalDate(request.queryParam("startDate").orElse(null));
                    LocalDate endDate = parseLocalDate(request.queryParam("endDate").orElse(null));

                    return reportService.getCollections(companyId, branchId, paymentMethod, startDate, endDate)
                            .collectList()
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    public Mono<ServerResponse> getOverdueSchedules(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Long branchId = parseLong(request.queryParam("branchId").orElse(null));

                    return reportService.getOverdueSchedules(companyId, branchId)
                            .collectList()
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    public Mono<ServerResponse> getDisbursements(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Long branchId = parseLong(request.queryParam("branchId").orElse(null));
                    LocalDate startDate = parseLocalDate(request.queryParam("startDate").orElse(null));
                    LocalDate endDate = parseLocalDate(request.queryParam("endDate").orElse(null));

                    return reportService.getDisbursements(companyId, branchId, startDate, endDate)
                            .collectList()
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    public Mono<ServerResponse> getIncomeExpenseSummary(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    LocalDate startDate = parseLocalDate(request.queryParam("startDate").orElse(null));
                    LocalDate endDate = parseLocalDate(request.queryParam("endDate").orElse(null));

                    return reportService.getIncomeExpenseSummary(companyId, startDate, endDate)
                            .collectList()
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    public Mono<ServerResponse> getInventoryValuation(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Long branchId = parseLong(request.queryParam("branchId").orElse(null));

                    return reportService.getInventoryValuation(companyId, branchId)
                            .collectList()
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    public Mono<ServerResponse> getLoanOfficerPerformance(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Long branchId = parseLong(request.queryParam("branchId").orElse(null));

                    return reportService.getLoanOfficerPerformance(companyId, branchId)
                            .collectList()
                            .flatMap(data -> ServerResponse.ok().bodyValue(ApiResponse.success(data)));
                });
    }

    private Long parseLong(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private int parseInt(String val, int defaultVal) {
        if (val == null || val.isBlank()) return defaultVal;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return defaultVal;
        }
    }

    private LocalDate parseLocalDate(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return LocalDate.parse(val.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
