package com.menglang.rumluos.common.model;

import com.menglang.rumluos.common.exception.ValidationFailedException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class TenantContext {

    public static String COMPANY_ID_PATH_VAR="companyId";

    public Mono<Long> resolveCompanyId(ServerRequest request) {
        String raw=request.pathVariable(COMPANY_ID_PATH_VAR);
        if(raw==null){
          return Mono.error(new ValidationFailedException(Map.of(COMPANY_ID_PATH_VAR,"CompanyId path variable not defined!")));
        }
        try {
            return Mono.just(Long.parseLong(raw));
        } catch (NumberFormatException e) {
            return Mono.error(new ValidationFailedException(
                    Map.of(COMPANY_ID_PATH_VAR, "companyId must be numeric")));
        }
    }
}
