package com.menglang.rumluos.domain.company.repository;

import com.menglang.rumluos.domain.company.entity.StaffDocument;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface StaffDocumentRepository extends R2dbcRepository<StaffDocument, Long> {
    Flux<StaffDocument> findByStaffId(Long staffId);
    Mono<Void> deleteByStaffId(Long staffId);
}
