package com.menglang.rumluos.domain.company.router;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.PageUtils;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.domain.company.dto.BranchDto;
import com.menglang.rumluos.domain.company.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class BranchHandler {

    private final BranchService branchService;

    public Mono<ServerResponse> create(ServerRequest request) {
        return request.bodyToMono(BranchDto.BranchRequest.class)
                .flatMap(branchService::create)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return request.bodyToMono(BranchDto.BranchRequest.class)
                .flatMap(req -> branchService.update(id, req))
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return branchService.getById(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return branchService.delete(id)
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> restore(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return branchService.restore(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> search(ServerRequest request) {
        RequestPage requestPage = new RequestPage();
        request.queryParam("page").ifPresent(p -> requestPage.setPage(Integer.parseInt(p)));
        request.queryParam("size").ifPresent(s -> requestPage.setSize(Integer.parseInt(s)));
        request.queryParam("limit").ifPresent(l -> requestPage.setSize(Integer.parseInt(l)));
        request.queryParam("query").ifPresent(requestPage::setQuery);
        request.queryParams().getOrDefault("sort", java.util.Collections.emptyList()).forEach(s -> requestPage.getSort().add(s));

        Map<String, Object> filters = PageUtils.extractFilters(request);
        
        return branchService.search(requestPage, filters)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

}
