package com.menglang.rumluos.domain.product.router;

import com.menglang.rumluos.common.exception.NotFoundException;
import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.utils.SecurityUtils;
import com.menglang.rumluos.domain.product.dto.BrandDto;
import com.menglang.rumluos.domain.product.mapper.BrandMapper;
import com.menglang.rumluos.domain.product.service.BrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class BrandHandler {

    private final BrandService brandService;
    private final BrandMapper brandMapper;

    public Mono<ServerResponse> create(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(BrandDto.BrandRequest.class)
                        .flatMap(req -> brandService.create(companyId, brandMapper.toEntity(req)))
                        .map(brandMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> update(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> request.bodyToMono(BrandDto.BrandRequest.class)
                        .flatMap(req -> brandService.update(companyId, id, brandMapper.toEntity(req)))
                        .map(brandMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> brandService.findById(companyId, id)
                        .switchIfEmpty(Mono.error(new NotFoundException("Brand not found")))
                        .map(brandMapper::toDto)
                        .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                );
    }

    public Mono<ServerResponse> delete(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> brandService.delete(companyId, id)
                        .then(ServerResponse.ok().bodyValue(ApiResponse.success(null)))
                );
    }

    public Mono<ServerResponse> search(ServerRequest request) {
        return SecurityUtils.getCurrentCompanyId()
                .flatMap(companyId -> {
                    var nameOpt = request.queryParam("name");
                    if (nameOpt.isPresent()) {
                        return brandService.searchByName(companyId, nameOpt.get())
                                .map(brandMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    } else {
                        return brandService.findAll(companyId)
                                .map(brandMapper::toDto)
                                .collectList()
                                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
                    }
                });
    }
}
