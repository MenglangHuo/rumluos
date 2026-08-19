package com.menglang.rumluos.domain.storage.service;

import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.domain.storage.dto.AttachmentDto;
import com.menglang.rumluos.domain.storage.entity.Attachment;
import reactor.core.publisher.Mono;

public interface AttachmentService {

    Mono<Attachment> createAttachment(Long companyId, Long userId, Attachment attachment);

    Mono<Attachment> getAttachmentById(Long companyId, Long id);

    Mono<PageResponse<Attachment>> listAttachments(Long companyId, String category, Long branchId, String search, int page, int size);

    Mono<Attachment> updateAttachment(Long companyId, Long id, AttachmentDto.UpdateAttachmentRequest updateRequest);

    Mono<Void> deleteAttachment(Long companyId, Long id, String actorUsername);

    Mono<AttachmentDto.AttachmentDownloadResponse> generateDownloadUrl(Long companyId, Long id);
}
