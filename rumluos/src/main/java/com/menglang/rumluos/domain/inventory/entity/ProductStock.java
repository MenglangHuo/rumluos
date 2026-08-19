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

@Table("product_stocks")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
public class ProductStock extends BaseTenantEntity {
    private Long branchId;
    private Long productId;
    private Integer quantityAvailable;
}
