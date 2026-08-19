package com.menglang.rumluos.domain.product.router;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.product.dto.CategoryDto;
import com.menglang.rumluos.domain.product.mapper.CategoryMapper;
import com.menglang.rumluos.domain.product.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class CategoryHandler {

    private final CategoryService categoryService;
    private final CategoryMapper categoryMapper;

    public Mono<ServerResponse> create(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(CategoryDto.CategoryRequest.class)
                        .flatMap(req -> categoryService.create(companyId, categoryMapper.toEntity(req)))
                        .map(categoryMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(CategoryDto.CategoryRequest.class)
                        .flatMap(req -> categoryService.update(companyId, id, categoryMapper.toEntity(req)))
                        .map(categoryMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> categoryService.findById(companyId, id)
                        .switchIfEmpty(Mono.error(new NotFoundException("Category not found")))
                        .map(categoryMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> categoryService.delete(companyId, id)
                        .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)))
                );
    }

    public Mono<ServerResponse> search(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    var nameOpt = request.queryParam("name");
                    var parentIdOpt = request.queryParam("parentId");
                    
                    if (nameOpt.isPresent()) {
                        return categoryService.searchByName(companyId, nameOpt.get())
                                .map(categoryMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else if (parentIdOpt.isPresent()) {
                        if (parentIdOpt.get().equals("null") || parentIdOpt.get().isEmpty()) {
                            return categoryService.findRootCategories(companyId)
                                    .map(categoryMapper::toDto)
                                    .collectList()
                                    .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                        } else {
                            return categoryService.findSubcategories(companyId, Long.valueOf(parentIdOpt.get()))
                                    .map(categoryMapper::toDto)
                                    .collectList()
                                    .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                        }
                    } else {
                        return categoryService.findAll(companyId)
                                .map(categoryMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    }
                });
    }
}
