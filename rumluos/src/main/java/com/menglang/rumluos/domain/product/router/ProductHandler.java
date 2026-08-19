package com.menglang.rumluos.domain.product.router;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.product.dto.ProductDto;
import com.menglang.rumluos.domain.product.mapper.ProductMapper;
import com.menglang.rumluos.domain.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class ProductHandler {

    private final ProductService productService;
    private final ProductMapper productMapper;

    public Mono<ServerResponse> create(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(ProductDto.ProductRequest.class)
                        .flatMap(req -> productService.create(companyId, productMapper.toEntity(req)))
                        .map(productMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(ProductDto.ProductRequest.class)
                        .flatMap(req -> productService.update(companyId, id, productMapper.toEntity(req)))
                        .map(productMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> productService.findById(companyId, id)
                        .switchIfEmpty(Mono.error(new NotFoundException("Product not found")))
                        .map(productMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> productService.delete(companyId, id)
                        .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)))
                );
    }

    public Mono<ServerResponse> search(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    var nameOpt = request.queryParam("name");
                    var serialNumberOpt = request.queryParam("serialNumber");
                    var categoryIdOpt = request.queryParam("categoryId");
                    var brandIdOpt = request.queryParam("brandId");
                    var attributesOpt = request.queryParam("attributes");

                    if (nameOpt.isPresent()) {
                        return productService.searchByName(companyId, nameOpt.get())
                                .map(productMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else if (serialNumberOpt.isPresent()) {
                        return productService.findBySerialNumber(companyId, serialNumberOpt.get())
                                .map(productMapper::toDto)
                                .map(java.util.List::of)
                                .defaultIfEmpty(java.util.List.of())
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else if (categoryIdOpt.isPresent()) {
                        return productService.findByCategoryId(companyId, Long.valueOf(categoryIdOpt.get()))
                                .map(productMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else if (brandIdOpt.isPresent()) {
                        return productService.findByBrandId(companyId, Long.valueOf(brandIdOpt.get()))
                                .map(productMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else if (attributesOpt.isPresent()) {
                        return productService.searchByAttributes(companyId, attributesOpt.get())
                                .map(productMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else {
                        return productService.findAll(companyId)
                                .map(productMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    }
                });
    }

    public Mono<ServerResponse> importBatch(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(ProductDto.BatchImportRequest.class)
                        .flatMap(req -> {
                            if (req.getProducts() == null || req.getProducts().isEmpty()) {
                                return Mono.error(new com.menglang.rumluos.common.exception.BadRequestException(
                                        "Products list cannot be empty"));
                            }
                            var entities = req.getProducts().stream()
                                    .map(productMapper::toEntity)
                                    .collect(java.util.stream.Collectors.toList());
                            return productService.importBatch(companyId, entities);
                        })
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }
}
