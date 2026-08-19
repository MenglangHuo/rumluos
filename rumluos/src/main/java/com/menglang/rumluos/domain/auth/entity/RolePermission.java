package com.menglang.rumluos.domain.auth.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Join table: roles ↔ permissions (many-to-many).
 *
 * <p>R2DBC has no @ManyToMany — this explicit entity replaces it.
 * UNIQUE(role_id, permission_id) enforced at DDL level.
 */
@Table("role_permissions")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class RolePermission extends BaseLongEntity {

    @Column("role_id")
    private Long roleId;

    @Column("permission_id")
    private Long permissionId;
}
