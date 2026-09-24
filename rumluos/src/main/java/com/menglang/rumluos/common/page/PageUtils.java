package com.menglang.rumluos.common.page;

import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class PageUtils {
    private static final Set<String> CONTROL_QUERY_PARAMS = Set.of(
            "page",
            "size",
            "limit",
            "perpage",
            "per_page",
            "pagesize",
            "page_size",
            "sort",
            "query",
            "q",
            "search",
            "from",
            "to",
            "startdate",
            "start_date",
            "enddate",
            "end_date"
    );

    /**
     * Build a PageResponse reactively from a Flux of content + a separate count Mono.
     * This is the standard WebFlux pattern: fetch page data and total count in parallel,
     * then zip them together (R2DBC/reactive Mongo repositories don't return Page<T>).
     */
    public static <T> Mono<PageResponse<T>> createPageResponse(Flux<T> content, Mono<Long> countMono, Pageable pageable) {
        return content.collectList()
                .zipWith(countMono)
                .map(tuple -> build(tuple.getT1(), tuple.getT2(), pageable));
    }
    /**
     * Overload when you already have the content as a List (e.g. after collectList())
     * and just need to assemble the response.
     */
    public static <T> PageResponse<T> createPageResponse(List<T> content, long totalElements, Pageable pageable) {
        return build(content, totalElements, pageable);
    }


    private static <T> PageResponse<T> build(List<T> content, long totalElements, Pageable pageable) {
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int totalPages = pageSize == 0 ? 1 : (int) Math.ceil((double) totalElements / pageSize);

        return PageResponse.<T>builder()
                .content(content)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .first(pageNumber == 0)
                .last(pageNumber >= totalPages - 1)
                .empty(content.isEmpty())
                .build();
    }


    /**
     * In-memory pagination for an already-fully-fetched list (e.g. small reference data,
     * aggregated results, or data already materialized via collectList()).
     * Use sparingly — prefer DB-level pagination (LIMIT/OFFSET via Pageable) for large datasets.
     */
    public static <T> PageResponse<T> of(List<T> allItems, int page, int size) {
        int total = allItems.size();
        int totalPages = (size == 0) ? 1 : (int) Math.ceil((double) total / size);

        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);

        List<T> pageData = allItems.subList(fromIndex, toIndex);

        return PageResponse.<T>builder()
                .pageNumber(page)
                .pageSize(size)
                .totalElements(total)
                .totalPages(totalPages)
                .first(page == 0)
                .last(page >= totalPages - 1)
                .content(pageData)
                .empty(pageData.isEmpty())
                .build();
    }

    /**
     * Reactive variant of `of()` — paginate a Flux without blocking,
     * collecting only once.
     */
    public static <T> Mono<PageResponse<T>> ofFlux(Flux<T> source, int page, int size) {
        return source.collectList()
                .map(allItems -> of(allItems, page, size));
    }

    /**
     * Extracts dynamic query filters from a ServerRequest, ignoring pagination parameters.
     */
    public static Map<String, Object> extractFilters(org.springframework.web.reactive.function.server.ServerRequest request) {
        Map<String, Object> filters = new java.util.HashMap<>();
        request.queryParams().forEach((key, values) -> {
            if (!isControlQueryParam(key) && !values.isEmpty()) {
                filters.put(key, values.getFirst());
            }
        });
        return filters;
    }

    private static boolean isControlQueryParam(String key) {
        return key != null && CONTROL_QUERY_PARAMS.contains(key.trim().toLowerCase(Locale.ROOT));
    }
}
