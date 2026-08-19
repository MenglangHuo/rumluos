package com.menglang.rumluos.domain.storage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

public class AttachmentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAttachmentRequest {
        @NotBlank(message = "File name cannot be blank")
        private String fileName;

        @NotBlank(message = "File key cannot be blank")
        private String fileKey;

        private String fileUrl;
        private String mimeType;

        @NotNull(message = "File size cannot be null")
        private Long fileSize;

        private String category;
        private String description;
        private Long branchId;
        private Boolean isPublic;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateAttachmentRequest {
        private String fileName;
        private String category;
        private String description;
        private Long branchId;
        private Boolean isPublic;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentResponse {
        private Long id;
        private Long companyId;
        private Long branchId;
        private String fileName;
        private String fileKey;
        private String fileUrl;
        private String mimeType;
        private Long fileSize;
        private String category;
        private String description;
        private Long uploadedByUserId;
        private Boolean isPublic;
        private Boolean isActive;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentDownloadResponse {
        private Long attachmentId;
        private String fileName;
        private String downloadUrl;
        private long expirationTimeMillis;
    }
}
