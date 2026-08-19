package com.menglang.rumluos.domain.auth.router;

import com.menglang.rumluos.domain.auth.router.handler.UserHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class UserRouter {

    @Bean
    public RouterFunction<ServerResponse> userRoutes(UserHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/users", builder -> builder
                        .POST("/register", handler::register)
                        .PUT("/{id}", handler::update)
                        .DELETE("/{id}", handler::delete)
                        .POST("/{id}/restore", handler::restore)
                        .GET("/{id}", handler::getById)
                        .POST("/{id}/permissions", handler::addPermissions)
                        .POST("/{id}/exclude-permissions", handler::excludePermissions)
                        .GET("/me/profile", handler::getMe)
                        .PUT("/me/profile", handler::updateMe)
                        .POST("/me/password", handler::changePassword)
                        .POST("/me/change-password", handler::changePassword)
                        .GET("", handler::search)
                )
                .build();
    }
}
