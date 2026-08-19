package com.menglang.rumluos.domain.product.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.JsonNodeDeserializer;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class ProductDto {

    @Data
    public static class ProductRequest {
        private Long brandId;
        private Long categoryId;
        private String name;
        private String model;
        private String serialNumber;
        private Short year;
        private String condition;
        private BigDecimal basePrice;
        private BigDecimal sellPrice;
        private String currency;
        private String description;
        private String imageUrl;
        @JsonDeserialize(using = JsonNodeDeserializer.class)
        private JsonNode attributes;
        private String status;
        private Boolean isActive;
        private String notes;
    }

    @Data
    @Builder
    public static class ProductResponse {
        private Long id;
        private Long companyId;
        private Long brandId;
        private Long categoryId;
        private String name;
        private String model;
        private String serialNumber;
        private Short year;
        private String condition;
        private BigDecimal basePrice;
        private BigDecimal sellPrice;
        private String currency;
        private String description;
        private String imageUrl;
        private JsonNode attributes;
        private String status;
        private boolean isActive;
        private String notes;
        private Instant createdAt;
        private Instant updatedAt;
    }

    /**
     * Request DTO for bulk importing products (phones, motos, cars).
     * Each item in the batch represents one physical unit with a unique serial number.
     */
    @Data
    public static class BatchImportRequest {
        private List<ProductRequest> products;
    }

    /**
     * Summary of a batch import operation.
     */
    @Data
    @Builder
    public static class BatchImportResponse {
        private int totalRequested;
        private int successCount;
        private int failedCount;
        private List<ProductResponse> imported;
        private List<BatchImportError> errors;
    }

    @Data
    @Builder
    public static class BatchImportError {
        private int index;
        private String serialNumber;
        private String reason;
    }
}
