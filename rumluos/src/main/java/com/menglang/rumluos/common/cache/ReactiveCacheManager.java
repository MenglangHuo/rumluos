package com.menglang.rumluos.common.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * High-performance reactive caching wrapper over Caffeine.
 *
 * <p>Standard Spring `@Cacheable` operates synchronously and blocks threads,
 * which goes against WebFlux non-blocking principles. This manager caches
 * the resolved results of database calls and returns them via non-blocking
 * `Mono.just(value)`, falling back to the database publisher on cache miss.
 */
@Component
public class ReactiveCacheManager {

    // Cache with 10-minute expiry and 10,000 max size
    private final Cache<String, Object> cache = Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(10000)
            .build();

    /**
     * Retrieve from cache, or load via supplier and populate cache.
     *
     * @param key    The cache key.
     * @param loader The fallback database supplier.
     * @param <T>    The entity type.
     * @return A Mono emitting the value.
     */
    @SuppressWarnings("unchecked")
    public <T> Mono<T> getOrLoad(String key, Supplier<Mono<T>> loader) {
        Object cached = cache.getIfPresent(key);
        if (cached != null) {
            return Mono.just((T) cached);
        }
        return loader.get()
                .doOnNext(value -> cache.put(key, value));
    }

    /**
     * Invalidate/evict cache entries for a specific key.
     *
     * @param key Cache key.
     */
    public void evict(String key) {
        cache.invalidate(key);
    }

    /**
     * Clear all cache entries.
     */
    public void clearAll() {
        cache.invalidateAll();
    }
}
