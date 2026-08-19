package com.menglang.rumluos.common.page;

// exception/ErrorResponse.java
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        Instant timestamp,
        int status,
        String errorCode,
        String message,
        String path,
        List<String> details
) {
    public static ErrorResponse of(int status, String errorCode, String message, String path) {
        return new ErrorResponse(Instant.now(), status, errorCode, message, path, null);
    }

    public static ErrorResponse of(int status, String errorCode, String message, String path, List<String> details) {
        return new ErrorResponse(Instant.now(), status, errorCode, message, path, details);
    }
}