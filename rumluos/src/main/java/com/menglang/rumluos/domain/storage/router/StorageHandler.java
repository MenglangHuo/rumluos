package com.menglang.rumluos.domain.storage.router;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.storage.dto.StorageDto;
import com.menglang.rumluos.domain.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class StorageHandler {

    private final StorageService storageService;
    private final RequestValidator validator;

    public Mono<ServerResponse> generateUploadUrl(ServerRequest request) {
        return request.bodyToMono(StorageDto.GenerateUploadUrlRequest.class)
                .doOnNext(validator::validate)
                .flatMap(storageService::generateUploadUrl)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> generateDownloadUrl(ServerRequest request) {
        String key = request.queryParam("key")
                .orElseThrow(() -> new IllegalArgumentException("Query parameter 'key' is required"));
                
        return storageService.generateDownloadUrl(key)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getObjectUrl(ServerRequest request) {
        String path = request.pathVariable("key");
        boolean redirect = request.queryParam("redirect").map(Boolean::parseBoolean).orElse(true);

        return storageService.generateDownloadUrl(path)
                .flatMap(res -> {
                    if (redirect) {
                        return ServerResponse.temporaryRedirect(java.net.URI.create(res.getDownloadUrl())).build();
                    }
                    return ServerResponse.ok().bodyValue(ApiResponse.success(res));
                });
    }
}
