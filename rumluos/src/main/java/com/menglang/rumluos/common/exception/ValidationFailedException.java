package com.menglang.rumluos.common.exception;

import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

public class ValidationFailedException extends ApiException {

    private final Map<String, String> fieldErrors;

    public ValidationFailedException(Map<String, String> fieldErrors) {
        super(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED",
                "Validation failed: " + String.join(", ", List.copyOf(fieldErrors.values())));
        this.fieldErrors = fieldErrors;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
