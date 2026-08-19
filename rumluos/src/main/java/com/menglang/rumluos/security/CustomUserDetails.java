package com.menglang.rumluos.security;

import org.springframework.security.core.userdetails.UserDetails;

public interface CustomUserDetails extends UserDetails {
    Long getId();
    Long getCompanyId();
    String getEmail();
    boolean isSystemAdmin();
    String getUserType();
    Integer getTokenVersion();
    String getUserKey();
}
