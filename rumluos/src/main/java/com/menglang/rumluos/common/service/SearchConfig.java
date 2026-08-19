package com.menglang.rumluos.common.service;

import com.menglang.rumluos.common.page.SortableField;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Set;

@Getter
@Builder
public class SearchConfig<T> {
    private final Class<T> entityClass;
    private final List<String> searchableColumns;
    private final Set<String> filterableColumns;
    private final Class<? extends Enum<?>> sortFieldEnum;

    public static <T> SearchConfig<T> of(Class<T> entityClass, List<String> searchableColumns) {
        return SearchConfig.<T>builder()
                .entityClass(entityClass)
                .searchableColumns(searchableColumns)
                .build();
    }
}
