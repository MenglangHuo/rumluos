-- V17__fix_seeded_users_password_hash.sql
-- Fix BCrypt password hash for seeded company users (Password@123)

UPDATE users
SET password_hash = '$2a$10$SVAU4wC6jczbBq8ZStOEQOUfqUp5HIJPXFx4jzUpjC4i4UupGs12a'
WHERE username IN ('tech_admin', 'tech_officer1', 'villa_admin', 'villa_officer1');
