package com.menglang.rumluos.domain.product.service;

import com.menglang.rumluos.domain.product.entity.Product;
import com.menglang.rumluos.domain.product.repository.ProductRepository;
import com.menglang.rumluos.common.cache.ReactiveCacheManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import com.menglang.rumluos.domain.product.dto.ProductDto;

/**
 * Service for managing {@link Product} entities within a SaaS tenant boundary.
 *
 * <p>Every operation is scoped to {@code companyId}. Cache keys are namespaced per
 * tenant as {@code "product:{companyId}:id:{id}"} to avoid cross-tenant collisions.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ReactiveCacheManager cacheManager;

    // ── Cache key helpers ─────────────────────────────────────────

    private String cacheKeyId(Long companyId, Long id) {
        return "product:" + companyId + ":id:" + id;
    }

    private String cacheKeySerial(Long companyId, String serialNumber) {
        return "product:" + companyId + ":sn:" + serialNumber;
    }

    // ── Reads ─────────────────────────────────────────────────────

    /**
     * Find product by ID within the tenant. Result is cached.
     */
    public Mono<Product> findById(Long companyId, Long id) {
        return cacheManager.getOrLoad(
                cacheKeyId(companyId, id),
                () -> productRepository.findByIdAndCompanyId(id, companyId)
        );
    }

    /**
     * Case-insensitive partial name search via functional LOWER index.
     */
    public Flux<Product> searchByName(Long companyId, String name) {
        if (name == null || name.isBlank()) {
            return Flux.empty();
        }
        String query = "%" + name.trim().toLowerCase() + "%";
        return productRepository.searchByNameAndCompanyId(query, companyId);
    }

    /**
     * Search products by JSONB attributes using PostgreSQL GIN index containment (@>).
     *
     * @param companyId tenant boundary
     * @param jsonQuery JSON object string, e.g. '{"color": "red"}'
     */
    public Flux<Product> searchByAttributes(Long companyId, String jsonQuery) {
        if (jsonQuery == null || jsonQuery.isBlank()) {
            return Flux.empty();
        }
        return productRepository.searchByAttributesAndCompanyId(jsonQuery, companyId);
    }

    /**
     * Find products by category within the tenant.
     */
    public Flux<Product> findByCategoryId(Long companyId, Long categoryId) {
        return productRepository.findByCategoryIdAndCompanyId(categoryId, companyId);
    }

    /**
     * Find products by brand within the tenant.
     */
    public Flux<Product> findByBrandId(Long companyId, Long brandId) {
        return productRepository.findByBrandIdAndCompanyId(brandId, companyId);
    }

    /**
     * Find product by serial number within the tenant (cached).
     */
    public Mono<Product> findBySerialNumber(Long companyId, String serialNumber) {
        if (serialNumber == null || serialNumber.isBlank()) {
            return Mono.empty();
        }
        return cacheManager.getOrLoad(
                cacheKeySerial(companyId, serialNumber),
                () -> productRepository.findBySerialNumberAndCompanyId(serialNumber, companyId)
        );
    }

    /**
     * List all products for a tenant.
     */
    public Flux<Product> findAll(Long companyId) {
        return productRepository.findByCompanyId(companyId);
    }

    // ── Writes ────────────────────────────────────────────────────

    /**
     * Create a product, binding it to the caller's company.
     */
    @Transactional
    public Mono<Product> create(Long companyId, Product product) {
        product.setCompanyId(companyId);
        product.setCreatedAt(Instant.now());
        product.setCreatedBy("SYSTEM");
        return productRepository.save(product);
    }

    /**
     * Update a product, validating tenant ownership, then evicting stale cache.
     */
    @Transactional
    public Mono<Product> update(Long companyId, Long id, Product details) {
        return productRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    cacheManager.evict(cacheKeyId(companyId, id));
                    if (existing.getSerialNumber() != null) {
                        cacheManager.evict(cacheKeySerial(companyId, existing.getSerialNumber()));
                    }

                    existing.setName(details.getName());
                    existing.setBrandId(details.getBrandId());
                    existing.setCategoryId(details.getCategoryId());
                    existing.setModel(details.getModel());
                    existing.setSerialNumber(details.getSerialNumber());
                    existing.setYear(details.getYear());
                    existing.setCondition(details.getCondition());
                    existing.setBasePrice(details.getBasePrice());
                    existing.setSellPrice(details.getSellPrice());
                    existing.setCurrency(details.getCurrency());
                    existing.setDescription(details.getDescription());
                    existing.setImageUrl(details.getImageUrl());
                    existing.setAttributes(details.getAttributes());
                    existing.setStatus(details.getStatus());
                    existing.setActive(details.isActive());
                    existing.setNotes(details.getNotes());
                    existing.setUpdatedAt(Instant.now());
                    existing.setUpdatedBy("SYSTEM");

                    return productRepository.save(existing);
                });
    }

    /**
     * Soft-delete a product, validating tenant ownership, then invalidating cache.
     */
    @Transactional
    public Mono<Void> delete(Long companyId, Long id) {
        return productRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    cacheManager.evict(cacheKeyId(companyId, id));
                    if (existing.getSerialNumber() != null) {
                        cacheManager.evict(cacheKeySerial(companyId, existing.getSerialNumber()));
                    }

                    existing.setDeletedAt(Instant.now());
                    existing.setDeletedBy("SYSTEM");
                    return productRepository.save(existing).then();
                });
    }

    /**
     * Bulk import products for consumer goods (phone, moto, car).
     * Each product must have a unique serial number within the tenant.
     * Products that fail validation are skipped and reported in the response.
     */
    @Transactional
    public Mono<ProductDto.BatchImportResponse> importBatch(Long companyId, List<Product> products) {
        List<ProductDto.ProductResponse> imported = new ArrayList<>();
        List<ProductDto.BatchImportError> errors = new ArrayList<>();

        return Flux.fromIterable(products)
                .index()
                .concatMap(tuple -> {
                    int idx = tuple.getT1().intValue();
                    Product product = tuple.getT2();
                    product.setCompanyId(companyId);
                    product.setCreatedAt(Instant.now());
                    product.setCreatedBy("SYSTEM");

                    if (product.getSerialNumber() == null || product.getSerialNumber().isBlank()) {
                        errors.add(ProductDto.BatchImportError.builder()
                                .index(idx)
                                .serialNumber(null)
                                .reason("Serial number is required for each product")
                                .build());
                        return Mono.empty();
                    }

                    return productRepository.findBySerialNumberAndCompanyId(product.getSerialNumber(), companyId)
                            .flatMap(existing -> {
                                errors.add(ProductDto.BatchImportError.builder()
                                        .index(idx)
                                        .serialNumber(product.getSerialNumber())
                                        .reason("Duplicate serial number: already exists as product ID " + existing.getId())
                                        .build());
                                return Mono.<Product>empty();
                            })
                            .switchIfEmpty(productRepository.save(product))
                            .doOnNext(saved -> imported.add(ProductDto.ProductResponse.builder()
                                    .id(saved.getId())
                                    .companyId(saved.getCompanyId())
                                    .brandId(saved.getBrandId())
                                    .categoryId(saved.getCategoryId())
                                    .name(saved.getName())
                                    .model(saved.getModel())
                                    .serialNumber(saved.getSerialNumber())
                                    .year(saved.getYear())
                                    .condition(saved.getCondition())
                                    .basePrice(saved.getBasePrice())
                                    .sellPrice(saved.getSellPrice())
                                    .currency(saved.getCurrency())
                                    .description(saved.getDescription())
                                    .imageUrl(saved.getImageUrl())
                                    .attributes(saved.getAttributes())
                                    .status(saved.getStatus())
                                    .isActive(saved.isActive())
                                    .notes(saved.getNotes())
                                    .createdAt(saved.getCreatedAt())
                                    .updatedAt(saved.getUpdatedAt())
                                    .build()));
                })
                .then(Mono.fromCallable(() -> ProductDto.BatchImportResponse.builder()
                        .totalRequested(products.size())
                        .successCount(imported.size())
                        .failedCount(errors.size())
                        .imported(imported)
                        .errors(errors)
                        .build()));
    }
}
