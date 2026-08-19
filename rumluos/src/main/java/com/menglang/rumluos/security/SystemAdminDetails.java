package com.menglang.rumluos.security;

import com.menglang.rumluos.domain.auth.entity.SystemAdmin;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

@Getter
public class SystemAdminDetails implements CustomUserDetails {
    
    public static final String USER_TYPE_SYSTEM_ADMIN = "SYSTEM_ADMIN";

    private final Long id;
    private final String username;
    private final String password;
    private final String email;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final boolean accountNonExpired;
    private final boolean credentialsNonExpired;
    private final Integer tokenVersion;
    private final String userKey;
    private final Collection<? extends GrantedAuthority> authorities;

    public SystemAdminDetails(SystemAdmin admin, Collection<? extends GrantedAuthority> authorities) {
        this.id = admin.getId();
        this.username = admin.getUsername();
        this.password = admin.getPasswordHash();
        this.email = admin.getEmail();
        this.enabled = admin.isActive();
        this.tokenVersion = admin.getTokenVersion();
        this.userKey = admin.getAdminKey() != null ? admin.getAdminKey().toString() : java.util.UUID.randomUUID().toString();
        this.accountNonLocked = true;
        this.accountNonExpired = true;
        this.credentialsNonExpired = true;
        this.authorities = authorities;
    }

    public SystemAdminDetails(Long id, String username, Collection<? extends GrantedAuthority> authorities, Integer tokenVersion, String userKey) {
        this.id = id;
        this.username = username != null ? username : String.valueOf(id);
        this.password = "";
        this.email = null;
        this.enabled = true;
        this.accountNonLocked = true;
        this.accountNonExpired = true;
        this.credentialsNonExpired = true;
        this.authorities = authorities;
        this.tokenVersion = tokenVersion;
        this.userKey = userKey;
    }

    @Override
    public String getUserKey() {
        return this.userKey;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return this.accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return this.accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return this.credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return this.enabled;
    }

    @Override
    public Long getCompanyId() {
        return null;
    }

    @Override
    public String getUserType() {
        return USER_TYPE_SYSTEM_ADMIN;
    }

    @Override
    public boolean isSystemAdmin() {
        return true;
    }
}
