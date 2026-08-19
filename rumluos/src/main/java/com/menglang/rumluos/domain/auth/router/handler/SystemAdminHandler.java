package com.menglang.rumluos.domain.auth.router.handler;

import com.menglang.rumluos.common.page.ApiResponse;
import com.menglang.rumluos.common.validation.RequestValidator;
import com.menglang.rumluos.domain.auth.dto.SystemAdminDto;
import com.menglang.rumluos.domain.auth.entity.SystemAdmin;
import com.menglang.rumluos.domain.auth.repository.SystemAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class SystemAdminHandler {

    private final SystemAdminRepository systemAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final RequestValidator validator;

    public Mono<ServerResponse> create(ServerRequest request) {
        return request.bodyToMono(SystemAdminDto.CreateRequest.class)
                .doOnNext(validator::validate)
                .flatMap(req -> {
                    SystemAdmin admin = new SystemAdmin();
                    admin.setUsername(req.getUsername());
                    admin.setEmail(req.getEmail());
                    admin.setPasswordHash(passwordEncoder.encode(req.getPassword()));
                    admin.setFirstName(req.getFirstName());
                    admin.setLastName(req.getLastName());
                    return systemAdminRepository.save(admin);
                })
                .map(this::toResponse)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)));
    }

    public Mono<ServerResponse> getAll(ServerRequest request) {
        return systemAdminRepository.findAll()
                .map(this::toResponse)
                .collectList()
                .flatMap(list -> ServerResponse.ok().bodyValue(ApiResponse.success(list)));
    }

    public Mono<ServerResponse> getById(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        return systemAdminRepository.findById(id)
                .map(this::toResponse)
                .flatMap(res -> ServerResponse.ok().bodyValue(ApiResponse.success(res)))
                .switchIfEmpty(ServerResponse.status(HttpStatus.NOT_FOUND).bodyValue(ApiResponse.error("System admin not found")));
    }

    private SystemAdminDto.Response toResponse(SystemAdmin admin) {
        SystemAdminDto.Response res = new SystemAdminDto.Response();
        res.setId(admin.getId());
        res.setUsername(admin.getUsername());
        res.setEmail(admin.getEmail());
        res.setFirstName(admin.getFirstName());
        res.setLastName(admin.getLastName());
        res.setActive(admin.isActive());
        return res;
    }
}
