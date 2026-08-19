package com.menglang.rumluos.domain.company.repository;

import com.menglang.rumluos.domain.company.entity.Branch;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchRepository extends R2dbcRepository<Branch, Long> {
}
