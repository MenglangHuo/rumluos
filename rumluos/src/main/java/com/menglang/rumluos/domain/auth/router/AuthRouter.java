package com.menglang.rumluos.domain.auth.router;

import com.menglang.rumluos.domain.auth.router.handler.AuthHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

@Configuration
public class AuthRouter {

    @Bean
    public RouterFunction<ServerResponse> authRoutes(AuthHandler handler) {
        return RouterFunctions.route()
                .path("/api/v1/auth", builder -> builder
                        .POST("/login", handler::login)
                        .POST("/refresh-token", handler::refreshToken)
                        .POST("/forget-password", handler::forgetPassword)
                        .POST("/reset-password", handler::resetPassword)
                        .POST("/register-by-admin", handler::registerByAdmin)
                        .POST("/sign-out", handler::logout)
                        .POST("/logout", handler::logout)
                )
                .build();
    }
}
