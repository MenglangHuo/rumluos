package com.menglang.rumluos.domain.auth.router.handler;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.page.PageUtils;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.auth.dto.AuthDto;
import com.menglang.rumluos.domain.auth.dto.UserDto;
import com.menglang.rumluos.domain.auth.service.user.UserService;
import com.menglang.rumluos.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.net.URI;

@Component
@RequiredArgsConstructor
public class UserHandler {

    private final UserService userService;
    private final RequestValidator validator;

    public Mono<ServerResponse> register(ServerRequest request) {
        return request.bodyToMono(AuthDto.RegisterByAdminRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> userService.register(req, req.getRoleIds()))
                .flatMap(res -> ServerResponse.created(URI.create("/api/v1/users/" + res.getId())).bodyValue(ApiResponse.success(res)));
    }
    
    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return request.bodyToMono(UserDto.UpdateUserRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> userService.update(id, req))
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return userService.getById(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return userService.delete(id)
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> restore(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return userService.restore(id)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> addPermissions(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return request.bodyToMono(UserDto.AddPermissionsRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> userService.addPermissions(id, req))
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> excludePermissions(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return request.bodyToMono(UserDto.ExcludePermissionsRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> userService.excludePermissions(id, req))
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> getMe(ServerRequest request) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (CustomUserDetails) ctx.getAuthentication().getPrincipal())
                .flatMap(userDetails -> userService.getMe(userDetails.getId(), userDetails.isSystemAdmin()))
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> updateMe(ServerRequest request) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (CustomUserDetails) ctx.getAuthentication().getPrincipal())
                .flatMap(userDetails -> request.bodyToMono(UserDto.UpdateMeProfileRequest.class)
                        .doOnNext(validator::validate)
                        .flatMap(req -> userService.updateMe(userDetails.getId(), req))
                )
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> changePassword(ServerRequest request) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (CustomUserDetails) ctx.getAuthentication().getPrincipal())
                .flatMap(userDetails -> request.bodyToMono(UserDto.ChangePasswordRequest.class)
                        .doOnNext(validator::validate)
                        .flatMap(req -> userService.changePassword(userDetails.getId(), req))
                )
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
        return userService.search(page, filters)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }


}
