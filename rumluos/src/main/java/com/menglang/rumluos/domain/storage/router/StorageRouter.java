package com.menglang.rumluos.domain.storage.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RequestPredicates.POST;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Configuration
public class StorageRouter {

    @Bean
    public RouterFunction<ServerResponse> storageRoutes(StorageHandler handler) {
        return route(POST("/api/v1/storage/upload-url"), handler::generateUploadUrl)
                .andRoute(GET("/api/v1/storage/download-url"), handler::generateDownloadUrl)
                .andRoute(GET("/api/v1/storage/object/{*key}"), handler::getObjectUrl);
    }
}
