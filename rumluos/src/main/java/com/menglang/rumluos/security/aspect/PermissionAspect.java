package com.menglang.rumluos.security.aspect;

import com.menglang.rumluos.common.exception.ForbiddenException;
import com.menglang.rumluos.security.CustomUserDetails;
import com.menglang.rumluos.security.annotation.RequirePermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class PermissionAspect {

    private final DatabaseClient databaseClient;

    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequirePermission requirePermission) {
        
        Mono<Boolean> hasAccess = ReactiveSecurityContextHolder.getContext()
                .map(ctx -> Objects.requireNonNull(ctx.getAuthentication()).getPrincipal())
                .cast(CustomUserDetails.class)
                .flatMap(user -> {
                    if (user.isSystemAdmin()) {
                        return Mono.just(true); // System Admins can do anything
                    }

                    // SQL to check if the user has a role with the specific permission grant
                    String sql = """
                        SELECT 1
                        FROM users u
                        JOIN user_roles ur ON u.id = ur.user_id
                        JOIN role_permission_grants rpg ON ur.role_id = rpg.role_id
                        JOIN permission_grants pg ON rpg.permission_grant_id = pg.id
                        JOIN permissions p ON pg.permission_id = p.id
                        JOIN actions a ON pg.action_id = a.id
                        WHERE u.id = :userId 
                          AND u.company_id = :companyId
                          AND p.name = :domain 
                          AND a.name = :action
                          AND pg.disabled = false
                          AND u.deleted_at IS NULL
                          AND ur.deleted_at IS NULL
                          AND rpg.deleted_at IS NULL
                        LIMIT 1
                    """;

                    return databaseClient.sql(sql)
                            .bind("userId", user.getId())
                            .bind("companyId", user.getCompanyId())
                            .bind("domain", requirePermission.domain())
                            .bind("action", requirePermission.action())
                            .fetch()
                            .first()
                            .map(result -> true)
                            .defaultIfEmpty(false);
                });

        // Depending on the return type of the intercepted method, we return Mono or Flux
        Class<?> returnType = ((org.aspectj.lang.reflect.MethodSignature) joinPoint.getSignature()).getReturnType();

        if (Mono.class.isAssignableFrom(returnType)) {
            return hasAccess.flatMap(access -> {
                if (!access) return Mono.error(new ForbiddenException("Access Denied: Requires " + requirePermission.domain() + ":" + requirePermission.action()));
                try {
                    return (Mono<?>) joinPoint.proceed();
                } catch (Throwable e) {
                    return Mono.error(e);
                }
            });
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return hasAccess.flatMapMany(access -> {
                if (!access) return Flux.error(new ForbiddenException("Access Denied: Requires " + requirePermission.domain() + ":" + requirePermission.action()));
                try {
                    return (Flux<?>) joinPoint.proceed();
                } catch (Throwable e) {
                    return Flux.error(e);
                }
            });
        }

        throw new IllegalStateException("Reactive methods annotated with @RequirePermission must return Mono or Flux");
    }
}
