package com.menglang.rumluos.domain.auth.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table("actions")
public class Action extends BaseTenantEntity {


    @Column("name")
    private String name;

    @Column("description")
    private String description;
}
