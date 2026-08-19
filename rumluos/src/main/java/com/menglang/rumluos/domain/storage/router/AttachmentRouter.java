package com.menglang.rumluos.domain.storage.router;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerResponse;

import static org.springframework.web.reactive.function.server.RequestPredicates.*;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Configuration
public class AttachmentRouter {

    @Bean
    public RouterFunction<ServerResponse> attachmentRoutes(AttachmentHandler handler) {
        return route(POST("/api/v1/attachments"), handler::createAttachment)
                .andRoute(GET("/api/v1/attachments"), handler::listAttachments)
                .andRoute(GET("/api/v1/attachments/{id}"), handler::getAttachmentById)
                .andRoute(PUT("/api/v1/attachments/{id}"), handler::updateAttachment)
                .andRoute(DELETE("/api/v1/attachments/{id}"), handler::deleteAttachment)
                .andRoute(GET("/api/v1/attachments/{id}/download-url"), handler::generateDownloadUrl);
    }
}
