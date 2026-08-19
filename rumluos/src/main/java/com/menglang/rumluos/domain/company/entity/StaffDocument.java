package com.menglang.rumluos.domain.company.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Document attached to a staff (ID card, contract, etc.).
 */
@Table("staff_documents")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class StaffDocument extends BaseLongEntity {

    @Column("staff_id")
    private Long staffId;

    /** Document category: ID_CARD, PASSPORT, CONTRACT, etc. */
    @Column("doc_type")
    private String docType;

    /** Cloud storage URL. */
    @Column("url")
    private String url;

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
