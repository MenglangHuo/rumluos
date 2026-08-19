package com.menglang.rumluos.domain.product.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Product category with optional parent for hierarchy.
 */
@Table("categories")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Category extends BaseTenantEntity {

    @Column("name")
    private String name;

    @Column("description")
    private String description;

    @Column("color")
    private String color;

    /** Nullable FK to categories.id. NULL = root. */
    @Column("parent_id")
    private Long parentId;

    // ── Reserved fields ─────────────────────────────────────────

    /** URL to category icon/image. */
    @Column("image_url")
    private String imageUrl;

    /** Display ordering. Lower = shown first. */
    @Column("sort_order")
    private Integer sortOrder;
}