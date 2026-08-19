package com.menglang.rumluos.domain.auth.repository;

import com.menglang.rumluos.domain.auth.entity.User;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends R2dbcRepository<User, Long> {
    Mono<User> findByEmail(String email);
    Mono<User> findByUsername(String username);
    Mono<User> findByUserKey(java.util.UUID userKey);
    @Query("SELECT CASE WHEN COUNT(\"u\".\"id\") > 0 THEN true ELSE false END FROM \"users\" \"u\" WHERE \"u\".\"username\" = :username OR \"u\".\"email\" = :email")
    Mono<Boolean> existsByUsernameOrEmail(String username, String email);
}

