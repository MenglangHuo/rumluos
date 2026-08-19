-- Add deleted_at and deleted_by columns to user_permission_grants and user_permission_grant_exclusions to align with BaseLongEntity mappings

ALTER TABLE user_permission_grants ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_permission_grants ADD COLUMN deleted_by VARCHAR(100);

ALTER TABLE user_permission_grant_exclusions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_permission_grant_exclusions ADD COLUMN deleted_by VARCHAR(100);
