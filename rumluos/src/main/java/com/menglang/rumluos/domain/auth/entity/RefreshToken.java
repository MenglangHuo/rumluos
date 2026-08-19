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
@Table("refresh_tokens")
public class RefreshToken extends BaseLongEntity {

    @Column("user_id")
    private Long userId;

    @Column("token_signature")
    private String tokenSignature;

    @Column("expires_at")
    private Instant expiresAt;

    @Column("user_type")
    @Builder.Default
    private String userType = "USER";

    @Column("is_revoked")
    @Builder.Default
    private boolean isRevoked = false;
}
