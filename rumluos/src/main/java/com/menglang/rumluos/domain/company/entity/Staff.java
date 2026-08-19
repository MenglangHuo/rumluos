package com.menglang.rumluos.domain.company.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Staff profile linked 1:1 to a User account.
 */
@Table("staffs")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Staff extends BaseTenantEntity {

    /** FK to users.id — load User separately, do not embed. */
    @Column("user_id")
    private Long userId;

    @Column("branch_id")
    private Long branchId;

    @Column("name")
    private String name;

    @Column("phone")
    private String phone;

    @Column("description")
    private String description;

    @Column("is_active")
    private boolean isActive = true;

    // ── Reserved fields ─────────────────────────────────────────

    @Column("email")
    private String email;

    @Column("position")
    private String position;

    @Column("salary")
    private java.math.BigDecimal salary;

    @Column("urgent_contact_name")
    private String urgentContactName;

    @Column("urgent_contact_phone")
    private String urgentContactPhone;
}