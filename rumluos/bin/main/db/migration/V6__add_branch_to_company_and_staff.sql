-- Add enable_branch to companies
ALTER TABLE companies ADD COLUMN enable_branch BOOLEAN DEFAULT false;

-- Create branches table
CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for branches lookup by company
CREATE INDEX idx_branches_company_id ON branches(company_id);

-- Add branch_id to staffs
ALTER TABLE staffs ADD COLUMN branch_id BIGINT;
CREATE INDEX idx_staffs_branch_id ON staffs(branch_id);

-- Data Migration: Auto-create 'Main Branch' for existing companies
INSERT INTO branches (company_id, name, created_at, updated_at)
SELECT id, 'Main Branch', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM companies;

-- Data Migration: Assign existing staffs to the 'Main Branch' of their company
UPDATE staffs s
SET branch_id = b.id
FROM branches b
WHERE s.company_id = b.company_id AND b.name = 'Main Branch';
