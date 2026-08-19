package com.menglang.rumluos.domain.auth.service;

import com.menglang.rumluos.common.exception.BadRequestException;
import com.menglang.rumluos.common.exception.UnauthorizedException;
import com.menglang.rumluos.domain.auth.dto.AuthDto;
import com.menglang.rumluos.domain.auth.entity.Otp;
import com.menglang.rumluos.domain.auth.entity.RefreshToken;
import com.menglang.rumluos.domain.auth.entity.User;
import com.menglang.rumluos.domain.auth.entity.UserRole;
import com.menglang.rumluos.domain.auth.repository.OtpRepository;
import com.menglang.rumluos.domain.auth.repository.RefreshTokenRepository;
import com.menglang.rumluos.domain.auth.repository.SystemAdminRepository;
import com.menglang.rumluos.domain.auth.repository.UserRepository;
import com.menglang.rumluos.domain.auth.repository.RoleRepository;
import com.menglang.rumluos.domain.auth.repository.UserRoleRepository;
import com.menglang.rumluos.security.AppUserDetails;
import com.menglang.rumluos.security.CustomUserDetails;
import com.menglang.rumluos.security.JwtTokenProvider;
import com.menglang.rumluos.security.SystemAdminDetails;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SystemAdminRepository systemAdminRepository;
    private final OtpRepository otpRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    @Value("${jwt.access.expiration:1200000}") // Default 20 mins
    private long accessExpiration;
    @Value("${jwt.refresh.expiration:604800000}") // Default 7 days
    private long refreshExpiration;

    @Transactional
    public Mono<AuthDto.LoginResponse> login(AuthDto.LoginRequest request) {
        return systemAdminRepository.findByUsername(request.getUsername())
                .flatMap(admin -> {
                    if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
                        return Mono.error(new UnauthorizedException("Invalid credentials"));
                    }
                    return Mono.just((CustomUserDetails) new SystemAdminDetails(admin, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));
                })
                .switchIfEmpty(Mono.defer(() -> userRepository.findByUsername(request.getUsername())
                        .flatMap(user -> {
                            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                                return Mono.error(new UnauthorizedException("Invalid credentials"));
                            }
                            return userRoleRepository.findByUserId(user.getId())
                                    .map(UserRole::getRoleId)
                                    .collectList()
                                    .flatMap(roleIds -> {
                                        if (roleIds.isEmpty()) {
                                            return Mono.just((CustomUserDetails) new AppUserDetails(user, List.of()));
                                        }
                                        return roleRepository.findAllById(roleIds)
                                                .map(role -> new SimpleGrantedAuthority(role.getName().toUpperCase()))
                                                .collectList()
                                                .map(authorities -> (CustomUserDetails) new AppUserDetails(user, authorities));
                                    });
                        })))
                .switchIfEmpty(Mono.error(new UnauthorizedException("Invalid credentials")))
                .flatMap(userDetails -> {
                    String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
                    String refreshTokenStr = jwtTokenProvider.generateRefreshToken(userDetails);

                    RefreshToken rt = new RefreshToken();
                    rt.setUserId(userDetails.getId());
                    rt.setUserType(userDetails instanceof SystemAdminDetails ? "SYSTEM_ADMIN" : "USER");
                    rt.setTokenSignature(refreshTokenStr); // Using token string directly for simplicity
                    rt.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
                    rt.setRevoked(false);


                    return refreshTokenRepository.save(rt).map(savedRt -> AuthDto.LoginResponse.builder()
                            .accessToken(accessToken)
                            .refreshToken(refreshTokenStr)
                            .tokenType("Bearer")
                            .expiresIn(accessExpiration)
                            .build());
                });
    }

    @Transactional
    public Mono<AuthDto.LoginResponse> refreshToken(AuthDto.RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!jwtTokenProvider.validateToken(token, "refresh")) {
            return Mono.error(new UnauthorizedException("Invalid or expired refresh token"));
        }

        Claims claims = jwtTokenProvider.extractAllClaims(token);
        Long userId = claims.get("id", Long.class);
        String userKey = claims.getSubject();
        String username = claims.get("username", String.class);
        Long companyId = claims.get("companyId", Long.class);
        Boolean isSystemAdmin = claims.get("isSystemAdmin", Boolean.class);
        Integer tokenVersion = claims.get("tokenVersion", Integer.class);

        return refreshTokenRepository.findByTokenSignatureAndIsRevokedFalseAndExpiresAtAfter(token, Instant.now())
                .switchIfEmpty(Mono.error(new UnauthorizedException("Refresh token is revoked or missing")))
                .flatMap(rt -> {
                    // Revoke old token
                    rt.setRevoked(true);
                    return refreshTokenRepository.save(rt);
                })
                .flatMap(revokedRt -> {
                    if (Boolean.TRUE.equals(isSystemAdmin)) {
                        CustomUserDetails userDetails = new SystemAdminDetails(userId, username, List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")), tokenVersion, userKey);
                        return Mono.just(userDetails);
                    } else {
                        return userRoleRepository.findByUserId(userId)
                                .map(UserRole::getRoleId)
                                .collectList()
                                .flatMap(roleIds -> {
                                    if (roleIds.isEmpty()) {
                                        return Mono.just((CustomUserDetails) new AppUserDetails(userId, username, companyId, List.of(), tokenVersion, userKey));
                                    }
                                    return roleRepository.findAllById(roleIds)
                                            .map(role -> new SimpleGrantedAuthority(role.getName().toUpperCase()))
                                            .collectList()
                                            .map(authorities -> (CustomUserDetails) new AppUserDetails(userId, username, companyId, authorities, tokenVersion, userKey));
                                });
                    }
                })
                .flatMap(userDetails -> {
                    String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);
                    String newRefreshTokenStr = jwtTokenProvider.generateRefreshToken(userDetails);

                    RefreshToken newRt = new RefreshToken();
                    newRt.setUserId(userId);
                    newRt.setUserType(Boolean.TRUE.equals(isSystemAdmin) ? "SYSTEM_ADMIN" : "USER");
                    newRt.setTokenSignature(newRefreshTokenStr);
                    newRt.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
                    newRt.setRevoked(false);

                    return refreshTokenRepository.save(newRt).map(savedRt -> AuthDto.LoginResponse.builder()
                            .accessToken(newAccessToken)
                            .refreshToken(newRefreshTokenStr)
                            .tokenType("Bearer")
                            .expiresIn(accessExpiration)
                            .build());
                });
    }

    public Mono<Void> forgetPassword(AuthDto.ForgetPasswordRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .flatMap(user -> {
                    Otp otp = Otp.builder()
                            .email(user.getEmail())
                            .otpCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                            .purpose("FORGET_PASSWORD")
                            .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                            .build();
                    return otpRepository.save(otp);
                })
                .then();
    }

    @Transactional
    public Mono<Void> resetPassword(AuthDto.ResetPasswordRequest request) {
        return otpRepository.findByEmailAndOtpCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
                        request.getEmail(), request.getOtpCode(), "FORGET_PASSWORD", Instant.now())
                .switchIfEmpty(Mono.error(new BadRequestException("Invalid or expired OTP")))
                .flatMap(otp -> {
                    otp.setUsed(true);
                    return otpRepository.save(otp);
                })
                .then(userRepository.findByEmail(request.getEmail()))
                .flatMap(user -> {
                    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                    user.setTokenVersion(user.getTokenVersion() + 1);
                    return userRepository.save(user);
                })
                // Revoke all refresh tokens for user
                .flatMap(user -> refreshTokenRepository.deleteByUserIdAndUserType(user.getId(), "USER"))
                .then();
    }

    public Mono<Void> registerByAdmin(AuthDto.RegisterByAdminRequest request) {
        return userRepository.existsByUsernameOrEmail(request.getUsername(), request.getEmail())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new BadRequestException("Username or email already exists"));
                    }
                    User user = new User();
                    user.setUsername(request.getUsername());
                    user.setEmail(request.getEmail());
                    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                    user.setFirstName(request.getFirstName());
                    user.setLastName(request.getLastName());
                    user.setContact(request.getContact());
                    user.setCompanyId(request.getCompanyId());
                    user.setTokenVersion(0);
                    user.setLoginAttempt((short) 0);
                    user.setStatus(User.Status.ACTIVE);
                    return userRepository.save(user);
                })
                .then();
    }

    public Mono<Void> logout(AuthDto.RefreshTokenRequest request) {
        if (request != null && request.getRefreshToken() != null) {
            return refreshTokenRepository.findByTokenSignatureAndIsRevokedFalseAndExpiresAtAfter(
                            request.getRefreshToken(), Instant.now())
                    .flatMap(rt -> {
                        rt.setRevoked(true);
                        return refreshTokenRepository.save(rt);
                    })
                    .then();
        }
        return Mono.empty();
    }
}
