package com.menglang.rumluos.common.validation;

import com.menglang.rumluos.common.exception.ValidationFailedException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RequestValidator {

    private final Validator validator;

    /**
     * Validates a DTO object. Throws ValidationFailedException if violations are found.
     */
    public <T> void validate(T object) {
        Set<ConstraintViolation<T>> violations = validator.validate(object);
        if (!violations.isEmpty()) {
            Map<String, String> errors = violations.stream()
                    .collect(Collectors.toMap(
                            v -> v.getPropertyPath().toString(),
                            ConstraintViolation::getMessage,
                            (existing, replacement) -> existing + ", " + replacement
                    ));
            throw new ValidationFailedException(errors);
        }
    }
}
