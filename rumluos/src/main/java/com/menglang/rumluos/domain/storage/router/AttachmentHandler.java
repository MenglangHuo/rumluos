package com.menglang.rumluos.domain.storage.router;

import com.menglang.rumluos.common.exception.BadRequestException;
import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.storage.dto.AttachmentDto;
import com.menglang.rumluos.domain.storage.mapper.AttachmentMapper;
import com.menglang.rumluos.domain.storage.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AttachmentHandler {

    private final AttachmentService attachmentService;
    private final AttachmentMapper attachmentMapper;
    private final RequestValidator validator;

    public Mono<ServerResponse> createAttachment(ServerRequest request) {
        return Mono.zip(
                SecurityUtils.getCurrentCompanyId().switchIfEmpty(Mono.error(new BadRequestException("Company ID is required"))),
                SecurityUtils.getCurrentUserId().defaultIfEmpty(0L)
        ).flatMap(tuple -> {
            Long companyId = tuple.getT1();
            Long userId = tuple.getT2();

            return request.bodyToMono(AttachmentDto.CreateAttachmentRequest.class)
                    .doOnNext(validator::validate)
                    .flatMap(req -> attachmentService.createAttachment(companyId, userId, attachmentMapper.toEntity(req)))
                    .map(attachmentMapper::toDto)
                    .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
        });
    }

    public Mono<ServerResponse> getAttachmentById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> attachmentService.getAttachmentById(companyId, id))
                .map(attachmentMapper::toDto)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> listAttachments(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> {
                    String category = request.queryParam("category").orElse(null);
                    Long branchId = request.queryParam("branchId").map(Long::valueOf).orElse(null);
                    String search = request.queryParam("search")
                            .or(() -> request.queryParam("originalName"))
                            .or(() -> request.queryParam("fileName"))
                            .orElse(null);
                    int page = request.queryParam("page").map(Integer::parseInt).orElse(0);
                    int size = request.queryParam("size").map(Integer::parseInt).orElse(20);

                    return attachmentService.listAttachments(companyId, category, branchId, search, page, size)
                            .map(pageRes -> PageResponse.<AttachmentDto.AttachmentResponse>builder()
                                    .content(pageRes.getContent().stream().map(attachmentMapper::toDto).collect(Collectors.toList()))
                                    .pageNumber(pageRes.getPageNumber())
                                    .pageSize(pageRes.getPageSize())
                                    .totalElements(pageRes.getTotalElements())
                                    .totalPages(pageRes.getTotalPages())
                                    .first(pageRes.isFirst())
                                    .last(pageRes.isLast())
                                    .empty(pageRes.isEmpty())
                                    .build())
                            .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                });
    }

    public Mono<ServerResponse> updateAttachment(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> request.bodyToMono(AttachmentDto.UpdateAttachmentRequest.class)
                        .flatMap(req -> attachmentService.updateAttachment(companyId, id, req))
                        .map(attachmentMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> deleteAttachment(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return Mono.zip(
                SecurityUtils.getCurrentCompanyId().switchIfEmpty(Mono.error(new BadRequestException("Company ID is required"))),
                SecurityUtils.getCurrentUserId().map(String::valueOf).defaultIfEmpty("SYSTEM")
        ).flatMap(tuple -> {
            Long companyId = tuple.getT1();
            String actor = tuple.getT2();
            return attachmentService.deleteAttachment(companyId, id, actor)
                    .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)));
        });
    }

    public Mono<ServerResponse> generateDownloadUrl(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .switchIfEmpty(Mono.error(new BadRequestException("Company ID is required")))
                .flatMap(companyId -> attachmentService.generateDownloadUrl(companyId, id))
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }
}
