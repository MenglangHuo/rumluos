package com.menglang.rumluos.domain.company.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Document attached to a customer (ID card, passport, etc.).
 */
@Table("customer_documents")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CustomerDocument extends BaseLongEntity {

    @Column("customer_id")
    private Long customerId;

    /** Document category: ID_CARD, PASSPORT, etc. */
    @Column("doc_type")
    private String docType;

    /** Cloud storage URL. */
    @Column("url")
    private String url;

    // ── Reserved fields ─────────────────────────────────────────

    /** Original file name. */
    @Column("file_name")
    private String fileName;

    /** MIME type, e.g. "application/pdf", "image/jpeg". */
    @Column("mime_type")
    private String mimeType;

    /** File size in bytes. */
    @Column("file_size")
    private Long fileSize;
}
