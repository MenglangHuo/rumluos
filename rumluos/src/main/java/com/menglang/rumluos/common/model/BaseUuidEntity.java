package com.menglang.rumluos.common.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;

import java.util.UUID;

/**
 * Base entity with a UUID primary key.
 *
 * <p>UUID is generated application-side via {@code BeforeConvertCallback}
 * (see {@code EntityCallbackConfig}). Since the ID is never null after
 * construction, we use an explicit {@code isNewFlag} tracked via
 * {@code @Transient} to distinguish INSERT from UPDATE.
 *
 * <p>The flag is set to {@code false} by {@code AfterConvertCallback}
 * when the entity is loaded from the database.
 */
@Getter
@Setter
public abstract class BaseUuidEntity extends BaseEntity<UUID> implements Persistable<UUID> {

    @Id
    private UUID id;

    @Transient
    private boolean isNewFlag = true;

    @Override
    public boolean isNew() {
        return this.isNewFlag;
    }

    /**
     * Marks this entity as already persisted.
     * Called by {@code AfterConvertCallback} after loading from DB.
     */
    public void markPersisted() {
        this.isNewFlag = false;
    }
}