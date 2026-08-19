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
@Table("otps")
public class Otp extends BaseLongEntity {

    @Column("email")
    private String email;

    @Column("otp_code")
    private String otpCode;

    @Column("purpose")
    private String purpose; // e.g., "FORGET_PASSWORD", "LOGIN"

    @Column("expires_at")
    private Instant expiresAt;

    @Column("is_used")
    @Builder.Default
    private boolean isUsed = false;
}
