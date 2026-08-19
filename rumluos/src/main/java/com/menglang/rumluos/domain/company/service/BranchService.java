package com.menglang.rumluos.domain.company.service;

import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.domain.company.dto.BranchDto;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface BranchService {
    Mono<BranchDto.BranchResponse> create(BranchDto.BranchRequest request);
    Mono<BranchDto.BranchResponse> update(Long id, BranchDto.BranchRequest request);
    Mono<BranchDto.BranchResponse> getById(Long id);
    Mono<Void> delete(Long id);
    Mono<BranchDto.BranchResponse> restore(Long id);
    Mono<PageResponse<BranchDto.BranchResponse>> search(RequestPage requestPage, Map<String, Object> filters);
}
