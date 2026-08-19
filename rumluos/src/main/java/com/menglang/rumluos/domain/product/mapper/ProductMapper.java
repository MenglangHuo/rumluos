package com.menglang.rumluos.domain.product.mapper;

import com.menglang.rumluos.domain.product.dto.ProductDto.ProductRequest;
import com.menglang.rumluos.domain.product.dto.ProductDto.ProductResponse;
import com.menglang.rumluos.domain.product.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public Product toEntity(ProductRequest request) {
        if (request == null) {
            return null;
        }

        Product product = new Product();
        product.setBrandId(request.getBrandId());
        product.setCategoryId(request.getCategoryId());
        product.setName(request.getName());
        product.setModel(request.getModel());
        product.setSerialNumber(request.getSerialNumber());
        product.setYear(request.getYear());
        
        if (request.getCondition() != null) {
            product.setCondition(request.getCondition());
        }
        
        product.setBasePrice(request.getBasePrice());
        product.setSellPrice(request.getSellPrice());
        product.setCurrency(request.getCurrency());
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());
        product.setAttributes(request.getAttributes());
        
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }
        
        if (request.getIsActive() != null) {
            product.setActive(request.getIsActive());
        }
        
        product.setNotes(request.getNotes());

        return product;
    }

    public ProductResponse toDto(Product entity) {
        if (entity == null) {
            return null;
        }

        return ProductResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .brandId(entity.getBrandId())
                .categoryId(entity.getCategoryId())
                .name(entity.getName())
                .model(entity.getModel())
                .serialNumber(entity.getSerialNumber())
                .year(entity.getYear())
                .condition(entity.getCondition())
                .basePrice(entity.getBasePrice())
                .sellPrice(entity.getSellPrice())
                .currency(entity.getCurrency())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .attributes(entity.getAttributes())
                .status(entity.getStatus())
                .isActive(entity.isActive())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
