package com.menglang.rumluos.domain.company.repository;

import com.menglang.rumluos.domain.company.entity.Staff;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface StaffRepository extends R2dbcRepository<Staff, Long> {
    Mono<Staff> findByUserIdAndCompanyId(Long userId, Long companyId);
}
