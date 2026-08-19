package com.menglang.rumluos.domain.company.router;

import com.menglang.rumluos.common.exception.BadRequestException;
import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.company.dto.CustomerDto;
import com.menglang.rumluos.domain.company.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CustomerHandler {

    private final CustomerService customerService;

    public Mono<ServerResponse> create(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> request.bodyToMono(CustomerDto.CustomerRequest.class)
                        .flatMap(req -> customerService.create(companyId, CustomerDto.toEntity(req)))
                        .map(CustomerDto::toResponse)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> request.bodyToMono(CustomerDto.CustomerRequest.class)
                        .flatMap(req -> customerService.update(companyId, id, CustomerDto.toEntity(req)))
                        .map(CustomerDto::toResponse)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> customerService.findById(companyId, id)
                        .switchIfEmpty(Mono.error(new NotFoundException("Customer not found")))
                        .map(CustomerDto::toResponse)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> customerService.delete(companyId, id)
                        .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)))
                );
    }

    public Mono<ServerResponse> search(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> {
                    var phoneOpt = request.queryParam("phone");
                    var nationalIdOpt = request.queryParam("nationalId");
                    var nameOpt = request.queryParam("name");
                    var activeOpt = request.queryParam("active");

                    if (phoneOpt.isPresent()) {
                        return customerService.findByPhone(companyId, phoneOpt.get())
                                .map(CustomerDto::toResponse)
                                .map(List::of)
                                .defaultIfEmpty(List.of())
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else if (nationalIdOpt.isPresent()) {
                        return customerService.findByNationalId(companyId, nationalIdOpt.get())
                                .map(CustomerDto::toResponse)
                                .map(List::of)
                                .defaultIfEmpty(List.of())
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else if (nameOpt.isPresent()) {
                        return customerService.searchByName(companyId, nameOpt.get())
                                .map(CustomerDto::toResponse)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else {
                        boolean active = activeOpt.map(Boolean::parseBoolean).orElse(true);
                        return customerService.findAllByActive(companyId, active)
                                .map(CustomerDto::toResponse)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    }
                });
    }
}
