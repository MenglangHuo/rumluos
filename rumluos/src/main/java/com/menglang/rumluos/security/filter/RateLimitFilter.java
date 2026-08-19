package com.menglang.rumluos.security.filter;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * A simple, dependency-free in-memory rate limiter for authentication endpoints.
 * Limits users to 5 requests per minute per IP address.
 */
@Component
public class RateLimitFilter implements WebFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    
    // Store request counts per IP. In production, use Redis!
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        
        // Only rate limit auth endpoints (login, forgot password, otp)
        if (path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/forget-password")) {
            String ip = exchange.getRequest().getRemoteAddress() != null 
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress() 
                    : "unknown";

            TokenBucket bucket = buckets.computeIfAbsent(ip, k -> new TokenBucket());
            
            if (!bucket.tryConsume()) {
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                return exchange.getResponse().setComplete();
            }
        }
        
        return chain.filter(exchange);
    }

    private static class TokenBucket {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile Instant resetTime = Instant.now().plusSeconds(60);

        public boolean tryConsume() {
            if (Instant.now().isAfter(resetTime)) {
                count.set(0);
                resetTime = Instant.now().plusSeconds(60);
            }
            return count.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }
    }
}
