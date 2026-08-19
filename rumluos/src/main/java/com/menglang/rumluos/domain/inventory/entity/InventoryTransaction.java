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

@Table("inventory_transactions")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class InventoryTransaction extends BaseTenantEntity {
    private Long branchId;
    private Long productId;
    private Long batchId;
    private String transactionType; // STOCK_IN, SALE, RETURN, TRANSFER, ADJUSTMENT
    private Integer quantityChange;
    private BigDecimal unitCost;
    private String referenceType;
    private Long referenceId;
}
