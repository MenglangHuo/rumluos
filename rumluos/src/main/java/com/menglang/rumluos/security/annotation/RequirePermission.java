package com.menglang.rumluos.security.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to enforce fine-grained access control on Reactive Service methods.
 * Requires the user to have a specific action granted for a specific domain.
 * Example: @RequirePermission(domain = "customer", action = "read")
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String domain();
    String action();
}
