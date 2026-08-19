package com.menglang.rumluos.domain.company.service.impl;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.common.service.DynamicSearchService;
import com.menglang.rumluos.domain.company.dto.StaffDto;
import com.menglang.rumluos.domain.company.entity.Staff;
import com.menglang.rumluos.domain.company.entity.StaffDocument;
import com.menglang.rumluos.domain.company.repository.StaffDocumentRepository;
import com.menglang.rumluos.domain.company.repository.StaffRepository;
import com.menglang.rumluos.domain.company.repository.BranchRepository;
import com.menglang.rumluos.domain.company.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final StaffDocumentRepository staffDocumentRepository;
    private final DynamicSearchService dynamicSearchService;
    private final BranchRepository branchRepository;

    @Transactional
    @Override
    public Mono<StaffDto.StaffResponse> createOrUpdate(StaffDto.StaffRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    Mono<Void> branchValidation = request.getBranchId() != null
                            ? branchRepository.findById(request.getBranchId())
                                    .filter(b -> Objects.equals(b.getCompanyId(), companyId))
                                    .switchIfEmpty(Mono.error(new NotFoundException("Branch not found in company context.")))
                                    .then()
                            : Mono.empty();

                    return branchValidation.then(
                        staffRepository.findByUserIdAndCompanyId(request.getUserId(), companyId)
                            .switchIfEmpty(Mono.defer(() -> {
                                Staff s = new Staff();
                                s.setCompanyId(companyId);
                                s.setUserId(request.getUserId());
                                return Mono.just(s);
                            }))
                            .flatMap(staff -> {
                                staff.setBranchId(request.getBranchId());
                                staff.setName(request.getName());
                                staff.setPhone(request.getPhone());
                                staff.setEmail(request.getEmail());
                                staff.setDescription(request.getDescription());
                                staff.setPosition(request.getPosition());
                                staff.setSalary(request.getSalary());
                                staff.setUrgentContactName(request.getUrgentContactName());
                                staff.setUrgentContactPhone(request.getUrgentContactPhone());

                                return staffRepository.save(staff)
                                        .flatMap(savedStaff -> processDocuments(savedStaff.getId(), request.getDocuments())
                                                .thenReturn(savedStaff));
                            })
                    );
                })
                .flatMap(this::mapToResponse);
    }

    private Mono<Void> processDocuments(Long staffId, List<StaffDto.StaffDocumentDto> documents) {
        return staffDocumentRepository.deleteByStaffId(staffId)
                .thenMany(Flux.fromIterable(documents != null ? documents : Collections.<StaffDto.StaffDocumentDto>emptyList())
                        .flatMap(docDto -> {
                            StaffDocument doc = new StaffDocument();
                            doc.setStaffId(staffId);
                            doc.setDocType(docDto.getDocType());
                            doc.setUrl(docDto.getUrl());
                            doc.setFileName(docDto.getFileName());
                            doc.setMimeType(docDto.getMimeType());
                            doc.setFileSize(docDto.getFileSize());
                            return staffDocumentRepository.save(doc);
                        })
                ).then();
    }

    public Mono<StaffDto.StaffResponse> getById(Long id) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> staffRepository.findById(id)
                        .filter(s -> Objects.equals(s.getCompanyId(), companyId))
                        .switchIfEmpty(Mono.error(new NotFoundException("Staff not found")))
                        .flatMap(this::mapToResponse)
                );
    }

    public Mono<PageResponse<StaffDto.StaffResponse>> search(RequestPage requestPage, Map<String, Object> filters) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> dynamicSearchService.search(requestPage, Staff.class, companyId, List.of("name", "email", "phone", "position"), filters)
                        .flatMap(pageResponse -> {
                            List<Staff> staffs = pageResponse.getContent();
                            if (staffs.isEmpty()) {
                                return Mono.just(PageResponse.<StaffDto.StaffResponse>builder()
                                        .content(Collections.emptyList())
                                        .totalElements(pageResponse.getTotalElements())
                                        .totalPages(pageResponse.getTotalPages())
                                        .pageNumber(pageResponse.getPageNumber())
                                        .pageSize(pageResponse.getPageSize())
                                        .build());
                            }
                            return Flux.fromIterable(staffs)
                                    .flatMap(this::mapToResponse)
                                    .collectList()
                                    .map(dtos -> PageResponse.<StaffDto.StaffResponse>builder()
                                            .content(dtos)
                                            .totalElements(pageResponse.getTotalElements())
                                            .totalPages(pageResponse.getTotalPages())
                                            .pageNumber(pageResponse.getPageNumber())
                                            .pageSize(pageResponse.getPageSize())
                                            .build());
                        })
                );
    }

    private Mono<StaffDto.StaffResponse> mapToResponse(Staff staff) {
        StaffDto.StaffResponse response = new StaffDto.StaffResponse();
        response.setId(staff.getId());
        response.setUserId(staff.getUserId());
        response.setBranchId(staff.getBranchId());
        response.setName(staff.getName());
        response.setPhone(staff.getPhone());
        response.setEmail(staff.getEmail());
        response.setDescription(staff.getDescription());
        response.setPosition(staff.getPosition());
        response.setSalary(staff.getSalary());
        response.setUrgentContactName(staff.getUrgentContactName());
        response.setUrgentContactPhone(staff.getUrgentContactPhone());
        response.setActive(staff.isActive());

        return staffDocumentRepository.findByStaffId(staff.getId())
                .map(doc -> {
                    StaffDto.StaffDocumentDto dto = new StaffDto.StaffDocumentDto();
                    dto.setDocType(doc.getDocType());
                    dto.setUrl(doc.getUrl());
                    dto.setFileName(doc.getFileName());
                    dto.setMimeType(doc.getMimeType());
                    dto.setFileSize(doc.getFileSize());
                    return dto;
                })
                .collectList()
                .map(docs -> {
                    response.setDocuments(docs);
                    return response;
                });
    }
}
