package com.menglang.rumluos.domain.company.dto;

import com.menglang.rumluos.domain.company.entity.Customer;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

import java.util.List;

public class CustomerDto {

    @Data
    @Builder
    public static class CustomerDocumentDto {
        private Long id;
        private String fileKey;
        private String fileName;
        private String docType;
        private Long fileSize;
        private String mimeType;
        private String url;
    }

    @Data
    public static class CustomerRequest {
        private Long branchId;
        private String name;
        private String industry;
        private String customerGroup;
        private String phone;
        private String address;
        private String occupation;
        private String imageUrl;
        private String preferredCurrency;
        private Boolean isActive;
        private String email;
        private LocalDate dateOfBirth;
        private String gender;
        private String nationalId;
        private List<CustomerDocumentDto> documents;
    }

    @Data
    @Builder
    public static class CustomerResponse {
        private Long id;
        private Long companyId;
        private Long branchId;
        private String name;
        private String industry;
        private String customerGroup;
        private String phone;
        private String address;
        private String occupation;
        private String imageUrl;
        private String preferredCurrency;
        private boolean isActive;
        private String email;
        private LocalDate dateOfBirth;
        private String gender;
        private String nationalId;
        private List<CustomerDocumentDto> documents;
    }

    public static CustomerResponse toResponse(Customer customer) {
        if (customer == null) return null;
        return CustomerResponse.builder()
                .id(customer.getId())
                .companyId(customer.getCompanyId())
                .branchId(customer.getBranchId())
                .name(customer.getName())
                .industry(customer.getIndustry())
                .customerGroup(customer.getCustomerGroup())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .occupation(customer.getOccupation())
                .imageUrl(customer.getImageUrl())
                .preferredCurrency(customer.getPreferredCurrency())
                .isActive(customer.isActive())
                .email(customer.getEmail())
                .dateOfBirth(customer.getDateOfBirth())
                .gender(customer.getGender())
                .nationalId(customer.getNationalId())
                .build();
    }

    public static Customer toEntity(CustomerRequest request) {
        if (request == null) return null;
        Customer customer = new Customer();
        customer.setBranchId(request.getBranchId());
        customer.setName(request.getName());
        customer.setIndustry(request.getIndustry());
        customer.setCustomerGroup(request.getCustomerGroup());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setOccupation(request.getOccupation());
        customer.setImageUrl(request.getImageUrl());
        if (request.getPreferredCurrency() != null) {
            customer.setPreferredCurrency(request.getPreferredCurrency());
        }
        if (request.getIsActive() != null) {
            customer.setActive(request.getIsActive());
        }
        customer.setEmail(request.getEmail());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setGender(request.getGender());
        customer.setNationalId(request.getNationalId());
        return customer;
    }
}
