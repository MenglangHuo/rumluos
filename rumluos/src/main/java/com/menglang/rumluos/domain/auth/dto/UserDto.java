package com.menglang.rumluos.domain.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class UserDto {

    @Data
    public static class StaffSummaryDto {
        private Long id;
        private String name;
        private String position;
        private String phone;
        private String email;
        private Long branchId;
        private String branchName;
        private String urgentContactName;
        private String urgentContactPhone;
        private java.math.BigDecimal salary;
        private boolean isActive;
    }

    @Data
    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private String firstName;
        private String lastName;
        private String contact;
        private String avatarUrl;
        private boolean isActive;
        private boolean isSystemAdmin;
        private Long companyId;
        private String companyName;
        private Long branchId;
        private String branchName;
        private Instant lastLoginAt;
        private Instant createdAt;
        private StaffSummaryDto staffInfo;
        private Map<String, List<RoleDto.ActionPermissionRequest>> permissions;
        private List<Long> roleIds;
        private List<String> grants;
    }

    @Data
    public static class UpdateUserRequest {
        private String email;
        private String firstName;
        private String lastName;
        private String contact;
        private String avatarUrl;
        private String avatarKey;
        private Boolean isActive;
        private List<Long> roleIds;
    }

    @Data
    public static class UpdateMeProfileRequest {
        private String firstName;
        private String lastName;
        private String contact;
        private String avatarUrl;
        private String avatarKey;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        private String newPassword;

        @NotBlank(message = "Confirm password is required")
        private String confirmPassword;
    }

    @Data
    public static class AddPermissionsRequest {
        private Map<String, List<RoleDto.ActionPermissionRequest>> permissions;
    }

    @Data
    public static class ExcludePermissionsRequest {
        private Map<String, List<String>> exclusions;
    }
}
