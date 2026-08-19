package com.menglang.rumluos.domain.auth.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
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
@Table("role_permission_grants")
public class RolePermissionGrant extends BaseLongEntity {

    @Column("role_id")
    private Long roleId;

    @Column("permission_grant_id")
    private Long permissionGrantId;
}
