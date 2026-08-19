package com.menglang.rumluos.domain.company.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("branches")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class Branch extends BaseTenantEntity {

    @Column("name")
    private String name;

    @Column("phone")
    private String phone;

    @Column("address")
    private String address;

    @Column("is_active")
    @Builder.Default
    private boolean isActive = true;
}
