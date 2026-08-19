package com.menglang.rumluos.common.exception;

import com.menglang.rumluos.common.page.ApiResponse;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

    // ---- Domain-specific exceptions (NotFound, Conflict, BadRequest, Unauthorized, Forbidden) ----
    @ExceptionHandler(ApiException.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleApiException(ApiException ex, ServerWebExchange exchange) {
        ApiResponse<Void> body = ApiResponse.error(ex.getMessage(), ex.getErrorCode());
        return Mono.just(ResponseEntity.status(ex.getStatus()).body(body));
    }

    // ---- Bean validation errors on @RequestBody (WebFlux equivalent of MethodArgumentNotValidException) ----
    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleValidation(WebExchangeBindException ex, ServerWebExchange exchange) {
        List<String> details = ex.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .toList();

        ApiResponse<Void> body = ApiResponse.error("Validation failed", String.join(", ", details));
        return Mono.just(ResponseEntity.badRequest().body(body));
    }

    // ---- Malformed JSON / type mismatches ----
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex, ServerWebExchange exchange) {
        ApiResponse<Void> body = ApiResponse.error("Request body is malformed or unreadable", "MALFORMED_REQUEST");
        return Mono.just(ResponseEntity.badRequest().body(body));
    }

    // ---- Explicit ResponseStatusException thrown anywhere in the chain ----
    @ExceptionHandler(ResponseStatusException.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleResponseStatus(ResponseStatusException ex, ServerWebExchange exchange) {
        ApiResponse<Void> body = ApiResponse.error(ex.getReason() != null ? ex.getReason() : ex.getMessage(), ex.getStatusCode().toString());
        return Mono.just(ResponseEntity.status(ex.getStatusCode()).body(body));
    }

    // ---- Catch-all fallback ----
    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleGeneric(Exception ex, ServerWebExchange exchange) {
        ex.printStackTrace(); // Log the exception stack trace to see the root cause
        ApiResponse<Void> body = ApiResponse.error("An unexpected error occurred: " + ex.getMessage(), "INTERNAL_SERVER_ERROR");
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body));
    }
}