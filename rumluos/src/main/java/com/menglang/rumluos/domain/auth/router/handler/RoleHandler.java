package com.menglang.rumluos.domain.auth.router.handler;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.page.PageUtils;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.auth.dto.RoleDto;
import com.menglang.rumluos.domain.auth.service.role.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.net.URI;

@Component
@RequiredArgsConstructor
public class RoleHandler {

    private final RoleService roleService;
    private final RequestValidator validator;

    public Mono<ServerResponse> create(ServerRequest request) {
        return request.bodyToMono(RoleDto.CreateRoleRequest.class)
                .doOnNext(validator::validate)
                .flatMap(roleService::create)
                .flatMap(res -> ServerResponse.created(URI.create("/api/v1/roles/" + res.getId())).bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return request.bodyToMono(RoleDto.UpdateRoleRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> roleService.update(id, req))
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return roleService.delete(id)
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> restore(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return roleService.restore(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> excludePermissions(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return request.bodyToMono(RoleDto.ExcludePermissionsRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> roleService.excludePermissions(id, req))
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
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
        return roleService.search(page, filters)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

}
