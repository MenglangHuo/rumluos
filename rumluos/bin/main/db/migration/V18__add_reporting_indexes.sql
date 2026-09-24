-- ==============================================================================
-- V18: Reporting Query Optimization Indexes
-- Adds covering and partial indexes tailored for high-performance aggregate reporting
-- ==============================================================================

-- Dashboard & Portfolio: loans by company and status
CREATE INDEX IF NOT EXISTS idx_loans_company_status
    ON loans (company_id, status) WHERE deleted_at IS NULL;

-- Disbursement Report: loans by company and disbursed date
CREATE INDEX IF NOT EXISTS idx_loans_company_disbursed
    ON loans (company_id, disbursed_at) WHERE deleted_at IS NULL AND disbursed_at IS NOT NULL;

-- Loan Officer Performance: loans by officer
CREATE INDEX IF NOT EXISTS idx_loans_officer
    ON loans (company_id, loan_officer_id) WHERE deleted_at IS NULL;

-- Collections Report: payments by company and date
CREATE INDEX IF NOT EXISTS idx_payments_company_date
    ON payments (company_id, payment_date) WHERE deleted_at IS NULL;

-- Overdue/Arrears Report: schedules by status and due date
CREATE INDEX IF NOT EXISTS idx_schedules_status_due
    ON loan_schedules (status, due_date) WHERE deleted_at IS NULL;

-- Income vs Expense Report: ledger entries by company, date, and type
CREATE INDEX IF NOT EXISTS idx_ledger_company_date_type
    ON ledger_entries (company_id, entry_date, entry_type) WHERE deleted_at IS NULL;

-- Inventory Valuation: stocks by company and product
CREATE INDEX IF NOT EXISTS idx_stocks_company_product
    ON product_stocks (company_id, product_id) WHERE deleted_at IS NULL;
