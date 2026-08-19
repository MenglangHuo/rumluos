package com.menglang.rumluos.domain.company.router;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.page.PageUtils;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.company.dto.StaffDto;
import com.menglang.rumluos.domain.company.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.net.URI;

@Component
@RequiredArgsConstructor
public class StaffHandler {

    private final StaffService staffService;
    private final RequestValidator validator;

    public Mono<ServerResponse> createOrUpdate(ServerRequest request) {
        return request.bodyToMono(StaffDto.StaffRequest.class)
                .doOnNext(validator::validate)
                .flatMap(staffService::createOrUpdate)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return staffService.getById(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> search(ServerRequest request) {
        RequestPage page = new RequestPage();
        request.queryParam("page").ifPresent(p -> page.setPage(Integer.parseInt(p)));
        request.queryParam("size").ifPresent(s -> page.setSize(Integer.parseInt(s)));
        request.queryParam("limit").ifPresent(l -> page.setSize(Integer.parseInt(l)));
        request.queryParam("query").ifPresent(page::setQuery);
        request.queryParams().getOrDefault("sort", java.util.Collections.emptyList()).forEach(s -> page.getSort().add(s));
        
        validator.validate(page);
        
        var filters = PageUtils.extractFilters(request);
        return staffService.search(page, filters)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

}
