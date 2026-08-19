package com.menglang.rumluos.common.model;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;

/**
 * Abstract base class for all domain entities that are scoped to a specific SaaS tenant.
 *
 * <p>Inherits primary key (Long), audit fields, and soft-delete capabilities,
 * and adds the mandatory `companyId` field for data isolation.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseTenantEntity extends BaseLongEntity {

    @Column("company_id")
    private Long companyId;
}
