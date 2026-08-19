package com.menglang.rumluos.domain.storage.mapper;

import com.menglang.rumluos.domain.storage.dto.AttachmentDto.CreateAttachmentRequest;
import com.menglang.rumluos.domain.storage.dto.AttachmentDto.AttachmentResponse;
import com.menglang.rumluos.domain.storage.entity.Attachment;
import org.springframework.stereotype.Component;

@Component
public class AttachmentMapper {

    public Attachment toEntity(CreateAttachmentRequest request) {
        if (request == null) {
            return null;
        }

        return Attachment.builder()
                .fileName(request.getFileName())
                .fileKey(request.getFileKey())
                .fileUrl(request.getFileUrl())
                .mimeType(request.getMimeType())
                .fileSize(request.getFileSize())
                .category(request.getCategory() != null ? request.getCategory() : "GENERAL")
                .description(request.getDescription())
                .branchId(request.getBranchId())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .isActive(true)
                .build();
    }

    public AttachmentResponse toDto(Attachment entity) {
        if (entity == null) {
            return null;
        }

        return AttachmentResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .branchId(entity.getBranchId())
                .fileName(entity.getFileName())
                .fileKey(entity.getFileKey())
                .fileUrl(entity.getFileUrl())
                .mimeType(entity.getMimeType())
                .fileSize(entity.getFileSize())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .uploadedByUserId(entity.getUploadedByUserId())
                .isPublic(entity.getIsPublic())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
