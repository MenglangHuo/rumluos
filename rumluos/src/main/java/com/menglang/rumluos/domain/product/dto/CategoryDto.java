package com.menglang.rumluos.domain.product.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

public class CategoryDto {

    @Data
    public static class CategoryRequest {
        private String name;
        private String description;
        private String color;
        private Long parentId;
        private String imageUrl;
        private Integer sortOrder;
    }

    @Data
    @Builder
    public static class CategoryResponse {
        private Long id;
        private Long companyId;
        private String name;
        private String description;
        private String color;
        private Long parentId;
        private String imageUrl;
        private Integer sortOrder;
        private Instant createdAt;
        private Instant updatedAt;
    }
}
