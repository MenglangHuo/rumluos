package com.menglang.rumluos.security;

import com.menglang.rumluos.domain.auth.repository.SystemAdminRepository;
import com.menglang.rumluos.domain.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class RevalidateTokenFilter implements WebFilter {

    private final UserRepository userRepository;
    private final SystemAdminRepository systemAdminRepository;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        HttpMethod method = exchange.getRequest().getMethod();
        
        // Only re-validate on write operations (sensitive endpoints)
        if (method == HttpMethod.GET || method == HttpMethod.OPTIONS || method == HttpMethod.HEAD) {
            return chain.filter(exchange);
        }

        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .filter(auth -> auth.isAuthenticated() && auth.getPrincipal() instanceof CustomUserDetails)
                .flatMap(auth -> {
                    CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
                    UUID userKey;
                    try {
                        assert userDetails != null;
                        userKey = UUID.fromString(userDetails.getUserKey());
                    } catch (Exception e) {
                        return Mono.error(new RuntimeException("Invalid userKey format"));
                    }

                    if (userDetails.isSystemAdmin()) {
                        return systemAdminRepository.findByAdminKey(userKey)
                                .flatMap(admin -> {
                                    if (!admin.isActive() || !admin.getTokenVersion().equals(userDetails.getTokenVersion())) {
                                        return Mono.error(new RuntimeException("Token revoked or user inactive"));
                                    }
                                    return Mono.just(true);
                                })
                                .switchIfEmpty(Mono.error(new RuntimeException("Admin not found")));
                    } else {
                        return userRepository.findByUserKey(userKey)
                                .flatMap(user -> {
                                    if (!user.isActive() || !user.getTokenVersion().equals(userDetails.getTokenVersion())) {
                                        return Mono.error(new RuntimeException("Token revoked or user inactive"));
                                    }
                                    // Also re-validate companyId
                                    if (user.getCompanyId() != null && !user.getCompanyId().equals(userDetails.getCompanyId())) {
                                        return Mono.error(new RuntimeException("Company ID mismatch - user has changed tenants"));
                                    }
                                    return Mono.just(true);
                                })
                                .switchIfEmpty(Mono.error(new RuntimeException("User not found")));
                    }
                })
                .flatMap(valid -> chain.filter(exchange))
                .onErrorResume(e -> {
                    log.warn("Security re-validation failed: {}", e.getMessage());
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                })
                .switchIfEmpty(chain.filter(exchange)); // Proceed if not authenticated or not matched
    }
}
