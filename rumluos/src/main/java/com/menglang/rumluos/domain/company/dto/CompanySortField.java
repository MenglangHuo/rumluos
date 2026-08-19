package com.menglang.rumluos.domain.company.dto;

import com.menglang.rumluos.common.page.SortableField;

/**
 * Whitelist of column names that callers may use in the {@code sort} query-param
 * when listing companies.  Passed to {@link com.menglang.rumluos.common.page.RequestPage#toPageable(Class)}
 * so unknown field names are rejected with a 400 rather than leaking the schema.
 */
public enum CompanySortField implements SortableField {
    id,
    name,
    email,
    createdAt,
    updatedAt
}
