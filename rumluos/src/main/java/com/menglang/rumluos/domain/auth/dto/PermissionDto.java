package com.menglang.rumluos.domain.auth.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.List;

public sealed interface PermissionDto permits
        PermissionDto.PermissionResponse,
        PermissionDto.PermissionWithGrantsResponse,
        PermissionDto.ActionResponse,
        PermissionDto.PermissionGrantResponse,
        PermissionDto.SeedRequest {

    // ── Responses ────────────────────────────────────────────────────────────

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record PermissionResponse(
            Long id,
            String name,
            String description,
            Long companyId,
            Instant createdAt
    ) implements PermissionDto {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record PermissionWithGrantsResponse(
            Long id,
            String name,
            String description,
            Long companyId,
            List<GrantedActionResponse> grants
    ) implements PermissionDto {}

    record GrantedActionResponse(
            Long grantId,
            Long actionId,
            String actionName,
            boolean disabled
    ) {}

    record ActionResponse(
            Long id,
            String name,
            String description
    ) implements PermissionDto {}

    record PermissionGrantResponse(
            Long id,
            Long permissionId,
            Long actionId,
            String actionName,
            boolean disabled
    ) implements PermissionDto {}

    // ── Requests ─────────────────────────────────────────────────────────────

    record SeedRequest(
            @NotBlank(message = "Company ID is required")
            Long companyId
    ) implements PermissionDto {}
}
