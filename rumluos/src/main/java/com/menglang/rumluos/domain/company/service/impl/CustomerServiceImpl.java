package com.menglang.rumluos.domain.company.service.impl;

import com.menglang.rumluos.domain.company.entity.Customer;
import com.menglang.rumluos.domain.company.repository.CustomerRepository;
import com.menglang.rumluos.common.cache.ReactiveCacheManager;
import com.menglang.rumluos.domain.company.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Service for managing {@link Customer} entities within a SaaS tenant boundary.
 *
 * <p>Every operation is scoped to {@code companyId} — no cross-tenant data leakage is possible.
 * Reactive caching via Caffeine is keyed as {@code "customer:{companyId}:id:{id}"} etc. so
 * that different tenants never share cache entries.
 */
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final ReactiveCacheManager cacheManager;

    // ── Cache key helpers ─────────────────────────────────────────

    private String cacheKeyId(Long companyId, Long id) {
        return "customer:" + companyId + ":id:" + id;
    }

    private String cacheKeyPhone(Long companyId, String phone) {
        return "customer:" + companyId + ":phone:" + phone;
    }

    private String cacheKeyNationalId(Long companyId, String nationalId) {
        return "customer:" + companyId + ":nid:" + nationalId;
    }

    // ── Reads ─────────────────────────────────────────────────────

    /**
     * Find a customer by ID, scoped to the tenant. Result is cached.
     */
    public Mono<Customer> findById(Long companyId, Long id) {
        return cacheManager.getOrLoad(
                cacheKeyId(companyId, id),
                () -> customerRepository.findByIdAndCompanyId(id, companyId)
        );
    }

    /**
     * Find a customer by phone number within the tenant. Result is cached.
     */
    public Mono<Customer> findByPhone(Long companyId, String phone) {
        return cacheManager.getOrLoad(
                cacheKeyPhone(companyId, phone),
                () -> customerRepository.findByPhoneAndCompanyId(phone, companyId)
        );
    }

    /**
     * Case-insensitive partial name search using functional index.
     */
    public Flux<Customer> searchByName(Long companyId, String name) {
        if (name == null || name.isBlank()) {
            return Flux.empty();
        }
        String query = "%" + name.trim().toLowerCase() + "%";
        return customerRepository.searchByNameAndCompanyId(query, companyId);
    }

    /**
     * Find customer by national ID within the tenant.
     */
    public Mono<Customer> findByNationalId(Long companyId, String nationalId) {
        if (nationalId == null || nationalId.isBlank()) {
            return Mono.empty();
        }
        return cacheManager.getOrLoad(
                cacheKeyNationalId(companyId, nationalId),
                () -> customerRepository.findByNationalIdAndCompanyId(nationalId, companyId)
        );
    }

    /**
     * List all active (or inactive) customers for a tenant.
     */
    public Flux<Customer> findAllByActive(Long companyId, boolean isActive) {
        return customerRepository.findAllByIsActiveAndCompanyId(isActive, companyId);
    }

    // ── Writes ────────────────────────────────────────────────────

    /**
     * Create a new customer, binding it to the caller's company.
     */
    @Transactional
    public Mono<Customer> create(Long companyId, Customer customer) {
        customer.setCompanyId(companyId);
        customer.setCreatedAt(Instant.now());
        customer.setCreatedBy("SYSTEM");
        return customerRepository.save(customer);
    }

    /**
     * Update a customer, validating tenant ownership, then evicting stale cache.
     */
    @Transactional
    public Mono<Customer> update(Long companyId, Long id, Customer details) {
        return customerRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    // Evict all possible cache entries for the old and new phone
                    cacheManager.evict(cacheKeyId(companyId, id));
                    cacheManager.evict(cacheKeyPhone(companyId, existing.getPhone()));
                    if (details.getPhone() != null) {
                        cacheManager.evict(cacheKeyPhone(companyId, details.getPhone()));
                    }
                    if (existing.getNationalId() != null) {
                        cacheManager.evict(cacheKeyNationalId(companyId, existing.getNationalId()));
                    }

                    existing.setName(details.getName());
                    existing.setPhone(details.getPhone());
                    existing.setAddress(details.getAddress());
                    existing.setOccupation(details.getOccupation());
                    existing.setImageUrl(details.getImageUrl());
                    existing.setPreferredCurrency(details.getPreferredCurrency());
                    existing.setActive(details.isActive());
                    existing.setEmail(details.getEmail());
                    existing.setDateOfBirth(details.getDateOfBirth());
                    existing.setGender(details.getGender());
                    existing.setNationalId(details.getNationalId());
                    existing.setUpdatedAt(Instant.now());
                    existing.setUpdatedBy("SYSTEM");

                    return customerRepository.save(existing);
                });
    }

    /**
     * Soft-delete a customer, validating tenant ownership, then invalidating cache.
     */
    @Transactional
    public Mono<Void> delete(Long companyId, Long id) {
        return customerRepository.findByIdAndCompanyId(id, companyId)
                .flatMap(existing -> {
                    cacheManager.evict(cacheKeyId(companyId, id));
                    cacheManager.evict(cacheKeyPhone(companyId, existing.getPhone()));
                    if (existing.getNationalId() != null) {
                        cacheManager.evict(cacheKeyNationalId(companyId, existing.getNationalId()));
                    }

                    existing.setDeletedAt(Instant.now());
                    existing.setDeletedBy("SYSTEM");
                    return customerRepository.save(existing).then();
                });
    }
}
