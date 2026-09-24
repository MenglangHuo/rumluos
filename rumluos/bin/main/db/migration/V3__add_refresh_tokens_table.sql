-- V3__add_refresh_tokens_table.sql

CREATE TABLE refresh_tokens (
                                id                   BIGSERIAL    PRIMARY KEY,
                                user_id              BIGINT       NOT NULL REFERENCES users(id),
                                token_signature      VARCHAR(512) NOT NULL UNIQUE,
                                expires_at           TIMESTAMP WITH TIME ZONE NOT NULL,
                                is_revoked           BOOLEAN      NOT NULL DEFAULT FALSE,
                                created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                created_by           VARCHAR(100),
                                updated_at           TIMESTAMP WITH TIME ZONE,
                                updated_by           VARCHAR(100),
                                deleted_at           TIMESTAMP WITH TIME ZONE,
                                deleted_by           VARCHAR(100)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_refresh_tokens_signature ON refresh_tokens (token_signature) WHERE deleted_at IS NULL;
