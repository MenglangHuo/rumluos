package com.menglang.rumluos.domain.product.service;

import com.menglang.rumluos.domain.product.entity.Category;
import com.menglang.rumluos.domain.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Service for managing {@link Category} entities within a SaaS tenant boundary.
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    // ── Reads ─────────────────────────────────────────────────────

    public Mono<Category> findById(Long companyId, Long id) {
        return categoryRepository.findByIdAndCompanyId(id, companyId);
    }

    public Flux<Category> findAll(Long companyId) {
        return categoryRepository.findByCompanyId(companyId);
    }

    public Flux<Category> findRootCategories(Long companyId) {
        return categoryRepository.findRootCategoriesByCompanyId(companyId);
    }

    public Flux<Category> findSubcategories(Long companyId, Long parentId) {
        return categoryRepository.findByParentIdAndCompanyId(parentId, companyId);
    }

    public Flux<Category> searchByName(Long companyId, String name) {
        if (name == null || name.isBlank()) {
            return Flux.empty();
        }
        String query = "%" + name.trim().toLowerCase() + "%";
        return categoryRepository.searchByNameAndCompanyId(query, companyId);
    }

    // ── Writes ────────────────────────────────────────────────────

    @Transactional
    public Mono<Category> create(Long companyId, Category category) {
        category.setCompanyId(companyId);
        category.setCreatedAt(Instant.now());
        category.setCreatedBy("SYSTEM");
        return categoryRepository.save(category);
    }

    @Transactional
    public Mono<Category> update(Long companyId, Long id, Category details) {
        return categoryRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    existing.setName(details.getName());
                    existing.setDescription(details.getDescription());
                    existing.setColor(details.getColor());
                    existing.setParentId(details.getParentId());
                    existing.setImageUrl(details.getImageUrl());
                    existing.setSortOrder(details.getSortOrder());
                    existing.setUpdatedAt(Instant.now());
                    existing.setUpdatedBy("SYSTEM");
                    return categoryRepository.save(existing);
                });
    }

    @Transactional
    public Mono<Void> delete(Long companyId, Long id) {
        return categoryRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    existing.setDeletedAt(Instant.now());
                    existing.setDeletedBy("SYSTEM");
                    return categoryRepository.save(existing).then();
                });
    }
}
