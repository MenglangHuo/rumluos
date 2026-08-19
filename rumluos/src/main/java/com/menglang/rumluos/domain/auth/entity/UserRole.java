package com.menglang.rumluos.domain.auth.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Join table: users ↔ roles (many-to-many).
 *
 * <p>R2DBC has no @ManyToMany — this explicit entity replaces it.
 * UNIQUE(user_id, role_id) enforced at DDL level.
 */
@Table("user_roles")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class UserRole extends BaseLongEntity {

    @Column("user_id")
    private Long userId;

    @Column("role_id")
    private Long roleId;
}
