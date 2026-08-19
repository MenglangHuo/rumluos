package com.menglang.rumluos.domain.auth.router;

import com.menglang.rumluos.domain.auth.router.handler.RoleHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class RoleRouter {

    @Bean
    public RouterFunction<ServerResponse> roleRoutes(RoleHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/roles", builder -> builder
                        .POST("", handler::create)
                        .PUT("/{id}", handler::update)
                        .DELETE("/{id}", handler::delete)
                        .POST("/{id}/restore", handler::restore)
                        .POST("/{id}/exclude-permissions", handler::excludePermissions)
                        .GET("", handler::search)
                )
                .build();
    }
}
