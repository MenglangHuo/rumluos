-- V2__add_system_admin_and_metadata.sql

-- 1. Add meta_data column to companies
ALTER TABLE companies
    ADD COLUMN meta_data JSONB;

-- 2. Create system_admins table (Global platform owners)
CREATE TABLE system_admins (
                               id                   BIGSERIAL    PRIMARY KEY,
                               username             VARCHAR(100) NOT NULL UNIQUE,
                               email                VARCHAR(100) NOT NULL UNIQUE,
                               password_hash        VARCHAR(255) NOT NULL,
                               first_name           VARCHAR(100),
                               last_name            VARCHAR(100),
                               is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
                               -- Auth / session tracking
                               last_login_at        TIMESTAMP WITH TIME ZONE,
                               last_logout_at       TIMESTAMP WITH TIME ZONE,
                               token_version        INT          NOT NULL DEFAULT 0,
                               -- Audit
                               created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                               created_by           VARCHAR(100),
                               updated_at           TIMESTAMP WITH TIME ZONE,
                               updated_by           VARCHAR(100),
                               deleted_at           TIMESTAMP WITH TIME ZONE,
                               deleted_by           VARCHAR(100)
);

CREATE INDEX idx_system_admins_username ON system_admins (username) WHERE deleted_at IS NULL;
CREATE INDEX idx_system_admins_email    ON system_admins (email)    WHERE deleted_at IS NULL;


-- 3. Create otps table (Store verification tokens and OTPs)
CREATE TABLE otps (
                      id                 BIGSERIAL    PRIMARY KEY,
                      email              VARCHAR(100) NOT NULL,
                      otp_code           VARCHAR(100) NOT NULL,
                      purpose            VARCHAR(50)  NOT NULL, -- e.g., 'FORGET_PASSWORD', 'LOGIN'
                      expires_at         TIMESTAMP WITH TIME ZONE NOT NULL,
                      is_used            BOOLEAN      NOT NULL DEFAULT FALSE,
                      created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                      created_by         VARCHAR(100),
                      updated_at         TIMESTAMP WITH TIME ZONE,
                      updated_by         VARCHAR(100),
                      deleted_at         TIMESTAMP WITH TIME ZONE,
                      deleted_by         VARCHAR(100)
);

CREATE INDEX idx_otps_email_purpose ON otps (email, purpose) WHERE deleted_at IS NULL AND is_used = FALSE;
