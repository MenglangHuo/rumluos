package com.menglang.rumluos.domain.company.service;

import com.menglang.rumluos.common.page.PageResponse;
import com.menglang.rumluos.common.page.RequestPage;
import com.menglang.rumluos.domain.company.dto.CompanyDto;
import reactor.core.publisher.Mono;

public interface CompanyService {
    Mono<CompanyDto.CompanyResponse> create(CompanyDto.CreateCompanyRequest request);
    Mono<CompanyDto.CompanyResponse> getById(Long id);
    Mono<PageResponse<CompanyDto.CompanyResponse>> getAll(RequestPage page);
    Mono<CompanyDto.CompanyResponse> update(Long id, CompanyDto.UpdateCompanyRequest request);
    Mono<Void> delete(Long id);
    Mono<CompanyDto.CompanyResponse> restore(Long id);
    Mono<CompanyDto.CompanyResponse> toggleActive(Long id);
}
