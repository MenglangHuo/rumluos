package com.menglang.rumluos.configs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.r2dbc.postgresql.codec.Json;
import org.junit.jupiter.api.Test;
import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;

import static org.junit.jupiter.api.Assertions.*;

class R2dbcConfigTest {

    @Test
    void testJsonToJsonNodeConversion() {
        ObjectMapper objectMapper = new ObjectMapper();
        R2dbcConfig config = new R2dbcConfig();
        R2dbcCustomConversions customConversions = config.r2dbcCustomConversions(objectMapper);

        DefaultConversionService conversionService = new DefaultConversionService();
        customConversions.registerConvertersIn(conversionService);

        Json json = Json.of("{\"key\":\"value\"}");
        assertTrue(conversionService.canConvert(json.getClass(), JsonNode.class));

        JsonNode result = conversionService.convert(json, JsonNode.class);
        assertNotNull(result);
        assertEquals("value", result.get("key").asText());
    }
}
