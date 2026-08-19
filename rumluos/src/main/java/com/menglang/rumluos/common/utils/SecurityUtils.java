package com.menglang.rumluos.common.utils;

import com.menglang.rumluos.security.CustomUserDetails;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Mono;

import java.util.Objects;

public class SecurityUtils {

    public static Mono<Long> getCurrentCompanyId() {
        return Mono.deferContextual(ctxView ->
                ReactiveSecurityContextHolder.getContext()
                        .filter(ctx -> ctx.getAuthentication() != null && ctx.getAuthentication().getPrincipal() instanceof CustomUserDetails)
                        .map(ctx -> (CustomUserDetails) ctx.getAuthentication().getPrincipal())
                        .flatMap(userDetails -> {
                            if (userDetails.isSystemAdmin()) {
                                if (ctxView.hasKey("REQUEST_COMPANY_ID")) {
                                    Long requestedCompanyId = ctxView.get("REQUEST_COMPANY_ID");
                                    return Mono.just(requestedCompanyId);
                                }
                                return Mono.justOrEmpty(userDetails.getCompanyId());
                            }
                            return Mono.justOrEmpty(userDetails.getCompanyId());
                        })
        );
    }

    public static Mono<Long> getCurrentUserId() {
        return ReactiveSecurityContextHolder.getContext()
                .filter(ctx -> ctx.getAuthentication() != null && ctx.getAuthentication().getPrincipal() instanceof CustomUserDetails)
                .map(ctx -> (CustomUserDetails) ctx.getAuthentication().getPrincipal())
                .flatMap(userDetails -> Mono.justOrEmpty(userDetails.getId()));
    }
}
