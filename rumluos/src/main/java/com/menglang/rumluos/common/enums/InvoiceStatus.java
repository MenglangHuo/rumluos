package com.menglang.rumluos.common.enums;

/**
 * Invoice lifecycle status.
 *
 * <p>State machine:
 * <pre>
 *   DRAFT → SENT → PARTIALLY_PAID → PAID
 *                → VOID (cancelled before payment)
 * </pre>
 */
public enum InvoiceStatus {
    DRAFT,
    SENT,
    PARTIALLY_PAID,
    PAID,
    OVERDUE,
    VOID
}
