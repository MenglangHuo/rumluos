package com.menglang.rumluos.domain.auth.router;

import com.menglang.rumluos.domain.auth.router.handler.SystemAdminHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class SystemAdminRouter {

    @Bean
    public RouterFunction<ServerResponse> systemAdminRoutes(SystemAdminHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/system-admins", builder -> builder
                        .POST("", handler::create)
                        .GET("", handler::getAll)
                        .GET("/{id}", handler::getById)
                )
                .build();
    }
}
