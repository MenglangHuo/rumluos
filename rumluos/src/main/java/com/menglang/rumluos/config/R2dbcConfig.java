package com.menglang.rumluos.configs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.r2dbc.postgresql.codec.Json;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.domain.ReactiveAuditorAware;
import org.springframework.data.r2dbc.config.EnableR2dbcAuditing;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.dialect.PostgresDialect;
import org.springframework.data.r2dbc.mapping.R2dbcMappingContext;
import org.springframework.data.relational.core.mapping.NamingStrategy;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;

import java.util.ArrayList;
import java.util.List;

/**
 * R2DBC auditing, custom conversions, and mapping configuration.
 */
@Configuration
@EnableR2dbcAuditing
public class R2dbcConfig {

    @Bean
    public R2dbcCustomConversions r2dbcCustomConversions(ObjectMapper objectMapper) {
        List<Object> converters = new ArrayList<>();
        converters.add(new JsonToJsonNodeConverter(objectMapper));
        converters.add(new StringToJsonNodeConverter(objectMapper));
        converters.add(new JsonNodeToJsonConverter());
        converters.add(new JsonNodeToStringConverter());
        return R2dbcCustomConversions.of(PostgresDialect.INSTANCE, converters);
    }

    @Bean
    public R2dbcMappingContext r2dbcMappingContext(R2dbcCustomConversions r2dbcCustomConversions) {
        R2dbcMappingContext context = new R2dbcMappingContext(new NamingStrategy() {});
        context.setForceQuote(true);
        context.setSimpleTypeHolder(r2dbcCustomConversions.getSimpleTypeHolder());
        return context;
    }

    @Bean
    public ReactiveAuditorAware<String> auditorAware() {
        return () -> ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication().getName())
                .defaultIfEmpty("SYSTEM");
    }

    @ReadingConverter
    public static class JsonToJsonNodeConverter implements Converter<Json, JsonNode> {
        private final ObjectMapper objectMapper;

        public JsonToJsonNodeConverter(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }

        @Override
        public JsonNode convert(Json source) {
            if (source == null) {
                return null;
            }
            try {
                return objectMapper.readTree(source.asString());
            } catch (Exception e) {
                throw new IllegalArgumentException("Error converting Json to JsonNode", e);
            }
        }
    }

    @ReadingConverter
    public static class StringToJsonNodeConverter implements Converter<String, JsonNode> {
        private final ObjectMapper objectMapper;

        public StringToJsonNodeConverter(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }

        @Override
        public JsonNode convert(String source) {
            if (source == null || source.isBlank()) {
                return null;
            }
            try {
                return objectMapper.readTree(source);
            } catch (Exception e) {
                throw new IllegalArgumentException("Error converting String to JsonNode", e);
            }
        }
    }

    @WritingConverter
    public static class JsonNodeToJsonConverter implements Converter<JsonNode, Json> {
        @Override
        public Json convert(JsonNode source) {
            if (source == null) {
                return null;
            }
            return Json.of(source.toString());
        }
    }

    @WritingConverter
    public static class JsonNodeToStringConverter implements Converter<JsonNode, String> {
        @Override
        public String convert(JsonNode source) {
            if (source == null) {
                return null;
            }
            return source.toString();
        }
    }
}
