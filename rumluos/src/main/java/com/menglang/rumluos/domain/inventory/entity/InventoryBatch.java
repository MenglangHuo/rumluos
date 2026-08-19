package com.menglang.rumluos.domain.inventory.entity;

import com.menglang.rumluos.common.model.BaseTenantEntity;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Table("inventory_batches")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class InventoryBatch extends BaseTenantEntity {
    private Long branchId;
    private Long productId;
    private BigDecimal unitCost;
    private Integer originalQuantity;
    private Integer remainingQuantity;
    private Instant receivedAt;
    private String supplierName;
    private String status; // ACTIVE, DEPLETED
}
