package com.menglang.rumluos.domain.auth.router;

import com.menglang.rumluos.domain.auth.router.handler.PermissionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class PermissionRouter {

    @Bean
    public RouterFunction<ServerResponse> permissionRoutes(PermissionHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/permissions", builder -> builder
                        .GET("", handler::getAllPermissions)
                )
                .build();
    }
}
