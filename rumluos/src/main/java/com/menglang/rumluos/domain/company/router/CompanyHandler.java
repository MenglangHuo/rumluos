package com.menglang.rumluos.domain.company.router;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.company.dto.CompanyDto;
import com.menglang.rumluos.domain.company.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.net.URI;

@Component
@RequiredArgsConstructor
public class CompanyHandler {

    private final CompanyService companyService;
    private final RequestValidator requestValidator;

    public Mono<ServerResponse> create(ServerRequest request) {
        return request.bodyToMono(CompanyDto.CreateCompanyRequest.class)
                .doOnNext(requestValidator::validate)
                .flatMap(companyService::create)
                .flatMap(res -> ServerResponse.created(URI.create("/api/v1/companies/" + res.id())).bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getMe(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new NotFoundException("No company associated with current user")))
                .flatMap(companyService::getById)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> updateMe(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new NotFoundException("No company associated with current user")))
                .flatMap(companyId -> request.bodyToMono(CompanyDto.UpdateCompanyRequest.class)
                        .doOnNext(requestValidator::validate)
                        .flatMap(req -> companyService.update(companyId, req)))
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return companyService.getById(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getAll(ServerRequest request) {
        RequestPage page = new RequestPage();
        request.queryParam("page").ifPresent(p -> page.setPage(Integer.parseInt(p)));
        request.queryParam("size").ifPresent(s -> page.setSize(Integer.parseInt(s)));
        request.queryParam("limit").ifPresent(l -> page.setSize(Integer.parseInt(l)));
        request.queryParam("query").ifPresent(page::setQuery);
        request.queryParams().getOrDefault("sort", java.util.Collections.emptyList()).forEach(s -> page.getSort().add(s));
        
        requestValidator.validate(page);
        
        return companyService.getAll(page)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }


    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return request.bodyToMono(CompanyDto.UpdateCompanyRequest.class)
                .doOnNext(requestValidator::validate)
                .flatMap(req -> companyService.update(id, req))
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return companyService.delete(id)
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> restore(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return companyService.restore(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> toggleActive(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return companyService.toggleActive(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }
}
