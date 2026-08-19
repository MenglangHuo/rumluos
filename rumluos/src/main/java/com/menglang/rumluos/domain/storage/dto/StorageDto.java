package com.menglang.rumluos.domain.storage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class StorageDto {

    @Data
    public static class GenerateUploadUrlRequest {
        @NotBlank(message = "File name cannot be blank")
        private String fileName;

        @NotBlank(message = "Content type cannot be blank")
        private String contentType;

        private Boolean isPublic;

        private String folder;
    }

    @Data
    public static class PresignedUrlResponse {
        private String uploadUrl;
        private String fileKey;
        private boolean isPublic;
        private long expirationTimeMillis;
    }

    @Data
    public static class DownloadUrlResponse {
        private String downloadUrl;
        private boolean isPublic;
        private long expirationTimeMillis;
    }
}
