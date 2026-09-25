package com.menglang.rumluos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.access.expiration:1200000}") // Default 20 mins
    private long accessExpiration;

    @Value("${jwt.refresh.expiration:604800000}") // Default 7 days
    private long refreshExpiration;

    @Value("${jwt.issuer:rumluos-auth}")
    private String issuer;

    @Value("${jwt.audience:rumluos-api}")
    private String audience;

    @Value("${jwt.keys.private-key:}")
    private String privateKeyStr;

    @Value("${jwt.keys.public-key:}")
    private String publicKeyStr;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    @PostConstruct
    public void init() {
        try {
            if (privateKeyStr == null || privateKeyStr.trim().isEmpty() ||
                publicKeyStr == null || publicKeyStr.trim().isEmpty()) {
                log.warn("JWT RSA keys are not configured in application properties/environment. Generating ephemeral in-memory RSA 2048-bit KeyPair for development.");
                KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
                kpg.initialize(2048);
                KeyPair kp = kpg.generateKeyPair();
                this.privateKey = kp.getPrivate();
                this.publicKey = kp.getPublic();
                return;
            }

            java.security.KeyFactory kf = java.security.KeyFactory.getInstance("RSA");

            // Parse Private Key (PKCS8)
            byte[] privateKeyBytes = decodeKeyBytes(privateKeyStr);
            java.security.spec.PKCS8EncodedKeySpec privateSpec = new java.security.spec.PKCS8EncodedKeySpec(privateKeyBytes);
            this.privateKey = kf.generatePrivate(privateSpec);

            // Parse Public Key (X509)
            byte[] publicKeyBytes = decodeKeyBytes(publicKeyStr);
            java.security.spec.X509EncodedKeySpec publicSpec = new java.security.spec.X509EncodedKeySpec(publicKeyBytes);
            this.publicKey = kf.generatePublic(publicSpec);

            log.info("Successfully loaded RSA KeyPair from configuration for JWT signing");
        } catch (Exception e) {
            log.error("Failed to load RSA keys from configuration", e);
            throw new IllegalStateException("Invalid RSA key configuration for JWT signing: " + e.getMessage(), e);
        }
    }

    private byte[] decodeKeyBytes(String keyStr) {
        String clean = cleanKey(keyStr);
        byte[] decoded = java.util.Base64.getDecoder().decode(clean);
        String asText = new String(decoded, java.nio.charset.StandardCharsets.UTF_8).trim();
        if (asText.contains("-----BEGIN")) {
            clean = cleanKey(asText);
            return java.util.Base64.getDecoder().decode(clean);
        }
        return decoded;
    }

    private String cleanKey(String key) {
        if (key == null) return "";
        return key
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");
    }

    public String generateAccessToken(CustomUserDetails userDetails) {
        return generateToken(userDetails, accessExpiration, true, "access");
    }

    public String generateRefreshToken(CustomUserDetails userDetails) {
        return generateToken(userDetails, refreshExpiration, true, "refresh");
    }

    private String generateToken(CustomUserDetails userDetails, long expiration, boolean includeClaims, String typ) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("typ", typ);
        
        if (includeClaims) {
            claims.put("id", userDetails.getId());
            claims.put("companyId", userDetails.getCompanyId());
            claims.put("isSystemAdmin", userDetails.isSystemAdmin());
            claims.put("tokenVersion", userDetails.getTokenVersion());
            claims.put("username", userDetails.getUsername());
            
            java.util.List<String> grants = userDetails.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .toList();
            claims.put("grants", grants);
        }

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUserKey())
                .issuer(issuer)
                .audience().add(audience).and()
                .id(java.util.UUID.randomUUID().toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token, String expectedType) {
        try {
            Claims claims = extractAllClaims(token);
            if (!expectedType.equals(claims.get("typ", String.class))) {
                log.debug("JWT token type mismatch: expected {}, got {}", expectedType, claims.get("typ", String.class));
                return false;
            }
            return true;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.debug("JWT token is expired: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
}
