package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.Role;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends R2dbcRepository<Role, Long> {
    reactor.core.publisher.Mono<Role> findByNameAndCompanyId(String name, Long companyId);
}
