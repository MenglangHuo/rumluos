package com.menglang.rumluos.common.enums;

/**
 * Repayment frequency for a loan.
 *
 * <p>Determines how loan_schedules rows are generated:
 * <ul>
 *   <li>DAILY — one row per day between start_date and end_date</li>
 *   <li>WEEKLY — one row per week</li>
 *   <li>MONTHLY — one row per month</li>
 * </ul>
 */
public enum LoanTerm {
    DAILY,
    WEEKLY,
    MONTHLY;

    public static LoanTerm parseTerm(String termStr) {
        if (termStr == null) return MONTHLY;
        String upper = termStr.toUpperCase();
        if (upper.contains("DAILY") || upper.contains("DAY")) return DAILY;
        if (upper.contains("WEEKLY") || upper.contains("WEEK")) return WEEKLY;
        if (upper.contains("MONTHLY") || upper.contains("MONTH")) return MONTHLY;
        try {
            return LoanTerm.valueOf(upper.trim());
        } catch (Exception e) {
            return MONTHLY;
        }
    }
}

