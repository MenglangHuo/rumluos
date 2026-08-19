package com.menglang.rumluos.domain.product.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Brand entity.
 */
@Table("brands")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class Brand extends BaseTenantEntity {

    @Column("name")
    private String name;

    @Column("description")
    private String description;

    @Column("logo_url")
    private String logoUrl;

    @Column("is_active")
    @Builder.Default
    private boolean isActive = true;
}
