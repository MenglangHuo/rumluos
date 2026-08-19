package com.menglang.rumluos.domain.storage.repository;

import com.menglang.rumluos.domain.storage.entity.Attachment;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AttachmentRepository extends ReactiveCrudRepository<Attachment, Long> {

    @Query("SELECT * FROM attachments WHERE id = :id AND company_id = :companyId AND deleted_at IS NULL")
    Mono<Attachment> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT * FROM attachments WHERE company_id = :companyId AND deleted_at IS NULL ORDER BY created_at DESC")
    Flux<Attachment> findByCompanyId(Long companyId);

    @Query("""
        SELECT * FROM attachments
        WHERE company_id = :companyId
          AND deleted_at IS NULL
          AND (:category IS NULL OR category = :category)
          AND (:branchId IS NULL OR branch_id = :branchId)
          AND (:search IS NULL OR LOWER(file_name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    Flux<Attachment> findPaged(Long companyId, String category, Long branchId, String search, int limit, int offset);

    @Query("""
        SELECT COUNT(*) FROM attachments
        WHERE company_id = :companyId
          AND deleted_at IS NULL
          AND (:category IS NULL OR category = :category)
          AND (:branchId IS NULL OR branch_id = :branchId)
          AND (:search IS NULL OR LOWER(file_name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Mono<Long> countPaged(Long companyId, String category, Long branchId, String search);
}
