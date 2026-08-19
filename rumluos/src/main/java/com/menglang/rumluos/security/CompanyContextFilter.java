package com.menglang.rumluos.security;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

@Component
public class CompanyContextFilter implements WebFilter {

    public static final String COMPANY_ID_HEADER = "X-Company-Id";
    public static final String COMPANY_ID_QUERY_PARAM = "companyId";
    public static final String CONTEXT_COMPANY_ID_KEY = "REQUEST_COMPANY_ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String companyIdStr = exchange.getRequest().getHeaders().getFirst(COMPANY_ID_HEADER);
        if (companyIdStr == null || companyIdStr.isBlank()) {
            companyIdStr = exchange.getRequest().getQueryParams().getFirst(COMPANY_ID_QUERY_PARAM);
        }

        if (companyIdStr != null && !companyIdStr.isBlank()) {
            try {
                Long companyId = Long.parseLong(companyIdStr.trim());
                return chain.filter(exchange)
                        .contextWrite(Context.of(CONTEXT_COMPANY_ID_KEY, companyId));
            } catch (NumberFormatException ignored) {
                // Ignore invalid number format and proceed
            }
        }
        return chain.filter(exchange);
    }
}
