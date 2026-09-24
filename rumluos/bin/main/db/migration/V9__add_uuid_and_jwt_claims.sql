-- V9__add_uuid_and_jwt_claims.sql

-- Enable pgcrypto if gen_random_uuid() requires it on older PG versions (PG 13+ has it built-in)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users 
    ADD COLUMN user_key UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX uq_users_user_key ON users (user_key) WHERE deleted_at IS NULL;


ALTER TABLE system_admins 
    ADD COLUMN admin_key UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX uq_system_admins_admin_key ON system_admins (admin_key) WHERE deleted_at IS NULL;
