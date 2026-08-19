package com.menglang.rumluos.domain.auth.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Setter
@Getter
@Table("permission_grants")
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionGrant extends BaseTenantEntity {

    @Column("permission_id")
    private Long permissionId;

    @Column("action_id")
    private Long actionId;

    @Column("disabled")
    @Builder.Default
    private Boolean disabled = false;
}
