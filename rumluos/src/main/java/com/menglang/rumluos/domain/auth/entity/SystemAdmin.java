package com.menglang.rumluos.domain.auth.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Table("system_admins")
public class SystemAdmin extends BaseLongEntity {

    @Column("admin_key")
    private java.util.UUID adminKey;

    @Column("username")
    private String username;

    @Column("email")
    private String email;

    @Column("password_hash")
    private String passwordHash;

    @Column("first_name")
    private String firstName;

    @Column("last_name")
    private String lastName;

    @Column("is_active")
    @Builder.Default
    private boolean isActive = true;

    @Column("last_login_at")
    private Instant lastLoginAt;

    @Column("last_logout_at")
    private Instant lastLogOutAt;

    @Column("token_version")
    private Integer tokenVersion;
}
