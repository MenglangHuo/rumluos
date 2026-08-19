package com.menglang.rumluos.common.service;

import com.menglang.rumluos.common.exception.BadRequestException;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.PageUtils;
import com.menglang.rumluos.common.page.RequestPage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.ConversionException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.relational.core.mapping.RelationalPersistentEntity;
import org.springframework.data.relational.core.mapping.RelationalPersistentProperty;
import org.springframework.data.relational.core.sql.SqlIdentifier;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicSearchService {

    private static final Pattern SAFE_IDENTIFIER = Pattern.compile("[A-Za-z][A-Za-z0-9_]*");
    private static final Set<String> SERVER_OWNED_FILTER_COLUMNS = Set.of("company_id", "deleted_at");
    private static final String DEFAULT_SORT_FIELD = "createdAt";
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, DEFAULT_SORT_FIELD);

    private final R2dbcEntityTemplate template;
    private final ConcurrentMap<Class<?>, EntitySearchMetadata> metadataCache = new ConcurrentHashMap<>();

    /**
     * Executes a dynamic paginated search against a specific table entity.
     * Enforces `company_id` if provided.
     *
     * @param requestPage  The pagination, sorting, and keyword request.
     * @param entityClass  The mapped R2DBC entity class.
     * @param companyId    Optional companyId constraint for tenant isolation.
     * @param searchFields Columns to apply the keyword `query` against using ILIKE.
     * @param filters      Map of key-value filters.
     */
    public <T> Mono<PageResponse<T>> search(RequestPage requestPage, Class<T> entityClass, Long companyId, List<String> searchFields, Map<String, Object> filters) {
        return searchInternal(requestPage, entityClass, companyId, searchFields, filters, null);
    }

    /**
     * Overload using SearchConfig.
     */
    public <T> Mono<PageResponse<T>> search(RequestPage requestPage, SearchConfig<T> config, Long companyId, Map<String, Object> filters) {
        return searchInternal(
                requestPage,
                config.getEntityClass(),
                companyId,
                config.getSearchableColumns(),
                filters,
                config.getFilterableColumns()
        );
    }

    private <T> Mono<PageResponse<T>> searchInternal(
            RequestPage requestPage,
            Class<T> entityClass,
            Long companyId,
            List<String> searchFields,
            Map<String, Object> filters,
            Set<String> configuredFilterableColumns
    ) {
        EntitySearchMetadata metadata = metadataFor(entityClass);
        Pageable pageable = toSafePageable(requestPage, metadata);
        Criteria criteria = Criteria.empty();

        if (companyId != null && metadata.hasColumn("company_id")) {
            criteria = criteria.and("company_id").is(companyId);
        }

        // Implicitly ignore soft-deleted records for all generic searches
        if (metadata.hasColumn("deleted_at")) {
            criteria = criteria.and("deleted_at").isNull();
        }

        // Date range filtering on created_at
        if (metadata.hasColumn("created_at") && StringUtils.hasText(requestPage.getFrom())) {
            try {
                Instant fromInstant = LocalDate.parse(requestPage.getFrom()).atStartOfDay().toInstant(ZoneOffset.UTC);
                criteria = criteria.and("created_at").greaterThanOrEquals(fromInstant);
            } catch (Exception ignored) {
            }
        }
        if (metadata.hasColumn("created_at") && StringUtils.hasText(requestPage.getTo())) {
            try {
                Instant toInstant = LocalDate.parse(requestPage.getTo()).atTime(23, 59, 59).toInstant(ZoneOffset.UTC);
                criteria = criteria.and("created_at").lessThanOrEquals(toInstant);
            } catch (Exception ignored) {
            }
        }

        if (StringUtils.hasText(requestPage.getQuery()) && searchFields != null && !searchFields.isEmpty()) {
            String keyword = "%" + requestPage.getQuery() + "%";
            Criteria searchCriteria = Criteria.empty();

            for (String field : searchFields) {
                FilterField searchField = metadata.resolveFilterField(field);
                if (searchField == null) {
                    log.debug("Ignoring unmapped search field '{}' for {}", field, entityClass.getSimpleName());
                    continue;
                }
                if (searchCriteria.isEmpty()) {
                    searchCriteria = Criteria.where(searchField.column()).like(keyword).ignoreCase(true);
                } else {
                    searchCriteria = searchCriteria.or(searchField.column()).like(keyword).ignoreCase(true);
                }
            }
            if (!searchCriteria.isEmpty()) {
                criteria = criteria.and(searchCriteria);
            }
        }

        criteria = applyFilters(criteria, entityClass, metadata, filters, configuredFilterableColumns);

        // Use with(pageable) to properly attach sort, limit, and offset without altering SQL query structure
        Query query = Query.query(criteria).with(pageable);

        Mono<List<T>> contentMono = template.select(entityClass)
                .matching(query)
                .all()
                .collectList();

        Mono<Long> countMono = template.select(entityClass)
                .matching(Query.query(criteria))
                .count();

        return Mono.zip(contentMono, countMono)
                .map(tuple -> PageUtils.createPageResponse(tuple.getT1(), tuple.getT2(), pageable));
    }

    private <T> Criteria applyFilters(
            Criteria criteria,
            Class<T> entityClass,
            EntitySearchMetadata metadata,
            Map<String, Object> filters,
            Set<String> configuredFilterableColumns
    ) {
        if (filters == null || filters.isEmpty()) {
            return criteria;
        }

        Set<String> filterableColumns = configuredFilterableColumns == null || configuredFilterableColumns.isEmpty()
                ? null
                : resolveConfiguredColumns(metadata, configuredFilterableColumns);

        Criteria currentCriteria = criteria;
        for (Map.Entry<String, Object> entry : filters.entrySet()) {
            Object rawValue = entry.getValue();
            if (rawValue == null || !StringUtils.hasText(rawValue.toString())) {
                continue;
            }

            FilterField field = metadata.resolveFilterField(entry.getKey());
            if (field == null) {
                log.debug("Ignoring unmapped filter '{}' for {}", entry.getKey(), entityClass.getSimpleName());
                continue;
            }
            if (SERVER_OWNED_FILTER_COLUMNS.contains(field.column())) {
                continue;
            }
            if (filterableColumns != null && !filterableColumns.contains(field.column())) {
                log.debug("Ignoring non-filterable field '{}' for {}", entry.getKey(), entityClass.getSimpleName());
                continue;
            }

            Object convertedValue = convertFilterValue(rawValue, field);
            currentCriteria = currentCriteria.and(field.column()).is(convertedValue);
        }
        return currentCriteria;
    }

    private Set<String> resolveConfiguredColumns(EntitySearchMetadata metadata, Set<String> configuredFields) {
        Set<String> columns = new HashSet<>();
        for (String configuredField : configuredFields) {
            FilterField field = metadata.resolveFilterField(configuredField);
            if (field != null && !SERVER_OWNED_FILTER_COLUMNS.contains(field.column())) {
                columns.add(field.column());
            }
        }
        return columns;
    }

    private Object convertFilterValue(Object rawValue, FilterField field) {
        Class<?> targetType = field.type();
        if (rawValue == null || targetType == null || targetType.isInstance(rawValue)) {
            return rawValue;
        }
        if (targetType.isEnum()) {
            return convertEnum(rawValue, targetType);
        }
        try {
            Object converted = template.getConverter().getConversionService().convert(rawValue, targetType);
            return converted != null ? converted : rawValue;
        } catch (ConversionException | IllegalArgumentException ex) {
            throw new BadRequestException("Invalid value for filter '" + field.requestName() + "'.");
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private Object convertEnum(Object rawValue, Class<?> enumType) {
        String value = rawValue.toString().trim();
        for (Object constant : enumType.getEnumConstants()) {
            if (((Enum) constant).name().equalsIgnoreCase(value)) {
                return constant;
            }
        }
        throw new BadRequestException("Invalid value '" + value + "' for filter.");
    }

    private Pageable toSafePageable(RequestPage requestPage, EntitySearchMetadata metadata) {
        List<Sort.Order> orders = new ArrayList<>();
        if (requestPage.getSort() != null) {
            for (String raw : requestPage.getSort()) {
                if (!StringUtils.hasText(raw)) {
                    continue;
                }

                String[] parts = raw.trim().split(",", 2);
                SortField sortField = metadata.resolveSortField(parts[0]);
                if (sortField == null) {
                    log.debug("Ignoring unmapped sort field '{}'", parts[0]);
                    continue;
                }

                Sort.Direction direction = parts.length > 1
                        ? Sort.Direction.fromOptionalString(parts[1].trim()).orElse(Sort.Direction.ASC)
                        : Sort.Direction.ASC;
                orders.add(new Sort.Order(direction, sortField.property()));
            }
        }

        Sort sort = orders.isEmpty()
                ? defaultSort(metadata)
                : Sort.by(orders.stream().distinct().toList());

        return PageRequest.of(requestPage.getPage(), requestPage.getSize(), sort);
    }

    private Sort defaultSort(EntitySearchMetadata metadata) {
        return metadata.resolveSortField(DEFAULT_SORT_FIELD) != null ? DEFAULT_SORT : Sort.unsorted();
    }

    private <T> EntitySearchMetadata metadataFor(Class<T> entityClass) {
        return metadataCache.computeIfAbsent(entityClass, this::buildMetadata);
    }

    private EntitySearchMetadata buildMetadata(Class<?> entityClass) {
        RelationalPersistentEntity<?> entity = template.getConverter()
                .getMappingContext()
                .getRequiredPersistentEntity(entityClass);

        Map<String, FilterField> filterFields = new HashMap<>();
        Map<String, SortField> sortFields = new HashMap<>();
        Set<String> columns = new HashSet<>();

        for (RelationalPersistentProperty property : entity) {
            String propertyName = property.getName();
            String column = columnName(property.getColumnName());
            if (!isSafeIdentifier(column)) {
                continue;
            }

            columns.add(column);
            Class<?> propertyType = property.getType();
            FilterField filterField = new FilterField(column, propertyName, propertyType);
            SortField sortField = new SortField(propertyName);

            addAliases(filterFields, filterField, propertyName, column);
            addAliases(sortFields, sortField, propertyName, column);
        }

        addReflectionAliases(entityClass, filterFields, sortFields);

        return new EntitySearchMetadata(
                Collections.unmodifiableMap(filterFields),
                Collections.unmodifiableMap(sortFields),
                Collections.unmodifiableSet(columns)
        );
    }

    private void addReflectionAliases(Class<?> entityClass, Map<String, FilterField> filterFields, Map<String, SortField> sortFields) {
        Class<?> current = entityClass;
        while (current != null && current != Object.class) {
            for (Field field : current.getDeclaredFields()) {
                org.springframework.data.relational.core.mapping.Column columnAnnotation =
                        field.getAnnotation(org.springframework.data.relational.core.mapping.Column.class);
                if (columnAnnotation == null || !StringUtils.hasText(columnAnnotation.value())) {
                    continue;
                }

                String column = columnAnnotation.value();
                if (!isSafeIdentifier(column)) {
                    continue;
                }

                FilterField existingFilterField = filterFields.get(normalize(column));
                SortField existingSortField = sortFields.get(normalize(column));
                if (existingFilterField != null) {
                    addAliases(filterFields, existingFilterField, field.getName(), column);
                }
                if (existingSortField != null) {
                    addAliases(sortFields, existingSortField, field.getName(), column);
                }
            }
            current = current.getSuperclass();
        }
    }

    private <V> void addAliases(Map<String, V> target, V value, String propertyName, String column) {
        for (String alias : aliases(propertyName, column)) {
            target.putIfAbsent(normalize(alias), value);
        }
    }

    private Set<String> aliases(String propertyName, String column) {
        Set<String> aliases = new LinkedHashSet<>();
        if (StringUtils.hasText(propertyName)) {
            aliases.add(propertyName);
            aliases.add(toSnakeCase(propertyName));
            if (propertyName.startsWith("is") && propertyName.length() > 2 && Character.isUpperCase(propertyName.charAt(2))) {
                String withoutIs = Character.toLowerCase(propertyName.charAt(2)) + propertyName.substring(3);
                aliases.add(withoutIs);
                aliases.add(toSnakeCase(withoutIs));
            }
        }
        if (StringUtils.hasText(column)) {
            aliases.add(column);
        }
        return aliases;
    }

    private String columnName(SqlIdentifier identifier) {
        return identifier.getReference();
    }

    private boolean isSafeIdentifier(String value) {
        return StringUtils.hasText(value) && SAFE_IDENTIFIER.matcher(value).matches();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String toSnakeCase(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }

        StringBuilder result = new StringBuilder(value.length() + 8);
        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            if (Character.isUpperCase(current)) {
                if (i > 0) {
                    result.append('_');
                }
                result.append(Character.toLowerCase(current));
            } else {
                result.append(current);
            }
        }
        return result.toString();
    }

    private record EntitySearchMetadata(
            Map<String, FilterField> filterFields,
            Map<String, SortField> sortFields,
            Set<String> columns
    ) {
        private boolean hasColumn(String column) {
            return columns.contains(column);
        }

        private FilterField resolveFilterField(String requestName) {
            FilterField field = filterFields.get(requestName == null ? "" : requestName.trim().toLowerCase(Locale.ROOT));
            return field == null ? null : new FilterField(field.column(), requestName, field.type());
        }

        private SortField resolveSortField(String requestName) {
            return sortFields.get(requestName == null ? "" : requestName.trim().toLowerCase(Locale.ROOT));
        }
    }

    private record FilterField(String column, String requestName, Class<?> type) {
    }

    private record SortField(String property) {
    }
}
