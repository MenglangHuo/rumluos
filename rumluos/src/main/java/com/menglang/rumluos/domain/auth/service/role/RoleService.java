package com.menglang.rumluos.domain.auth.service.role;

import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.domain.auth.dto.RoleDto;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface RoleService {
    Mono<RoleDto.RoleResponse> create(RoleDto.CreateRoleRequest request);
    Mono<RoleDto.RoleResponse> update(Long id, RoleDto.UpdateRoleRequest request);
    Mono<Void> delete(Long id);
    Mono<RoleDto.RoleResponse> restore(Long id);
    Mono<Void> excludePermissions(Long roleId, RoleDto.ExcludePermissionsRequest request);
    Mono<PageResponse<RoleDto.RoleResponse>> search(RequestPage requestPage, Map<String, Object> filters);
}
