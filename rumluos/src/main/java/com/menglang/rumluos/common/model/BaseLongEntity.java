package com.menglang.rumluos.common.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Persistable;

/**
 * Base entity with a database-generated {@code BIGSERIAL} primary key.
 *
 * <p>Implements {@link Persistable} so Spring Data R2DBC can distinguish
 * INSERT (id is null) from UPDATE (id is non-null).
 *
 * <p>Most domain entities extend this class.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public abstract class BaseLongEntity extends BaseEntity<Long> implements Persistable<Long> {

    @Id
    private Long id;

    /**
     * Returns {@code true} when the entity has not yet been persisted
     * (i.e. the database has not assigned an ID).
     */
    @Override
    public boolean isNew() {
        return this.id == null;
    }
}
