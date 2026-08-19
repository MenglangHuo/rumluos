package com.menglang.rumluos.common.enums;

/**
 * Calculations methods/strategies for interest amortization.
 */
public enum InterestMethod {
    /** Equated Monthly Installment (declining balance with equal total payment). */
    EMI,

    /** Flat rate interest (equal principal and flat interest portions). */
    FLAT,

    /** Equal principal with declining interest payments. */
    EQUAL_PRINCIPAL
}
