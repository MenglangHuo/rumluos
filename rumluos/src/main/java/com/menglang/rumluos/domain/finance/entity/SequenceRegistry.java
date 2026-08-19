package com.menglang.rumluos.domain.finance.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.io.Serializable;
import java.time.Instant;

/**
 * Registry tracking named sequences used for human-readable reference numbers.
 *
 * <p>IMPORTANT: Do NOT use this table for concurrent number generation —
 * it will deadlock under load. Instead, use native PostgreSQL sequences.
 *
 * <p>This table is used ONLY as a metadata registry (what sequences exist,
 * their prefix, format pattern) — not for actual number generation.
 *
 * <p>Does NOT extend BaseEntity — it's a lightweight config table
 * without full audit trail.
 */
@Table("sequence_registry")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class SequenceRegistry implements Persistable<String>, Serializable {

    @Id
    @Column("seq_name")
    private String seqName;

    @Column("current_value")
    private long currentValue;

    @Column("increment_by")
    private int incrementBy = 1;

    /** Short prefix for reference numbers, e.g. "INV". */
    @Column("prefix")
    private String prefix;

    /** Format pattern string, e.g. "INV-{YYYY}-{SEQ6}". */
    @Column("format_pattern")
    private String formatPattern;

    @LastModifiedDate
    @Column("updated_at")
    private Instant updatedAt;

    @Transient
    private boolean isNewFlag = true;

    @Override
    public String getId() {
        return this.seqName;
    }

    @Override
    public boolean isNew() {
        return this.isNewFlag;
    }

    /** Marks this entity as already persisted. */
    public void markPersisted() {
        this.isNewFlag = false;
    }
}