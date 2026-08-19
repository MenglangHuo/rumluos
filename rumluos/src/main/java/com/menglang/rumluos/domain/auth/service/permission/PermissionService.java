package com.menglang.rumluos.domain.auth.service.permission;

import com.menglang.rumluos.domain.auth.dto.PermissionDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Permission operations are intentionally read-only from the API perspective.
 * Permissions are seeded at company-creation time and updated via the seed/reseed
 * mechanism — never through ad-hoc CRUD.
 */
public interface PermissionService {

    /**
     * Seed all domain permissions + their actions for a newly created company.
     * Idempotent: skips any permission/grant that already exists.
     *
     * @param companyId target tenant
     * @return count of permissions created
     */
    Mono<Integer> seedPermissionsForCompany(Long companyId);

    /**
     * Re-seed: adds any permissions/grants that are missing (e.g. after a new domain
     * is added to {@link PermissionSeedDefinition}).  Does NOT remove anything.
     *
     * @param companyId target tenant
     * @return count of NEW permissions/grants created
     */
    Mono<Integer> reseedMissingPermissions(Long companyId);

    /**
     * Return all permissions for a company, each decorated with its granted actions.
     */
    Flux<PermissionDto.PermissionWithGrantsResponse> getAllPermissions(Long companyId);

    /**
     * Return every canonical action in the system (global, not tenant-scoped).
     */
    Flux<PermissionDto.ActionResponse> getAllActions();
}
