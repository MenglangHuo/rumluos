package com.menglang.rumluos.domain.company.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.*;

import java.time.Instant;

public sealed interface CompanyDto permits
        CompanyDto.CreateCompanyRequest,
        CompanyDto.UpdateCompanyRequest,
        CompanyDto.CompanyResponse,
        CompanyDto.CompanySummaryResponse {

    // ── Requests ─────────────────────────────────────────────────────────────

    record CreateCompanyRequest(
            @NotBlank(message = "Company name is required")
            @Size(min = 2, max = 100, message = "Name must be 2–100 characters")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 150)
            String email,

            @Size(max = 20, message = "Phone cannot exceed 20 characters")
            @Pattern(regexp = "^[+]?[0-9\\s\\-().]{7,20}$", message = "Phone format is invalid")
            String phone,

            @Size(max = 255, message = "Address cannot exceed 255 characters")
            String address,

            @Size(max = 500, message = "Description cannot exceed 500 characters")
            String description,

            @NotBlank(message = "Owner username is required")
            String ownerUsername,

            @NotBlank(message = "Owner password is required")
            String ownerPassword,

            Boolean enableBranch
    ) implements CompanyDto {}

    record UpdateCompanyRequest(
            @Size(min = 2, max = 100, message = "Name must be 2–100 characters")
            String name,

            @Email(message = "Email must be valid")
            @Size(max = 150)
            String email,

            @Size(max = 20)
            @Pattern(regexp = "^[+]?[0-9\\s\\-().]{7,20}$", message = "Phone format is invalid")
            String phone,

            @Size(max = 255)
            String address,

            @Size(max = 500)
            String description,

            Boolean isActive,
            
            Boolean enableBranch
    ) implements CompanyDto {}

    // ── Responses ─────────────────────────────────────────────────────────────

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record CompanyResponse(
            Long id,
            String name,
            String email,
            String phone,
            String address,
            String description,
            boolean isActive,
            boolean enableBranch,
            Instant createdAt,
            Instant updatedAt
    ) implements CompanyDto {}

    /** Lightweight version used in nested responses (e.g. inside a UserResponse). */
    record CompanySummaryResponse(
            Long id,
            String name,
            boolean isActive
    ) implements CompanyDto {}
}