-- V10__increase_token_signature_length.sql

ALTER TABLE refresh_tokens
    ALTER COLUMN token_signature TYPE VARCHAR(2048);
