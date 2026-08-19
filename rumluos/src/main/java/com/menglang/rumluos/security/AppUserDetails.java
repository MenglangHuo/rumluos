package com.menglang.rumluos.security;

import com.menglang.rumluos.domain.auth.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;

import java.time.Instant;
import java.util.Collection;

@Getter
public class AppUserDetails implements CustomUserDetails {
    
    public static final String USER_TYPE_USER = "USER";

    private final Long id;
    private final String username;
    private final String password;
    private final String email;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final boolean accountNonExpired;
    private final boolean credentialsNonExpired;
    private final Integer tokenVersion;
    private final Long companyId;
    private final String userKey;
    private final Collection<? extends GrantedAuthority> authorities;

    public AppUserDetails(User user, Collection<? extends GrantedAuthority> authorities) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.password = user.getPasswordHash();
        this.email = user.getEmail();
        this.enabled = user.getStatus() == User.Status.ACTIVE;
        this.tokenVersion = user.getTokenVersion();
        this.userKey = user.getUserKey() != null ? user.getUserKey().toString() : java.util.UUID.randomUUID().toString();
        
        boolean isLocked = user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(Instant.now());
        this.accountNonLocked = !isLocked;
        this.accountNonExpired = true;
        this.credentialsNonExpired = true;
        this.companyId = user.getCompanyId();
        this.authorities = authorities;
    }

    public AppUserDetails(Long id, String username, Long companyId, Collection<? extends GrantedAuthority> authorities, Integer tokenVersion, String userKey) {
        this.id = id;
        this.username = username != null ? username : String.valueOf(id);
        this.password = "";
        this.email = null;
        this.enabled = true;
        this.accountNonLocked = true;
        this.accountNonExpired = true;
        this.credentialsNonExpired = true;
        this.companyId = companyId;
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
    public String getUserType() {
        return USER_TYPE_USER;
    }

    @Override
    public boolean isSystemAdmin() {
        return false;
    }
}
