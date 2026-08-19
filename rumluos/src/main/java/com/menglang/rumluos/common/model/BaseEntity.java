package com.menglang.rumluos.common.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;

import java.io.Serializable;
import java.time.Instant;

/**
 * Abstract base entity for all domain entities in the system.
 *
 * <p>Designed for Spring Data R2DBC — does NOT use JPA annotations.
 * Auditing is handled by {@code @EnableR2dbcAuditing} + {@code ReactiveAuditorAware<String>}.
 *
 * <p>Provides:
 * <ul>
 *   <li>Audit trail: createdAt/createdBy, updatedAt/updatedBy</li>
 *   <li>Soft delete: deletedAt/deletedBy</li>
 * </ul>
 *
 * <p>Subclasses must implement {@link #getId()} to return their primary key.
 *
 * @param <T> the primary key type (e.g. Long, UUID, String)
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseEntity<T extends Serializable> implements Serializable {

    @CreatedDate
    @Column("created_at")
    private Instant createdAt;

    @CreatedBy
    @Column("created_by")
    private String createdBy;

    @LastModifiedDate
    @Column("updated_at")
    private Instant updatedAt;

    @LastModifiedBy
    @Column("updated_by")
    private String updatedBy;

    @Column("deleted_at")
    private Instant deletedAt;

    @Column("deleted_by")
    private String deletedBy;

    /**
     * Returns the primary key of this entity.
     */
    public abstract T getId();

    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Marks this entity as soft-deleted.
     *
     * @param actor the username/ID of the person performing the delete
     */
    public void softDelete(String actor) {
        this.deletedAt = Instant.now();
        this.deletedBy = actor;
    }

    /**
     * Restores a soft-deleted entity.
     */
    public void restore() {
        this.deletedAt = null;
        this.deletedBy = null;
    }
}
