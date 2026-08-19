package com.menglang.rumluos.common.exception;

import java.util.Set;

public class InvalidSortFieldException extends BadRequestException {
    public InvalidSortFieldException(String field, Set<String> allowed) {
        super("Invalid sort field: '" + field + "'. Allowed fields: " + allowed);
    }
}