-- Migration V13: Add new tracking fields to loans and invoices
ALTER TABLE loans 
ADD COLUMN asset_price NUMERIC(19,4),
ADD COLUMN number_of_periods INTEGER,
ADD COLUMN parent_loan_id BIGINT;

ALTER TABLE invoices
ADD COLUMN loan_schedule_id BIGINT;
