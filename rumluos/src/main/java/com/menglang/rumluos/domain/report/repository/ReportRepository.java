package com.menglang.rumluos.domain.report.repository;

import com.menglang.rumluos.domain.report.dto.*;
import io.r2dbc.spi.Row;
import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Repository
@RequiredArgsConstructor
public class ReportRepository {

    private final DatabaseClient databaseClient;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Dashboard Summary KPI
    // ─────────────────────────────────────────────────────────────────────────
    public Mono<DashboardSummaryDto> getDashboardSummary(Long companyId, Long branchId) {
        StringBuilder sql = new StringBuilder("""
            WITH loan_stats AS (
                SELECT 
                    COUNT(*) AS total_loans,
                    COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_loans,
                    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_loans,
                    COUNT(*) FILTER (WHERE status = 'DEFAULTED') AS defaulted_loans,
                    COUNT(*) FILTER (WHERE status = 'ACTIVE' AND days_in_arrears > 0) AS overdue_loans,
                    COALESCE(SUM(principal) FILTER (WHERE status IN ('ACTIVE', 'COMPLETED')), 0) AS total_disbursed
                FROM loans
                WHERE company_id = :companyId AND deleted_at IS NULL
            """);

        if (branchId != null) {
            sql.append(" AND branch_id = :branchId ");
        }

        sql.append("""
            ),
            schedule_stats AS (
                SELECT
                    COALESCE(SUM(GREATEST(0, (s.principal_due + s.interest_due) - COALESCE(s.paid_amount, 0))) 
                             FILTER (WHERE s.status IN ('PENDING', 'ACTIVE', 'PARTIALLY_PAID')), 0) AS total_outstanding,
                    COALESCE(SUM(GREATEST(0, (s.principal_due + s.interest_due) - COALESCE(s.paid_amount, 0))) 
                             FILTER (WHERE s.due_date < CURRENT_DATE AND s.status IN ('PENDING', 'ACTIVE', 'PARTIALLY_PAID')), 0) AS total_overdue_amount
                FROM loan_schedules s
                JOIN loans l ON s.loan_id = l.id
                WHERE l.company_id = :companyId AND l.deleted_at IS NULL AND s.deleted_at IS NULL AND l.status = 'ACTIVE'
            """);

        if (branchId != null) {
            sql.append(" AND l.branch_id = :branchId ");
        }

        sql.append("""
            ),
            payment_stats AS (
                SELECT 
                    COALESCE(SUM(amount_paid), 0) AS total_collected
                FROM payments
                WHERE company_id = :companyId AND status = 'COMPLETED' AND deleted_at IS NULL
            """);

        if (branchId != null) {
            sql.append(" AND branch_id = :branchId ");
        }

        sql.append("""
            ),
            customer_stats AS (
                SELECT COUNT(*) AS total_customers
                FROM customers
                WHERE company_id = :companyId AND deleted_at IS NULL
            """);

        if (branchId != null) {
            sql.append(" AND branch_id = :branchId ");
        }

        sql.append("""
            ),
            product_stats AS (
                SELECT COUNT(*) AS total_products
                FROM products
                WHERE company_id = :companyId AND deleted_at IS NULL
            )
            SELECT 
                ls.total_loans, ls.active_loans, ls.completed_loans, ls.defaulted_loans, ls.overdue_loans, ls.total_disbursed,
                ss.total_outstanding, ss.total_overdue_amount,
                ps.total_collected,
                cs.total_customers,
                prs.total_products
            FROM loan_stats ls, schedule_stats ss, payment_stats ps, customer_stats cs, product_stats prs
            """);

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }

        return spec.map((row, meta) -> DashboardSummaryDto.builder()
                .totalLoans(getLongOrZero(row, "total_loans"))
                .activeLoans(getLongOrZero(row, "active_loans"))
                .completedLoans(getLongOrZero(row, "completed_loans"))
                .defaultedLoans(getLongOrZero(row, "defaulted_loans"))
                .overdueLoans(getLongOrZero(row, "overdue_loans"))
                .totalDisbursed(getBigDecimal(row, "total_disbursed"))
                .totalOutstanding(getBigDecimal(row, "total_outstanding"))
                .totalCollected(getBigDecimal(row, "total_collected"))
                .totalOverdueAmount(getBigDecimal(row, "total_overdue_amount"))
                .totalCustomers(getLongOrZero(row, "total_customers"))
                .totalProducts(getLongOrZero(row, "total_products"))
                .build()
        ).one();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Loan Portfolio Report
    // ─────────────────────────────────────────────────────────────────────────
    public Flux<LoanPortfolioRow> getLoanPortfolio(Long companyId, Long branchId, String status, int limit, int offset) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                l.id AS loan_id,
                l.loan_key,
                l.customer_id,
                c.name AS customer_name,
                c.phone AS customer_phone,
                l.branch_id,
                b.name AS branch_name,
                l.loan_officer_id,
                st.name AS loan_officer_name,
                l.currency,
                l.principal,
                l.total_interest,
                l.deposit,
                COALESCE(
                    (SELECT SUM(GREATEST(0, (s.principal_due + s.interest_due) - COALESCE(s.paid_amount, 0)))
                     FROM loan_schedules s 
                     WHERE s.loan_id = l.id AND s.deleted_at IS NULL AND s.status IN ('PENDING', 'ACTIVE', 'PARTIALLY_PAID')),
                    0
                ) AS outstanding_balance,
                l.status,
                l.days_in_arrears,
                l.interest_method,
                l.term,
                l.number_of_periods,
                l.start_date,
                l.end_date
            FROM loans l
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN branches b ON l.branch_id = b.id
            LEFT JOIN staffs st ON l.loan_officer_id = st.id
            WHERE l.company_id = :companyId AND l.deleted_at IS NULL
            """);

        if (branchId != null) {
            sql.append(" AND l.branch_id = :branchId ");
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND l.status = :status ");
        }

        sql.append(" ORDER BY l.created_at DESC LIMIT :limit OFFSET :offset ");

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId)
                .bind("limit", limit)
                .bind("offset", offset);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }
        if (status != null && !status.isBlank()) {
            spec = spec.bind("status", status);
        }

        return spec.map((row, meta) -> LoanPortfolioRow.builder()
                .loanId(getLong(row, "loan_id"))
                .loanKey(getString(row, "loan_key"))
                .customerId(getLong(row, "customer_id"))
                .customerName(getString(row, "customer_name"))
                .customerPhone(getString(row, "customer_phone"))
                .branchId(getLong(row, "branch_id"))
                .branchName(getString(row, "branch_name"))
                .loanOfficerId(getLong(row, "loan_officer_id"))
                .loanOfficerName(getString(row, "loan_officer_name"))
                .currency(getString(row, "currency"))
                .principal(getBigDecimal(row, "principal"))
                .totalInterest(getBigDecimal(row, "total_interest"))
                .deposit(getBigDecimal(row, "deposit"))
                .outstandingBalance(getBigDecimal(row, "outstanding_balance"))
                .status(getString(row, "status"))
                .daysInArrears(getInteger(row, "days_in_arrears"))
                .interestMethod(getString(row, "interest_method"))
                .term(getString(row, "term"))
                .numberOfPeriods(getInteger(row, "number_of_periods"))
                .startDate(getLocalDate(row, "start_date"))
                .endDate(getLocalDate(row, "end_date"))
                .build()
        ).all();
    }

    public Mono<Long> countLoanPortfolio(Long companyId, Long branchId, String status) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) AS total FROM loans WHERE company_id = :companyId AND deleted_at IS NULL ");

        if (branchId != null) {
            sql.append(" AND branch_id = :branchId ");
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND status = :status ");
        }

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }
        if (status != null && !status.isBlank()) {
            spec = spec.bind("status", status);
        }

        return spec.map((row, meta) -> getLongOrZero(row, "total")).one();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Collection Report
    // ─────────────────────────────────────────────────────────────────────────
    public Flux<CollectionSummaryRow> getCollections(Long companyId, Long branchId, String paymentMethod, LocalDate startDate, LocalDate endDate) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                p.id AS payment_id,
                p.payment_ref,
                p.payment_date,
                p.amount_paid,
                p.payment_currency,
                p.penalty_amount,
                p.payment_method,
                p.status,
                p.customer_id,
                c.name AS customer_name,
                l.id AS loan_id,
                l.loan_key,
                p.branch_id,
                b.name AS branch_name,
                p.collected_by_staff_id,
                st.name AS collected_by_staff_name,
                p.notes
            FROM payments p
            LEFT JOIN customers c ON p.customer_id = c.id
            LEFT JOIN loan_schedules ls ON p.loan_schedule_id = ls.id
            LEFT JOIN loans l ON ls.loan_id = l.id
            LEFT JOIN branches b ON p.branch_id = b.id
            LEFT JOIN staffs st ON p.collected_by_staff_id = st.id
            WHERE p.company_id = :companyId 
              AND p.deleted_at IS NULL
              AND p.payment_date BETWEEN :startDate AND :endDate
            """);

        if (branchId != null) {
            sql.append(" AND p.branch_id = :branchId ");
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            sql.append(" AND p.payment_method = :paymentMethod ");
        }

        sql.append(" ORDER BY p.payment_date DESC, p.created_at DESC ");

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId)
                .bind("startDate", startDate)
                .bind("endDate", endDate);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            spec = spec.bind("paymentMethod", paymentMethod);
        }

        return spec.map((row, meta) -> CollectionSummaryRow.builder()
                .paymentId(getLong(row, "payment_id"))
                .paymentRef(getString(row, "payment_ref"))
                .paymentDate(getLocalDate(row, "payment_date"))
                .amountPaid(getBigDecimal(row, "amount_paid"))
                .paymentCurrency(getString(row, "payment_currency"))
                .penaltyAmount(getBigDecimal(row, "penalty_amount"))
                .paymentMethod(getString(row, "payment_method"))
                .status(getString(row, "status"))
                .customerId(getLong(row, "customer_id"))
                .customerName(getString(row, "customer_name"))
                .loanId(getLong(row, "loan_id"))
                .loanKey(getString(row, "loan_key"))
                .branchId(getLong(row, "branch_id"))
                .branchName(getString(row, "branch_name"))
                .collectedByStaffId(getLong(row, "collected_by_staff_id"))
                .collectedByStaffName(getString(row, "collected_by_staff_name"))
                .notes(getString(row, "notes"))
                .build()
        ).all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Overdue / Arrears Report
    // ─────────────────────────────────────────────────────────────────────────
    public Flux<OverdueScheduleRow> getOverdueSchedules(Long companyId, Long branchId) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                s.id AS schedule_id,
                s.loan_id,
                l.loan_key,
                l.customer_id,
                c.name AS customer_name,
                c.phone AS customer_phone,
                l.branch_id,
                b.name AS branch_name,
                s.period_number,
                s.due_date,
                s.principal_due,
                s.interest_due,
                (s.principal_due + s.interest_due) AS total_due,
                COALESCE(s.paid_amount, 0) AS paid_amount,
                ((s.principal_due + s.interest_due) - COALESCE(s.paid_amount, 0)) AS remaining_due,
                (CURRENT_DATE - s.due_date) AS days_overdue,
                s.status,
                l.currency
            FROM loan_schedules s
            JOIN loans l ON s.loan_id = l.id
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN branches b ON l.branch_id = b.id
            WHERE l.company_id = :companyId
              AND l.deleted_at IS NULL
              AND s.deleted_at IS NULL
              AND l.status = 'ACTIVE'
              AND s.status IN ('PENDING', 'ACTIVE', 'PARTIALLY_PAID')
              AND s.due_date < CURRENT_DATE
            """);

        if (branchId != null) {
            sql.append(" AND l.branch_id = :branchId ");
        }

        sql.append(" ORDER BY s.due_date ASC ");

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }

        return spec.map((row, meta) -> OverdueScheduleRow.builder()
                .scheduleId(getLong(row, "schedule_id"))
                .loanId(getLong(row, "loan_id"))
                .loanKey(getString(row, "loan_key"))
                .customerId(getLong(row, "customer_id"))
                .customerName(getString(row, "customer_name"))
                .customerPhone(getString(row, "customer_phone"))
                .branchId(getLong(row, "branch_id"))
                .branchName(getString(row, "branch_name"))
                .periodNumber(getShort(row, "period_number"))
                .dueDate(getLocalDate(row, "due_date"))
                .principalDue(getBigDecimal(row, "principal_due"))
                .interestDue(getBigDecimal(row, "interest_due"))
                .totalDue(getBigDecimal(row, "total_due"))
                .paidAmount(getBigDecimal(row, "paid_amount"))
                .remainingDue(getBigDecimal(row, "remaining_due"))
                .daysOverdue(getInteger(row, "days_overdue"))
                .status(getString(row, "status"))
                .currency(getString(row, "currency"))
                .build()
        ).all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Disbursement Report
    // ─────────────────────────────────────────────────────────────────────────
    public Flux<DisbursementRow> getDisbursements(Long companyId, Long branchId, LocalDate startDate, LocalDate endDate) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                l.id AS loan_id,
                l.loan_key,
                l.customer_id,
                c.name AS customer_name,
                c.phone AS customer_phone,
                l.branch_id,
                b.name AS branch_name,
                l.loan_officer_id,
                st.name AS loan_officer_name,
                l.principal,
                l.deposit,
                l.currency,
                l.interest_method,
                l.term,
                l.number_of_periods,
                l.interest_rate_bps,
                l.disbursed_at,
                l.start_date,
                l.end_date,
                l.status
            FROM loans l
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN branches b ON l.branch_id = b.id
            LEFT JOIN staffs st ON l.loan_officer_id = st.id
            WHERE l.company_id = :companyId
              AND l.deleted_at IS NULL
              AND l.disbursed_at IS NOT NULL
              AND CAST(l.disbursed_at AS DATE) BETWEEN :startDate AND :endDate
            """);

        if (branchId != null) {
            sql.append(" AND l.branch_id = :branchId ");
        }

        sql.append(" ORDER BY l.disbursed_at DESC ");

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId)
                .bind("startDate", startDate)
                .bind("endDate", endDate);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }

        return spec.map((row, meta) -> DisbursementRow.builder()
                .loanId(getLong(row, "loan_id"))
                .loanKey(getString(row, "loan_key"))
                .customerId(getLong(row, "customer_id"))
                .customerName(getString(row, "customer_name"))
                .customerPhone(getString(row, "customer_phone"))
                .branchId(getLong(row, "branch_id"))
                .branchName(getString(row, "branch_name"))
                .loanOfficerId(getLong(row, "loan_officer_id"))
                .loanOfficerName(getString(row, "loan_officer_name"))
                .principal(getBigDecimal(row, "principal"))
                .deposit(getBigDecimal(row, "deposit"))
                .currency(getString(row, "currency"))
                .interestMethod(getString(row, "interest_method"))
                .term(getString(row, "term"))
                .numberOfPeriods(getInteger(row, "number_of_periods"))
                .interestRateBps(getShort(row, "interest_rate_bps"))
                .disbursedAt(getInstant(row, "disbursed_at"))
                .startDate(getLocalDate(row, "start_date"))
                .endDate(getLocalDate(row, "end_date"))
                .status(getString(row, "status"))
                .build()
        ).all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Income vs Expense Summary
    // ─────────────────────────────────────────────────────────────────────────
    public Flux<IncomeExpenseSummaryRow> getIncomeExpenseSummary(Long companyId, LocalDate startDate, LocalDate endDate) {
        String sql = """
            SELECT 
                c.id AS category_id,
                c.title AS category_title,
                le.entry_type,
                le.currency,
                COALESCE(SUM(le.amount), 0) AS total_amount,
                COUNT(le.id) AS transaction_count
            FROM ledger_entries le
            JOIN income_expense_categories c ON le.category_id = c.id
            WHERE le.company_id = :companyId
              AND le.deleted_at IS NULL
              AND le.entry_date BETWEEN :startDate AND :endDate
            GROUP BY c.id, c.title, le.entry_type, le.currency
            ORDER BY le.entry_type ASC, total_amount DESC
            """;

        return databaseClient.sql(sql)
                .bind("companyId", companyId)
                .bind("startDate", startDate)
                .bind("endDate", endDate)
                .map((row, meta) -> IncomeExpenseSummaryRow.builder()
                        .categoryId(getLong(row, "category_id"))
                        .categoryTitle(getString(row, "category_title"))
                        .entryType(getString(row, "entry_type"))
                        .currency(getString(row, "currency"))
                        .totalAmount(getBigDecimal(row, "total_amount"))
                        .transactionCount(getLongOrZero(row, "transaction_count"))
                        .build()
                ).all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Inventory Valuation Report
    // ─────────────────────────────────────────────────────────────────────────
    public Flux<InventoryValuationRow> getInventoryValuation(Long companyId, Long branchId) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                p.id AS product_id,
                p.name AS product_name,
                p.model AS product_model,
                p.serial_number,
                p.condition,
                ps.branch_id,
                b.name AS branch_name,
                ps.quantity_available,
                p.sell_price AS unit_price,
                (ps.quantity_available * COALESCE(p.sell_price, 0)) AS estimated_value,
                p.currency
            FROM product_stocks ps
            JOIN products p ON ps.product_id = p.id
            LEFT JOIN branches b ON ps.branch_id = b.id
            WHERE ps.company_id = :companyId
              AND ps.deleted_at IS NULL
              AND p.deleted_at IS NULL
            """);

        if (branchId != null) {
            sql.append(" AND ps.branch_id = :branchId ");
        }

        sql.append(" ORDER BY ps.quantity_available DESC ");

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }

        return spec.map((row, meta) -> InventoryValuationRow.builder()
                .productId(getLong(row, "product_id"))
                .productName(getString(row, "product_name"))
                .productModel(getString(row, "product_model"))
                .serialNumber(getString(row, "serial_number"))
                .condition(getString(row, "condition"))
                .branchId(getLong(row, "branch_id"))
                .branchName(getString(row, "branch_name"))
                .quantityAvailable(getInteger(row, "quantity_available"))
                .unitPrice(getBigDecimal(row, "unit_price"))
                .estimatedValue(getBigDecimal(row, "estimated_value"))
                .currency(getString(row, "currency"))
                .build()
        ).all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Loan Officer Performance Report
    // ─────────────────────────────────────────────────────────────────────────
    public Flux<LoanOfficerPerformanceRow> getLoanOfficerPerformance(Long companyId, Long branchId) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                st.id AS officer_id,
                st.name AS officer_name,
                st.email AS officer_email,
                st.branch_id,
                b.name AS branch_name,
                COUNT(l.id) AS total_loans,
                COUNT(l.id) FILTER (WHERE l.status = 'ACTIVE') AS active_loans,
                COUNT(l.id) FILTER (WHERE l.status = 'COMPLETED') AS completed_loans,
                COUNT(l.id) FILTER (WHERE l.status = 'DEFAULTED') AS defaulted_loans,
                COALESCE(SUM(l.principal) FILTER (WHERE l.status IN ('ACTIVE', 'COMPLETED')), 0) AS total_disbursed,
                COALESCE((
                    SELECT SUM(p.amount_paid) 
                    FROM payments p 
                    WHERE p.collected_by_staff_id = st.id AND p.status = 'COMPLETED' AND p.deleted_at IS NULL
                ), 0) AS total_principal_collected
            FROM staffs st
            LEFT JOIN branches b ON st.branch_id = b.id
            LEFT JOIN loans l ON l.loan_officer_id = st.id AND l.company_id = :companyId AND l.deleted_at IS NULL
            WHERE st.company_id = :companyId
              AND st.deleted_at IS NULL
            """);

        if (branchId != null) {
            sql.append(" AND st.branch_id = :branchId ");
        }

        sql.append("""
            GROUP BY st.id, st.name, st.email, st.branch_id, b.name
            ORDER BY total_loans DESC
            """);

        var spec = databaseClient.sql(sql.toString())
                .bind("companyId", companyId);

        if (branchId != null) {
            spec = spec.bind("branchId", branchId);
        }

        return spec.map((row, meta) -> LoanOfficerPerformanceRow.builder()
                .officerId(getLong(row, "officer_id"))
                .officerName(getString(row, "officer_name"))
                .officerEmail(getString(row, "officer_email"))
                .branchId(getLong(row, "branch_id"))
                .branchName(getString(row, "branch_name"))
                .totalLoans(getLongOrZero(row, "total_loans"))
                .activeLoans(getLongOrZero(row, "active_loans"))
                .completedLoans(getLongOrZero(row, "completed_loans"))
                .defaultedLoans(getLongOrZero(row, "defaulted_loans"))
                .totalDisbursed(getBigDecimal(row, "total_disbursed"))
                .totalPrincipalCollected(getBigDecimal(row, "total_principal_collected"))
                .build()
        ).all();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Row Mapping Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private Long getLong(Row row, String col) {
        Number num = row.get(col, Number.class);
        return num != null ? num.longValue() : null;
    }

    private long getLongOrZero(Row row, String col) {
        Number num = row.get(col, Number.class);
        return num != null ? num.longValue() : 0L;
    }

    private Integer getInteger(Row row, String col) {
        Number num = row.get(col, Number.class);
        return num != null ? num.intValue() : null;
    }

    private Short getShort(Row row, String col) {
        Number num = row.get(col, Number.class);
        return num != null ? num.shortValue() : null;
    }

    private BigDecimal getBigDecimal(Row row, String col) {
        BigDecimal bd = row.get(col, BigDecimal.class);
        return bd != null ? bd : BigDecimal.ZERO;
    }

    private String getString(Row row, String col) {
        return row.get(col, String.class);
    }

    private LocalDate getLocalDate(Row row, String col) {
        return row.get(col, LocalDate.class);
    }

    private Instant getInstant(Row row, String col) {
        return row.get(col, Instant.class);
    }
}
