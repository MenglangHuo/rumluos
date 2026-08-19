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
@Table("roles")
public class Role extends BaseTenantEntity {

    @Column("name")
    private String name;

    @Column("display_name")
    private String displayName;

    @Column("description")
    private String description;

    @Column("priority")
    private Integer priority = 0;
}
