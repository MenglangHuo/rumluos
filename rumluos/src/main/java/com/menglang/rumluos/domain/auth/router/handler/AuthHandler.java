package com.menglang.rumluos.domain.auth.router.handler;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.auth.dto.AuthDto;
import com.menglang.rumluos.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class AuthHandler {

    private final AuthService authService;
    private final RequestValidator validator;

    public Mono<ServerResponse> login(ServerRequest request) {
        return request.bodyToMono(AuthDto.LoginRequest.class)
                .doOnNext(validator::validate)
                .flatMap(authService::login)
                .flatMap(response -> ServerResponse.ok().bodyValue(ApiResponse.success(response)));
    }

    public Mono<ServerResponse> refreshToken(ServerRequest request) {
        return request.bodyToMono(AuthDto.RefreshTokenRequest.class)
                .doOnNext(validator::validate)
                .flatMap(authService::refreshToken)
                .flatMap(response -> ServerResponse.ok().bodyValue(ApiResponse.success(response)));
    }

    public Mono<ServerResponse> forgetPassword(ServerRequest request) {
        return request.bodyToMono(AuthDto.ForgetPasswordRequest.class)
                .doOnNext(validator::validate)
                .flatMap(authService::forgetPassword)
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> resetPassword(ServerRequest request) {
        return request.bodyToMono(AuthDto.ResetPasswordRequest.class)
                .doOnNext(validator::validate)
                .flatMap(authService::resetPassword)
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> registerByAdmin(ServerRequest request) {
        return request.bodyToMono(AuthDto.RegisterByAdminRequest.class)
                .doOnNext(validator::validate)
                .flatMap(authService::registerByAdmin)
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }

    public Mono<ServerResponse> logout(ServerRequest request) {
        return request.bodyToMono(AuthDto.RefreshTokenRequest.class)
                .onErrorResume(e -> Mono.empty())
                .flatMap(authService::logout)
                .switchIfEmpty(Mono.empty())
                .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
    }
}
