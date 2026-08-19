package com.menglang.rumluos.common.page;


/**
 * Marker interface — implement on an enum to define a whitelist
 * of sortable fields for a specific endpoint.
 *
 * Example:
 * public enum UserSortField implements SortableField {
 *     id, name, email, createdAt
 * }
 */
public interface SortableField {
}
