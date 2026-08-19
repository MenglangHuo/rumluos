package com.menglang.rumluos.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

public class SystemAdminDto {

    @Data
    public static class CreateRequest {
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
    }

    @Data
    public static class Response {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private boolean isActive;
    }
}
