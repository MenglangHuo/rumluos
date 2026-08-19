package com.menglang.rumluos.common.enums;

/**
 * Lifecycle status of a product in the loan catalog.
 *
 * <ul>
 *   <li>{@code ACTIVE} — available for new loans</li>
 *   <li>{@code INACTIVE} — temporarily hidden from catalog</li>
 *   <li>{@code ON_LOAN} — currently used as collateral in an active loan</li>
 *   <li>{@code SOLD} — sold or disposed of</li>
 *   <li>{@code WRITTEN_OFF} — damaged, lost, or irrecoverable</li>
 * </ul>
 */
public enum ProductStatus {
    ACTIVE,
    INACTIVE,
    ON_LOAN,
    SOLD,
    WRITTEN_OFF
}
