package com.menglang.rumluos.domain.company.service.impl;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.service.DynamicSearchService;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.company.dto.BranchDto;
import com.menglang.rumluos.domain.company.entity.Branch;
import com.menglang.rumluos.domain.company.repository.BranchRepository;
import com.menglang.rumluos.domain.company.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final DynamicSearchService dynamicSearchService;

    @Override
    @Transactional
    public Mono<BranchDto.BranchResponse> create(BranchDto.BranchRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Branch branch = Branch.builder()
                            .name(request.getName())
                            .phone(request.getPhone())
                            .address(request.getAddress())
                            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                            .build();
                    branch.setCompanyId(companyId);
                    return branchRepository.save(branch).map(this::mapToResponse);
                });
    }

    @Override
    @Transactional
    public Mono<BranchDto.BranchResponse> update(Long id, BranchDto.BranchRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> branchRepository.findById(id)
                        .filter(b -> Objects.equals(b.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Branch not found")))
                        .flatMap(branch -> {
                            branch.setName(request.getName() != null ? request.getName() : branch.getName());
                            branch.setPhone(request.getPhone() != null ? request.getPhone() : branch.getPhone());
                            branch.setAddress(request.getAddress() != null ? request.getAddress() : branch.getAddress());
                            if (request.getIsActive() != null) {
                                branch.setActive(request.getIsActive());
                            }
                            branch.setUpdatedAt(java.time.Instant.now());
                            return branchRepository.save(branch);
                        })
                        .map(this::mapToResponse));
    }

    @Override
    public Mono<BranchDto.BranchResponse> getById(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> branchRepository.findById(id)
                        .filter(b -> Objects.equals(b.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Branch not found")))
                        .map(this::mapToResponse));
    }

    @Override
    @Transactional
    public Mono<Void> delete(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> branchRepository.findById(id)
                        .filter(b -> Objects.equals(b.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Branch not found")))
                        .flatMap(branch -> {
                            branch.setActive(false);
                            branch.setUpdatedAt(java.time.Instant.now());
                            return branchRepository.save(branch);
                        })
                        .then());
    }

    @Override
    @Transactional
    public Mono<BranchDto.BranchResponse> restore(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> branchRepository.findById(id)
                        .filter(b -> Objects.equals(b.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Branch not found")))
                        .flatMap(branch -> {
                            branch.setActive(true);
                            branch.setUpdatedAt(java.time.Instant.now());
                            return branchRepository.save(branch);
                        })
                        .map(this::mapToResponse));
    }

    @Override
    public Mono<PageResponse<BranchDto.BranchResponse>> search(RequestPage requestPage, Map<String, Object> filters) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> dynamicSearchService.search(requestPage, Branch.class, companyId, List.of("name", "address", "phone"), filters)
                        .flatMap(pageResponse -> {
                            List<Branch> branches = pageResponse.getContent();
                            return Flux.fromIterable(branches)
                                    .map(this::mapToResponse)
                                    .collectList()
                                    .map(dtos -> PageResponse.<BranchDto.BranchResponse>builder()
                                            .content(dtos)
                                            .totalElements(pageResponse.getTotalElements())
                                            .totalPages(pageResponse.getTotalPages())
                                            .pageNumber(pageResponse.getPageNumber())
                                            .pageSize(pageResponse.getPageSize())
                                            .build());
                        })
                );
    }

    private BranchDto.BranchResponse mapToResponse(Branch branch) {
        return BranchDto.BranchResponse.builder()
                .id(branch.getId())
                .companyId(branch.getCompanyId())
                .name(branch.getName())
                .phone(branch.getPhone())
                .address(branch.getAddress())
                .isActive(branch.isActive())
                .build();
    }
}
