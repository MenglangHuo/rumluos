package com.menglang.rumluos.domain.company.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

public class StaffDto {

    @Data
    public static class StaffDocumentDto {
        private String docType;
        private String url;
        private String fileName;
        private String mimeType;
        private Long fileSize;
    }

    @Data
    public static class StaffRequest {
        private Long userId; // The user this staff profile belongs to
        private Long branchId;
        private String name;
        private String phone;
        private String email;
        private String description;
        private String position;
        private BigDecimal salary;
        private String urgentContactName;
        private String urgentContactPhone;
        private List<StaffDocumentDto> documents;
    }

    @Data
    public static class StaffResponse {
        private Long id;
        private Long userId;
        private Long branchId;
        private String name;
        private String phone;
        private String email;
        private String description;
        private String position;
        private BigDecimal salary;
        private String urgentContactName;
        private String urgentContactPhone;
        private boolean isActive;
        private List<StaffDocumentDto> documents;
    }
}
