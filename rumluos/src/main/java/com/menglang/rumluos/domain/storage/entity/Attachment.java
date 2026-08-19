package com.menglang.rumluos.domain.storage.entity;

import com.menglang.rumluos.common.model.BaseLongEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Company attachment / shared file repository entity.
 */
@Table("attachments")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment extends BaseLongEntity {

    @Column("company_id")
    private Long companyId;

    @Column("branch_id")
    private Long branchId;

    @Column("file_name")
    private String fileName;

    @Column("file_key")
    private String fileKey;

    @Column("file_url")
    private String fileUrl;

    @Column("mime_type")
    private String mimeType;

    @Column("file_size")
    private Long fileSize;

    @Column("category")
    private String category;

    @Column("description")
    private String description;

    @Column("uploaded_by_user_id")
    private Long uploadedByUserId;

    @Column("is_public")
    private Boolean isPublic;

    @Column("is_active")
    private Boolean isActive;
}
