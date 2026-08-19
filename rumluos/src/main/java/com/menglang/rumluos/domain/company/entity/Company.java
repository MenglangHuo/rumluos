package com.menglang.rumluos.domain.company.entity;

import com.fasterxml.jackson.databind.JsonNode;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Company entity for scale system database partitioning / multitenancy.
 */
@Table("companies")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class Company extends BaseLongEntity {

    @Column("name")
    private String name;

    @Column("email")
    private String email;

    @Column("phone")
    private String phone;

    @Column("address")
    private String address;

    @Column("is_active")
    @Builder.Default
    private boolean isActive = true;

    @Column("description")
    private String description;

    @Column("enable_branch")
    @Builder.Default
    private boolean enableBranch = false;

    @Column("meta_data")
    private JsonNode metaData;
}
