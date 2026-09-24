-- V15__seed_default_currencies.sql
-- Seed standard ISO 4217 currencies referenced across system tables (customers, loans, products, payments, invoices).

INSERT INTO currencies (code, name, symbol, decimal_places, is_active)
VALUES
    ('USD', 'US Dollar', '$', 2, TRUE),
    ('KHR', 'Cambodian Riel', '៛', 0, TRUE),
    ('EUR', 'Euro', '€', 2, TRUE),
    ('THB', 'Thai Baht', '฿', 2, TRUE)
ON CONFLICT (code) DO NOTHING;
