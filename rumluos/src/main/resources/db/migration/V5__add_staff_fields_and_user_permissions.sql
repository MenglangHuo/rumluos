-- Add missing staff fields
ALTER TABLE staffs ADD COLUMN salary DECIMAL(15,2);
ALTER TABLE staffs ADD COLUMN urgent_contact_name VARCHAR(100);
ALTER TABLE staffs ADD COLUMN urgent_contact_phone VARCHAR(50);

-- Create staff documents table
CREATE TABLE staff_documents (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES staffs(id),
    doc_type VARCHAR(50),
    url VARCHAR(500),
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(255)
);

-- Create user_permission_grants
CREATE TABLE user_permission_grants (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT    NOT NULL REFERENCES users(id),
    permission_grant_id BIGINT    NOT NULL REFERENCES permission_grants(id),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_at          TIMESTAMP WITH TIME ZONE,
    updated_by          VARCHAR(100)
);

-- Create user_permission_grant_exclusions
CREATE TABLE user_permission_grant_exclusions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT    NOT NULL REFERENCES users(id),
    permission_grant_id BIGINT    NOT NULL REFERENCES permission_grants(id),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_at          TIMESTAMP WITH TIME ZONE,
    updated_by          VARCHAR(100)
);
