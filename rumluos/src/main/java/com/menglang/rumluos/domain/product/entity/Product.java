package com.menglang.rumluos.domain.product.entity;

import com.fasterxml.jackson.databind.JsonNode;
import com.menglang.rumluos.common.model.BaseTenantEntity;
import com.menglang.rumluos.common.enums.ProductCondition;
import com.menglang.rumluos.common.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

/**
 * Catalog item that can be financed through a loan.
 *
 * <p>Examples: Moto, Phone, Car, House, Laptop, Gold Jewelry.
 *
 * <p>Key design decisions for a <strong>loan application</strong>:
 * <ul>
 *   <li>No SKU/barcode system — products are individual financeable items,
 *       not shelf inventory.</li>
 *   <li>No variants — each product is a single item (use {@code serialNumber}
 *       to distinguish identical models).</li>
 *   <li>No stock tracking — products aren't warehouse inventory.</li>
 *   <li>Flexible attributes via PostgreSQL JSONB — different categories
 *       (Moto, Car, House) have different attributes without schema changes.</li>
 *   <li>{@code basePrice} = market/purchase price;
 *       {@code sellPrice} = price the company finances at.</li>
 * </ul>
 *
 * <p>JSONB {@code attributes} examples per category:
 * <pre>
 * Moto:  {"engine_cc": 125, "fuel_type": "gasoline", "mileage_km": 5000, "color": "red"}
 * Phone: {"storage_gb": 128, "ram_gb": 6, "screen_size": 6.1, "color": "black"}
 * Car:   {"engine_cc": 1500, "seats": 5, "transmission": "automatic"}
 * House: {"area_sqm": 120, "bedrooms": 3, "bathrooms": 2, "land_sqm": 200}
 * </pre>
 */
@Table("products")
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Product extends BaseTenantEntity {

    /** FK to brands.id. Nullable (not all products have a brand). */
    @Column("brand_id")
    private Long brandId;

    /** FK to categories.id. Determines which JSONB attributes are expected. */
    @Column("category_id")
    private Long categoryId;

    /** Human-readable name, e.g. "Honda Dream 2020" or "iPhone 15 Pro". */
    @Column("name")
    private String name;

    /** Model name/number, e.g. "Wave 125i", "iPhone 15", "Camry 2.5". */
    @Column("model")
    private String model;

    /**
     * Unique identifier for the physical item.
     * VIN (vehicles), IMEI (phones), chassis number, land title number, etc.
     */
    @Column("serial_number")
    private String serialNumber;

    /** Manufacturing or model year. */
    @Column("year")
    private Short year;

    /** Physical condition. Stored as VARCHAR via ProductCondition.name(). */
    @Column("condition")
    @Builder.Default
    private String condition = ProductCondition.USED.name();

    /** Market or purchase price. */
    @Column("base_price")
    private BigDecimal basePrice;

    /** Price the company sells/finances at. */
    @Column("sell_price")
    private BigDecimal sellPrice;

    /** ISO 4217 currency code. FK to currencies.code. */
    @Column("currency")
    private String currency;

    @Column("description")
    private String description;

    /** Primary image URL for the product. */
    @Column("image_url")
    private String imageUrl;

    /**
     * Flexible key-value attributes stored as PostgreSQL JSONB.
     * Schema depends on category — see class Javadoc for examples.
     */
    @Column("attributes")
    private JsonNode attributes;

    /** Lifecycle status. Stored as VARCHAR via ProductStatus.name(). */
    @Column("status")
    @Builder.Default
    private String status = ProductStatus.ACTIVE.name();

    @Column("is_active")
    @Builder.Default
    private boolean isActive = true;

    /** Internal notes (not shown to customer). */
    @Column("notes")
    private String notes;
}
