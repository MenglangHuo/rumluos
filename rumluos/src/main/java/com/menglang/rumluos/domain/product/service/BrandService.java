package com.menglang.rumluos.domain.product.service;

import com.menglang.rumluos.domain.product.entity.Brand;
import com.menglang.rumluos.domain.product.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Service for managing {@link Brand} entities within a SaaS tenant boundary.
 */
@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;

    // ── Reads ─────────────────────────────────────────────────────

    public Mono<Brand> findById(Long companyId, Long id) {
        return brandRepository.findByIdAndCompanyId(id, companyId);
    }

    public Flux<Brand> findAll(Long companyId) {
        return brandRepository.findByCompanyId(companyId);
    }

    public Flux<Brand> searchByName(Long companyId, String name) {
        if (name == null || name.isBlank()) {
            return Flux.empty();
        }
        String query = "%" + name.trim().toLowerCase() + "%";
        return brandRepository.searchByNameAndCompanyId(query, companyId);
    }

    // ── Writes ────────────────────────────────────────────────────

    @Transactional
    public Mono<Brand> create(Long companyId, Brand brand) {
        brand.setCompanyId(companyId);
        brand.setCreatedAt(Instant.now());
        brand.setCreatedBy("SYSTEM");
        return brandRepository.save(brand);
    }

    @Transactional
    public Mono<Brand> update(Long companyId, Long id, Brand details) {
        return brandRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    existing.setName(details.getName());
                    existing.setDescription(details.getDescription());
                    existing.setLogoUrl(details.getLogoUrl());
                    existing.setActive(details.isActive());
                    existing.setUpdatedAt(Instant.now());
                    existing.setUpdatedBy("SYSTEM");
                    return brandRepository.save(existing);
                });
    }

    @Transactional
    public Mono<Void> delete(Long companyId, Long id) {
        return brandRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    existing.setDeletedAt(Instant.now());
                    existing.setDeletedBy("SYSTEM");
                    return brandRepository.save(existing).then();
                });
    }
}
