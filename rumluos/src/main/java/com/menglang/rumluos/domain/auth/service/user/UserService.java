package com.menglang.rumluos.domain.auth.service.user;

import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.domain.auth.dto.AuthDto;
import com.menglang.rumluos.domain.auth.dto.UserDto;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface UserService {
    Mono<UserDto.UserResponse> register(AuthDto.RegisterByAdminRequest request, List<Long> roleIds);
    Mono<UserDto.UserResponse> update(Long userId, UserDto.UpdateUserRequest request);
    Mono<UserDto.UserResponse> getById(Long id);
    Mono<Void> delete(Long id);
    Mono<UserDto.UserResponse> restore(Long id);
    Mono<PageResponse<UserDto.UserResponse>> search(RequestPage requestPage, Map<String, Object> filters);
    Mono<Void> addPermissions(Long userId, UserDto.AddPermissionsRequest request);
    Mono<Void> excludePermissions(Long userId, UserDto.ExcludePermissionsRequest request);
    Mono<UserDto.UserResponse> getMe(Long userId, boolean isSystemAdmin);
    Mono<UserDto.UserResponse> updateMe(Long userId, UserDto.UpdateMeProfileRequest request);
    Mono<Void> changePassword(Long userId, UserDto.ChangePasswordRequest request);
}
