package com.menglang.rumluos.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.util.List;

public class AuthDto {

    @Data
    public static class LoginRequest {
        @NotBlank
        private String username;
        @NotBlank
        private String password;
    }

    @Data
    @Builder
    public static class LoginResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private Long expiresIn;
    }

    @Data
    public static class RefreshTokenRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    public static class ForgetPasswordRequest {
        @NotBlank
        @Email
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String otpCode;
        @NotBlank
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=_!])(?=\\S+$).{8,64}$", 
                 message = "Password must be 8-64 characters, with at least one uppercase, one lowercase, one number, and one special character")
        private String newPassword;
    }

    @Data
    public static class RegisterByAdminRequest {
        @NotBlank
        private String username;
        @NotBlank
        @Email
        private String email;
        @NotBlank
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=_!])(?=\\S+$).{8,64}$", 
                 message = "Password must be 8-64 characters, with at least one uppercase, one lowercase, one number, and one special character")
        private String password;
        private String firstName;
        private String lastName;
        
        @Size(max = 20)
        private String contact;
        
        private Long companyId;
        
        private List<Long> roleIds;
    }
}
