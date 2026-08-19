package com.menglang.rumluos.domain.auth.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

/**
 * Application user account.
 *
 * <p>R2DBC does NOT support @ManyToMany. User-role links live in the
 * user_roles join table, loaded via UserRoleRepository.
 */
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Table("users")
public class User extends BaseTenantEntity {


    @Column("user_key")
    private java.util.UUID userKey;

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

    @Column("contact")
    private String contact;

    @Column("is_active")
    private boolean isActive = true;

    // ── Reserved fields ─────────────────────────────────────────

    /** Timestamp of the user's last successful login. */
    @Column("last_login_at")
    private Instant lastLoginAt;

    @Column("last_logout_at")
    private Instant lastLogOutAt;

    @Column("token_version")
    private Integer tokenVersion;

    @Column("login_attempt")
    private Short loginAttempt;

    @Column("account_locked_until")
    private Instant accountLockedUntil;

    private Status status;

    /** URL to the user's avatar image. */
    @Column("avatar_url")
    private String avatarUrl;

    public enum Status {
        PENDING_VERIFICATION,
        ACTIVE,
        INACTIVE,
        LOCKED,
        SUSPENDED
    }
}