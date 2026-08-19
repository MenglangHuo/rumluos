package com.menglang.rumluos.configs;

import com.menglang.rumluos.common.model.BaseUuidEntity;
import com.menglang.rumluos.domain.finance.entity.Currency;
import com.menglang.rumluos.domain.finance.entity.SequenceRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.mapping.event.AfterConvertCallback;
import org.springframework.data.r2dbc.mapping.event.BeforeConvertCallback;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * R2DBC entity lifecycle callbacks.
 *
 * <p>Handles:
 * <ul>
 *   <li>UUID generation for {@link BaseUuidEntity} before first persist</li>
 *   <li>Marking non-Long-PK entities as "not new" after loading from DB</li>
 * </ul>
 *
 * <p>These callbacks replace JPA lifecycle annotations ({@code @PrePersist},
 * {@code @PostLoad}) which are not supported by R2DBC.
 */
@Configuration
public class EntityCallbackConfig {

    /**
     * Generates a UUID for new {@link BaseUuidEntity} instances before they
     * are converted for INSERT.
     */
    @Bean
    BeforeConvertCallback<BaseUuidEntity> uuidBeforeConvert() {
        return (entity, table) -> {
            if (entity.getId() == null) {
                entity.setId(UUID.randomUUID());
            }
            return Mono.just(entity);
        };
    }

    /**
     * After loading a {@link BaseUuidEntity} from the database,
     * marks it as already persisted so the next save does an UPDATE.
     */
    @Bean
    AfterConvertCallback<BaseUuidEntity> uuidAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }

    /**
     * After loading a {@link Currency} from the database,
     * marks it as already persisted (String PK is always non-null).
     */
    @Bean
    AfterConvertCallback<Currency> currencyAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }

    /**
     * After loading a {@link SequenceRegistry} from the database,
     * marks it as already persisted (String PK is always non-null).
     */
    @Bean
    AfterConvertCallback<SequenceRegistry> sequenceRegistryAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }
}
