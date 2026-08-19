package com.menglang.rumluos.domain.company.service;

import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.domain.company.dto.StaffDto;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface StaffService {
    Mono<StaffDto.StaffResponse> createOrUpdate(StaffDto.StaffRequest request);
    Mono<StaffDto.StaffResponse> getById(Long id);
    Mono<PageResponse<StaffDto.StaffResponse>> search(RequestPage requestPage, Map<String, Object> filters);
}
