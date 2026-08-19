package com.menglang.rumluos.domain.auth.router.handler;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.auth.service.permission.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class PermissionHandler {

    private final PermissionService permissionService;

    public Mono<ServerResponse> getAllPermissions(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMapMany(permissionService::getAllPermissions)
                .switchIfEmpty(permissionService.getAllPermissions(1L))
                .collectList()
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }
}
