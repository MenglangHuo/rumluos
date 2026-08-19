package com.menglang.rumluos.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationManager implements ReactiveAuthenticationManager {

    private final JwtTokenProvider tokenProvider;

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        String token = authentication.getCredentials().toString();
        
        if (tokenProvider.validateToken(token, "access")) {
            Claims claims = tokenProvider.extractAllClaims(token);
            String userKey = claims.getSubject();
            
            Long id = claims.get("id", Long.class);
            Long companyId = claims.get("companyId", Long.class);
            Boolean isSystemAdmin = claims.get("isSystemAdmin", Boolean.class);
            Integer tokenVersion = claims.get("tokenVersion", Integer.class);
            String username = claims.get("username", String.class);

            List<String> grants = claims.get("grants", List.class);
            List<SimpleGrantedAuthority> authorities = grants != null ? 
                grants.stream().map(SimpleGrantedAuthority::new).toList() : 
                List.of(new SimpleGrantedAuthority(Boolean.TRUE.equals(isSystemAdmin) ? "ROLE_SYSTEM_ADMIN" : "ROLE_USER"));

            CustomUserDetails userDetails;
            if (Boolean.TRUE.equals(isSystemAdmin)) {
                userDetails = new SystemAdminDetails(id, username, authorities, tokenVersion, userKey);
            } else {
                userDetails = new AppUserDetails(id, username, companyId, authorities, tokenVersion, userKey);
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userDetails, token, userDetails.getAuthorities());
            
            return Mono.just(auth);
        }
        
        return Mono.empty();
    }
}
