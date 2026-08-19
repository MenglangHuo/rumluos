package com.menglang.rumluos.domain.product.mapper;

import com.menglang.rumluos.domain.product.dto.CategoryDto.CategoryRequest;
import com.menglang.rumluos.domain.product.dto.CategoryDto.CategoryResponse;
import com.menglang.rumluos.domain.product.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryRequest request) {
        if (request == null) {
            return null;
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setColor(request.getColor());
        category.setParentId(request.getParentId());
        category.setImageUrl(request.getImageUrl());
        category.setSortOrder(request.getSortOrder());

        return category;
    }

    public CategoryResponse toDto(Category entity) {
        if (entity == null) {
            return null;
        }

        return CategoryResponse.builder()
                .id(entity.getId())
                .companyId(entity.getCompanyId())
                .name(entity.getName())
                .description(entity.getDescription())
                .color(entity.getColor())
                .parentId(entity.getParentId())
                .imageUrl(entity.getImageUrl())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
