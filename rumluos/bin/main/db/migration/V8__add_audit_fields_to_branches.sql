-- V8__add_audit_fields_to_branches.sql

ALTER TABLE branches ADD COLUMN created_by VARCHAR(255);
ALTER TABLE branches ADD COLUMN updated_by VARCHAR(255);
ALTER TABLE branches ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE branches ADD COLUMN deleted_by VARCHAR(255);
