package com.menglang.rumluos.domain.product.mapper;

import com.menglang.rumluos.domain.product.dto.BrandDto.BrandRequest;
import com.menglang.rumluos.domain.product.dto.BrandDto.BrandResponse;
import com.menglang.rumluos.domain.product.entity.Brand;
import org.springframework.stereotype.Component;

@Component
public class BrandMapper {

    public Brand toEntity(BrandRequest request) {
        if (request == null) {
            return null;
        }

        Brand brand = new Brand();
        brand.setName(request.getName());
        brand.setDescription(request.getDescription());
        brand.setLogoUrl(request.getLogoUrl());
        
        if (request.getIsActive() != null) {
            brand.setActive(request.getIsActive());
        }

        return brand;
    }

    public BrandResponse toDto(Brand entity) {
        if (entity == null) {
            return null;
        }

        return BrandResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .name(entity.getName())
                .description(entity.getDescription())
                .logoUrl(entity.getLogoUrl())
                .isActive(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
