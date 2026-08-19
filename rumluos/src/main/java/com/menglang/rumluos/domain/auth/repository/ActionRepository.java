package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.Action;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface ActionRepository extends R2dbcRepository<Action, Long> {

    Mono<Action> findByNameAndCompanyId(String name, Long companyId);

    Flux<Action> findAllByNameInAndCompanyId(Collection<String> names, Long companyId);

    Mono<Boolean> existsByNameAndCompanyId(String name, Long companyId);
}