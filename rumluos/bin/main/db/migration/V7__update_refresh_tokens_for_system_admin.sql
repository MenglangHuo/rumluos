-- V7__update_refresh_tokens_for_system_admin.sql

ALTER TABLE refresh_tokens
    DROP CONSTRAINT refresh_tokens_user_id_fkey;

ALTER TABLE refresh_tokens
    ADD COLUMN user_type VARCHAR(50) NOT NULL DEFAULT 'USER';
