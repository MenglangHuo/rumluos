package com.menglang.rumluos.common.enums;

/**
 * Lifecycle states for a Loan and its schedule rows.
 *
 * <p>State machine:
 * <pre>
 *   PENDING → APPROVED → ACTIVE → COMPLETED
 *                               → DEFAULTED
 *           → CANCELLED  (before disbursement / before approval)
 * </pre>
 *
 * <p>Stored as VARCHAR in the database — never as an integer ordinal —
 * so adding new states doesn't corrupt existing rows.
 */
public enum LoanStatus {

    /** Loan application submitted, awaiting officer review. */
    PENDING,

    /** Loan reviewed and approved by an officer; ready for disbursement. */
    APPROVED,

    /** Loan disbursed and repayment schedule is running. */
    ACTIVE,

    /** All scheduled payments received — loan closed successfully. */
    COMPLETED,

    /** Borrower failed to repay; legal/collection action may follow. */
    DEFAULTED,

    /** Cancelled before disbursement or before approval. */
    CANCELLED
}
