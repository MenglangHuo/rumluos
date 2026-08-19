package com.menglang.rumluos.common.page;


import com.menglang.rumluos.common.exception.InvalidSortFieldException;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RequestPage {

    @Min(value = 0, message = "Page number cannot be less than 0")
    @Builder.Default
    @Parameter(description = "Zero-based page index (0..N)", example = "0")
    private int page = 0;

    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 100, message = "Page size cannot exceed 100")
    @Builder.Default
    @Parameter(description = "Page size", example = "20")
    private int size = 20;

    /**
     * Comma-joined convention only: ?sort=createdAt,desc&sort=name,asc
     * (Avoids ambiguity with the old "sort=field&sort=direction" split-param style.)
     */
    @Builder.Default
    @Parameter(description = "Sort: field,direction. Repeatable.", example = "createdAt,desc")
    private List<String> sort = new ArrayList<>();

    @Parameter(description = "Search keyword — searches across name, email, phone, etc.", example = "bronx")
    @Size(max = 100, message = "Query cannot exceed 100 characters")
    private String query;

    @Parameter(description = "Filter from date (inclusive), ISO-8601", example = "2025-01-01")
    private String from;

    @Parameter(description = "Filter to date (inclusive), ISO-8601", example = "2025-12-31")
    private String to;

    /**
     * No whitelist — safe only for trusted/internal callers.
     */
    public Pageable toPageable() {
        return toPageable(null);
    }

    /**
     * Whitelist sortable fields via an enum implementing SortableField.
     * Example: requestPage.toPageable(UserSortField.class)
     */
    public <F extends Enum<F> & SortableField> Pageable toPageable(Class<F> allowedFields) {
        Set<String> allowed = allowedFields != null
                ? Arrays.stream(allowedFields.getEnumConstants())
                .map(Enum::name)
                .collect(Collectors.toUnmodifiableSet())
                : null;

        List<Sort.Order> orders = new ArrayList<>();

        if (sort != null) {
            for (String raw : sort) {
                String current = raw == null ? "" : raw.trim();
                if (!StringUtils.hasText(current)) continue;

                String[] parts = current.split(",", 2);
                String field = parts[0].trim();
                Sort.Direction dir = parts.length > 1
                        ? Sort.Direction.fromOptionalString(parts[1].trim()).orElse(Sort.Direction.ASC)
                        : Sort.Direction.ASC;

                if (allowed != null && !allowed.contains(field)) {
                    throw new InvalidSortFieldException(field, allowed);
                }

                orders.add(new Sort.Order(dir, field));
            }
        }

        orders = orders.stream().distinct().toList();

        Sort finalSort = orders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(orders);


        return PageRequest.of(page, size, finalSort);
    }
}