package com.menglang.rumluos.domain.product.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

public class BrandDto {

    @Data
    public static class BrandRequest {
        private String name;
        private String description;
        private String logoUrl;
        private Boolean isActive;
    }

    @Data
    @Builder
    public static class BrandResponse {
        private Long id;
        private Long companyId;
        private String name;
        private String description;
        private String logoUrl;
        private boolean isActive;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
