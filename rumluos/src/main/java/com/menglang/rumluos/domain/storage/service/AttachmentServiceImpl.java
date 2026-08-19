package com.menglang.rumluos.domain.storage.service;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.PageUtils;
import com.menglang.rumluos.domain.storage.dto.AttachmentDto;
import com.menglang.rumluos.domain.storage.entity.Attachment;
import com.menglang.rumluos.domain.storage.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final StorageService storageService;

    @Override
    public Mono<Attachment> createAttachment(Long companyId, Long userId, Attachment attachment) {
        attachment.setCompanyId(companyId);
        attachment.setUploadedByUserId(userId);
        if (attachment.getCreatedAt() == null) {
            attachment.setCreatedAt(Instant.now());
        }
        return attachmentRepository.save(attachment);
    }

    @Override
    public Mono<Attachment> getAttachmentById(Long companyId, Long id) {
        return attachmentRepository.findByIdAndCompanyId(id, companyId)
                .switchIfEmpty(Mono.error(new NotFoundException("Attachment not found with id: " + id)));
    }

    @Override
    public Mono<PageResponse<Attachment>> listAttachments(Long companyId, String category, Long branchId, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        int limit = size;
        int offset = page * size;

        String searchPattern = (search != null && !search.isBlank()) ? search.trim() : null;
        String categoryFilter = (category != null && !category.isBlank()) ? category.trim() : null;

        Flux<Attachment> contentFlux = attachmentRepository.findPaged(companyId, categoryFilter, branchId, searchPattern, limit, offset);
        Mono<Long> countMono = attachmentRepository.countPaged(companyId, categoryFilter, branchId, searchPattern);

        return PageUtils.createPageResponse(contentFlux, countMono, pageable);
    }

    @Override
    public Mono<Attachment> updateAttachment(Long companyId, Long id, AttachmentDto.UpdateAttachmentRequest updateRequest) {
        return getAttachmentById(companyId, id)
                .flatMap(existing -> {
                    if (updateRequest.getFileName() != null && !updateRequest.getFileName().isBlank()) {
                        existing.setFileName(updateRequest.getFileName().trim());
                    }
                    if (updateRequest.getCategory() != null) {
                        existing.setCategory(updateRequest.getCategory().trim());
                    }
                    if (updateRequest.getDescription() != null) {
                        existing.setDescription(updateRequest.getDescription());
                    }
                    if (updateRequest.getBranchId() != null) {
                        existing.setBranchId(updateRequest.getBranchId());
                    }
                    if (updateRequest.getIsPublic() != null) {
                        existing.setIsPublic(updateRequest.getIsPublic());
                    }
                    existing.setUpdatedAt(Instant.now());
                    return attachmentRepository.save(existing);
                });
    }

    @Override
    public Mono<Void> deleteAttachment(Long companyId, Long id, String actorUsername) {
        return getAttachmentById(companyId, id)
                .flatMap(existing -> {
                    existing.softDelete(actorUsername);
                    return attachmentRepository.save(existing);
                })
                .then();
    }

    @Override
    public Mono<AttachmentDto.AttachmentDownloadResponse> generateDownloadUrl(Long companyId, Long id) {
        return getAttachmentById(companyId, id)
                .flatMap(attachment -> storageService.generateDownloadUrl(attachment.getFileKey())
                        .map(downloadRes -> AttachmentDto.AttachmentDownloadResponse.builder()
                                .attachmentId(attachment.getId())
                                .fileName(attachment.getFileName())
                                .downloadUrl(downloadRes.getDownloadUrl())
                                .expirationTimeMillis(downloadRes.getExpirationTimeMillis())
                                .build()));
    }
}
