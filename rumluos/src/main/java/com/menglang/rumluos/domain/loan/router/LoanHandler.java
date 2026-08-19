package com.menglang.rumluos.domain.loan.router;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.domain.loan.dto.LoanDto;
import com.menglang.rumluos.domain.loan.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class LoanHandler {

    private final LoanService loanService;

    public Mono<ServerResponse> create(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(LoanDto.CreateRequest.class)
                        .flatMap(req -> loanService.createWithItems(companyId, LoanDto.toEntity(req), req.getItems()))
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> activate(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> loanService.activateLoan(companyId, id)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> defaultLoan(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> loanService.defaultLoan(companyId, id)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> closeLoan(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> loanService.closeLoan(companyId, id)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> restructure(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .zipWith(SecurityUtils.getCurrentUserId().map(String::valueOf))
                .flatMap(tuple -> {
                    Long companyId = tuple.getT1();
                    String username = tuple.getT2();
                    return request.bodyToMono(LoanDto.RestructureRequest.class)
                            .flatMap(req -> loanService.restructureLoan(
                                    companyId, 
                                    id, 
                                    req.getNewNumberOfPeriods(), 
                                    req.getNewInterestMethod(), 
                                    req.getOutstandingPrincipal(), 
                                    username
                            ))
                            .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                });
    }

    public Mono<ServerResponse> search(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    var searchOpt = request.queryParam("search");
                    var customerIdOpt = request.queryParam("customerId");
                    var statusOpt = request.queryParam("status");

                    String search = searchOpt.orElse(null);
                    Long customerId = customerIdOpt.map(Long::valueOf).orElse(null);
                    String status = statusOpt.orElse(null);

                    return loanService.search(companyId, search, customerId, status)
                            .collectList()
                            .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                });
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> loanService.getLoanDetails(companyId, id)
                        .switchIfEmpty(Mono.error(new NotFoundException("Loan not found")))
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }
}
