-- ==============================================================================
-- Reporting Enhancements Migration
-- Adds branch_id and explicit staff/category associations for robust reporting.
-- ==============================================================================

-- 1. Customers Table
ALTER TABLE customers
    ADD COLUMN branch_id BIGINT,
    ADD COLUMN industry VARCHAR(255),
    ADD COLUMN customer_group VARCHAR(255);

CREATE INDEX idx_customers_branch_id ON customers(branch_id);


-- 2. Loans Table
ALTER TABLE loans
    ADD COLUMN branch_id BIGINT,
    ADD COLUMN loan_officer_id BIGINT,
    ADD COLUMN days_in_arrears INT DEFAULT 0;

CREATE INDEX idx_loans_branch_id ON loans(branch_id);
CREATE INDEX idx_loans_officer_id ON loans(loan_officer_id);


-- 3. Payments Table
ALTER TABLE payments
    ADD COLUMN branch_id BIGINT,
    ADD COLUMN collected_by_staff_id BIGINT,
    ADD COLUMN category_id BIGINT;

CREATE INDEX idx_payments_branch_id ON payments(branch_id);
CREATE INDEX idx_payments_collected_by ON payments(collected_by_staff_id);
CREATE INDEX idx_payments_category_id ON payments(category_id);


-- 4. Invoices Table
ALTER TABLE invoices
    ADD COLUMN branch_id BIGINT,
    ADD COLUMN category_id BIGINT;

CREATE INDEX idx_invoices_branch_id ON invoices(branch_id);
CREATE INDEX idx_invoices_category_id ON invoices(category_id);
