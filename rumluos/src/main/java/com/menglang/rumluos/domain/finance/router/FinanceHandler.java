package com.menglang.rumluos.domain.finance.router;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.finance.dto.LoanPaymentRequestDto;
import com.menglang.rumluos.domain.finance.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class FinanceHandler {

    private final FinanceService financeService;

    public Mono<ServerResponse> generateInvoice(ServerRequest request) {
        Long loanId = Long.valueOf(request.queryParam("loanId").orElseThrow());
        Long scheduleId = Long.valueOf(request.queryParam("scheduleId").orElseThrow());
        
        return SecurityUtils.getCurrentCompanyId()
                .zipWith(SecurityUtils.getCurrentUserId().map(String::valueOf))
                .flatMap(tuple -> {
                    Long companyId = tuple.getT1();
                    String username = tuple.getT2();
                    return financeService.generateInvoiceForSchedule(companyId, loanId, scheduleId, username)
                            .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                });
    }

    public Mono<ServerResponse> processPayment(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .zipWith(SecurityUtils.getCurrentUserId().map(String::valueOf))
                .flatMap(tuple -> {
                    Long companyId = tuple.getT1();
                    String username = tuple.getT2();
                    return request.bodyToMono(LoanPaymentRequestDto.class)
                            .flatMap(req -> financeService.processLoanPayment(companyId, req, username))
                            .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                });
    }

    public Mono<ServerResponse> searchInvoices(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    String search = request.queryParam("search").orElse(null);
                    Long customerId = request.queryParam("customerId").map(Long::valueOf).orElse(null);
                    String status = request.queryParam("status").orElse(null);

                    return financeService.searchInvoices(companyId, search, customerId, status)
                            .collectList()
                            .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                });
    }

    public Mono<ServerResponse> searchPayments(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    String search = request.queryParam("search").orElse(null);
                    Long customerId = request.queryParam("customerId").map(Long::valueOf).orElse(null);

                    return financeService.searchPayments(companyId, search, customerId)
                            .collectList()
                            .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                });
    }

    public Mono<ServerResponse> getInvoiceById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> financeService.getInvoiceDetails(companyId, id)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res))));
    }
}
