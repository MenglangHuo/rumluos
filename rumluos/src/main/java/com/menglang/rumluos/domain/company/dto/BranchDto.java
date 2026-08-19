package com.menglang.rumluos.domain.company.dto;

import lombok.Builder;
import lombok.Data;

public class BranchDto {

    @Data
    public static class BranchRequest {
        private String name;
        private String phone;
        private String address;
        private Boolean isActive;
    }

    @Data
    @Builder
    public static class BranchResponse {
        private Long id;
        private Long companyId;
        private String name;
        private String phone;
        private String address;
        private boolean isActive;
    }
}
