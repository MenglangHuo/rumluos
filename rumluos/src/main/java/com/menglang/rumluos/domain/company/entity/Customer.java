package com.menglang.rumluos.domain.company.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;

/**
 * Customer / borrower profile.
 */
@Table("customers")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Customer extends BaseTenantEntity {

    @Column("branch_id")
    private Long branchId;

    @Column("name")
    private String name;

    @Column("industry")
    private String industry;

    @Column("customer_group")
    private String customerGroup;

    @Column("phone")
    private String phone;

    @Column("address")
    private String address;

    @Column("occupation")
    private String occupation;

    @Column("image_url")
    private String imageUrl;

    /** ISO 4217 code. FK to currencies.code. */
    @Column("preferred_currency")
    private String preferredCurrency = "USD";

    @Column("is_active")
    private boolean isActive = true;

    // ── Reserved fields ─────────────────────────────────────────

    @Column("email")
    private String email;

    @Column("date_of_birth")
    private LocalDate dateOfBirth;

    @Column("gender")
    private String gender;

    @Column("national_id")
    private String nationalId;
}