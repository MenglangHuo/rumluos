package com.menglang.rumluos.domain.company.service;

import com.menglang.rumluos.domain.company.entity.Customer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomerService {
    Mono<Customer> findById(Long companyId, Long id);
    Mono<Customer> findByPhone(Long companyId, String phone);
    Flux<Customer> searchByName(Long companyId, String name);
    Mono<Customer> findByNationalId(Long companyId, String nationalId);
    Flux<Customer> findAllByActive(Long companyId, boolean isActive);
    Mono<Customer> create(Long companyId, Customer customer);
    Mono<Customer> update(Long companyId, Long id, Customer details);
    Mono<Void> delete(Long companyId, Long id);
}
