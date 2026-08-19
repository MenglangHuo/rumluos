-- V16__create_attachments_and_seed_companies.sql

-- ==============================================================================
-- 1. Create Attachments Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS attachments (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT NOT NULL REFERENCES companies(id),
    branch_id           BIGINT REFERENCES branches(id),
    file_name           VARCHAR(255) NOT NULL,
    file_key            VARCHAR(512) NOT NULL,
    file_url            VARCHAR(1024),
    mime_type           VARCHAR(100),
    file_size           BIGINT NOT NULL,
    category            VARCHAR(50) DEFAULT 'GENERAL',
    description         TEXT,
    uploaded_by_user_id BIGINT REFERENCES users(id),
    is_public           BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_at          TIMESTAMP WITH TIME ZONE,
    updated_by          VARCHAR(100),
    deleted_at          TIMESTAMP WITH TIME ZONE,
    deleted_by          VARCHAR(100)
);

CREATE INDEX idx_attachments_company  ON attachments (company_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_branch   ON attachments (branch_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_category ON attachments (category)    WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_file_key ON attachments (file_key)    WHERE deleted_at IS NULL;


-- ==============================================================================
-- 2. Seed Company 1: Menglang-Tech (Loan Car Company)
-- ==============================================================================

DO $$
DECLARE
    v_tech_company_id BIGINT;
    v_tech_branch_id BIGINT;
    v_tech_admin_role_id BIGINT;
    v_tech_officer_role_id BIGINT;
    v_tech_admin_user_id BIGINT;
    v_tech_officer1_user_id BIGINT;
    v_tech_cat_sedan BIGINT;
    v_tech_cat_suv BIGINT;
    v_tech_cat_pickup BIGINT;
    v_tech_cat_ev BIGINT;
    v_prod_camry BIGINT;
    v_prod_crv BIGINT;
    v_prod_ranger BIGINT;
    v_prod_modely BIGINT;
BEGIN
    -- 2.1 Company
    INSERT INTO companies (name, email, phone, address, is_active, description, enable_branch, created_at, created_by)
    VALUES (
        'Menglang-Tech',
        'contact@menglang-tech.com',
        '+855-12-100-001',
        'Building 101, Tech Park, Phnom Penh, Cambodia',
        TRUE,
        'Premier Automotive Financing & Car Loan Solutions Provider',
        TRUE,
        NOW(),
        'SYSTEM_SEED'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_tech_company_id;

    IF v_tech_company_id IS NULL THEN
        SELECT id INTO v_tech_company_id FROM companies WHERE name = 'Menglang-Tech' AND deleted_at IS NULL;
    END IF;

    -- 2.2 Branch
    INSERT INTO branches (company_id, name, phone, address, is_active, created_at, updated_at)
    VALUES (
        v_tech_company_id,
        'Menglang-Tech Main Auto Branch',
        '+855-12-100-002',
        'Building 101, Tech Park, Phnom Penh, Cambodia',
        TRUE,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_tech_branch_id;

    -- 2.3 Roles
    INSERT INTO roles (company_id, name, display_name, description, priority, created_at, created_by)
    VALUES
        (v_tech_company_id, 'TECH_ADMIN', 'Tech Company Admin', 'Full administration access for Menglang-Tech', 1, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_tech_admin_role_id;

    INSERT INTO roles (company_id, name, display_name, description, priority, created_at, created_by)
    VALUES
        (v_tech_company_id, 'CAR_LOAN_OFFICER', 'Car Loan Officer', 'Manages auto loan applications and vehicles', 2, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_tech_officer_role_id;

    -- 2.4 Users
    -- Password hash for 'Password@123'
    INSERT INTO users (company_id, username, email, password_hash, first_name, last_name, is_active, status, created_at, created_by)
    VALUES (
        v_tech_company_id,
        'tech_admin',
        'admin@menglang-tech.com',
        '$2a$10$SVAU4wC6jczbBq8ZStOEQOUfqUp5HIJPXFx4jzUpjC4i4UupGs12a',
        'Menglang',
        'Tech Admin',
        TRUE,
        'ACTIVE',
        NOW(),
        'SYSTEM_SEED'
    )
    RETURNING id INTO v_tech_admin_user_id;

    INSERT INTO users (company_id, username, email, password_hash, first_name, last_name, is_active, status, created_at, created_by)
    VALUES (
        v_tech_company_id,
        'tech_officer1',
        'officer@menglang-tech.com',
        '$2a$10$SVAU4wC6jczbBq8ZStOEQOUfqUp5HIJPXFx4jzUpjC4i4UupGs12a',
        'Sokha',
        'Car Loan Officer',
        TRUE,
        'ACTIVE',
        NOW(),
        'SYSTEM_SEED'
    )
    RETURNING id INTO v_tech_officer1_user_id;

    -- User roles
    INSERT INTO user_roles (user_id, role_id, created_at, created_by)
    VALUES
        (v_tech_admin_user_id, v_tech_admin_role_id, NOW(), 'SYSTEM_SEED'),
        (v_tech_officer1_user_id, v_tech_officer_role_id, NOW(), 'SYSTEM_SEED');

    -- 2.5 Staffs
    INSERT INTO staffs (company_id, user_id, branch_id, name, phone, email, position, is_active, description, created_at, created_by)
    VALUES
        (v_tech_company_id, v_tech_admin_user_id, v_tech_branch_id, 'Menglang Tech Admin', '+855-12-100-001', 'admin@menglang-tech.com', 'General Manager', TRUE, 'Head of Tech Auto Loans', NOW(), 'SYSTEM_SEED'),
        (v_tech_company_id, v_tech_officer1_user_id, v_tech_branch_id, 'Sokha Loan Specialist', '+855-12-100-003', 'officer@menglang-tech.com', 'Senior Loan Officer', TRUE, 'Auto loan specialist', NOW(), 'SYSTEM_SEED');

    -- 2.6 Categories (Car categories)
    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_tech_company_id, 'Sedan', 'Comfortable family & executive sedan cars', '#3B82F6', 1, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_tech_cat_sedan;

    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_tech_company_id, 'SUV', 'Sport utility vehicles & crossovers', '#10B981', 2, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_tech_cat_suv;

    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_tech_company_id, 'Pickup Truck', 'Heavy duty & commercial pickup trucks', '#F59E0B', 3, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_tech_cat_pickup;

    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_tech_company_id, 'Electric Vehicle', 'EVs and hybrid eco cars', '#8B5CF6', 4, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_tech_cat_ev;

    -- 2.7 Products (Car Products for Car Loans)
    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_tech_company_id, v_tech_cat_sedan, 'Toyota Camry 2.5Q', 'Camry', 'VIN-TOY-2024-001', 2024, 'NEW', 35000.0000, 42000.0000, 'USD',
        '2024 Toyota Camry 2.5Q Premium Sedan available for auto financing',
        '{"vehicle_type": "CAR", "fuel_type": "PETROL", "transmission": "AUTOMATIC", "engine": "2.5L 4-Cylinder", "color": "White Pearl", "seats": 5}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_camry;

    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_tech_company_id, v_tech_cat_suv, 'Honda CR-V Turbo AW', 'CR-V', 'VIN-HON-2024-002', 2024, 'NEW', 38000.0000, 45000.0000, 'USD',
        '2024 Honda CR-V 1.5L Turbo All-Wheel Drive SUV',
        '{"vehicle_type": "CAR", "fuel_type": "PETROL_TURBO", "transmission": "CVT", "engine": "1.5L VTEC Turbo", "color": "Crystal Black", "seats": 7}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_crv;

    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_tech_company_id, v_tech_cat_pickup, 'Ford Ranger Raptor 3.0V6', 'Ranger Raptor', 'VIN-FOR-2023-003', 2023, 'USED', 52000.0000, 62000.0000, 'USD',
        '2023 Ford Ranger Raptor 3.0L Twin-Turbo V6 EcoBoost Pickup',
        '{"vehicle_type": "CAR", "fuel_type": "PETROL", "transmission": "10-SPEED_AUTO", "engine": "3.0L Twin-Turbo V6", "color": "Code Orange", "seats": 5}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_ranger;

    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_tech_company_id, v_tech_cat_ev, 'Tesla Model Y Long Range', 'Model Y', 'VIN-TSL-2024-004', 2024, 'NEW', 48000.0000, 56000.0000, 'USD',
        '2024 Tesla Model Y Dual Motor All-Wheel Drive EV',
        '{"vehicle_type": "CAR", "fuel_type": "ELECTRIC", "transmission": "SINGLE_SPEED", "range_km": 533, "color": "Deep Blue Metallic", "seats": 5}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_modely;

    -- 2.8 Product Stocks & Inventory Batches
    INSERT INTO product_stocks (company_id, branch_id, product_id, quantity_available, created_at, created_by)
    VALUES
        (v_tech_company_id, v_tech_branch_id, v_prod_camry, 5, NOW(), 'SYSTEM_SEED'),
        (v_tech_company_id, v_tech_branch_id, v_prod_crv, 3, NOW(), 'SYSTEM_SEED'),
        (v_tech_company_id, v_tech_branch_id, v_prod_ranger, 2, NOW(), 'SYSTEM_SEED'),
        (v_tech_company_id, v_tech_branch_id, v_prod_modely, 4, NOW(), 'SYSTEM_SEED');

    INSERT INTO inventory_batches (company_id, branch_id, product_id, unit_cost, original_quantity, remaining_quantity, supplier_name, status, created_at, created_by)
    VALUES
        (v_tech_company_id, v_tech_branch_id, v_prod_camry, 35000.0000, 5, 5, 'Toyota Motors Dealer', 'ACTIVE', NOW(), 'SYSTEM_SEED'),
        (v_tech_company_id, v_tech_branch_id, v_prod_crv, 38000.0000, 3, 3, 'Honda Motors Dealer', 'ACTIVE', NOW(), 'SYSTEM_SEED'),
        (v_tech_company_id, v_tech_branch_id, v_prod_ranger, 52000.0000, 2, 2, 'RMG Auto Import', 'ACTIVE', NOW(), 'SYSTEM_SEED'),
        (v_tech_company_id, v_tech_branch_id, v_prod_modely, 48000.0000, 4, 4, 'Tesla Direct Import', 'ACTIVE', NOW(), 'SYSTEM_SEED');

    -- 2.9 Customers
    INSERT INTO customers (
        company_id, branch_id, name, phone, email, address, occupation, preferred_currency, gender, date_of_birth, is_active, created_at, created_by
    ) VALUES (
        v_tech_company_id, v_tech_branch_id, 'Khemera Chan', '+855-12-888-001', 'khemera@example.com', 'Street 271, Phnom Penh', 'Software Engineer', 'USD', 'MALE', '1995-05-12', TRUE, NOW(), 'SYSTEM_SEED'
    ), (
        v_tech_company_id, v_tech_branch_id, 'Vanna Heng', '+855-12-888-002', 'vanna@example.com', 'Monivong Blvd, Phnom Penh', 'Business Owner', 'USD', 'FEMALE', '1990-11-25', TRUE, NOW(), 'SYSTEM_SEED'
    );

    -- 2.10 Sample Company Attachments for Menglang-Tech
    INSERT INTO attachments (
        company_id, branch_id, file_name, file_key, file_url, mime_type, file_size, category, description, uploaded_by_user_id, is_public, is_active, created_at, created_by
    ) VALUES (
        v_tech_company_id, v_tech_branch_id, 'Menglang-Tech Auto Loan Application Form.pdf', 'companies/tech/documents/loan_application_form.pdf', 'https://s3.amazonaws.com/rumluos-app/companies/tech/documents/loan_application_form.pdf', 'application/pdf', 1048576, 'DOCUMENT', 'Standard auto loan application form for customers', v_tech_admin_user_id, TRUE, TRUE, NOW(), 'SYSTEM_SEED'
    ), (
        v_tech_company_id, v_tech_branch_id, 'Menglang-Tech Business Operating License.pdf', 'companies/tech/documents/business_license.pdf', 'https://s3.amazonaws.com/rumluos-app/companies/tech/documents/business_license.pdf', 'application/pdf', 2097152, 'CONTRACT', 'Official business operation license certificate', v_tech_admin_user_id, FALSE, TRUE, NOW(), 'SYSTEM_SEED'
    );
END $$;


-- ==============================================================================
-- 3. Seed Company 2: Menglang-Villa (House & Villa Real Estate Loan Company)
-- ==============================================================================

DO $$
DECLARE
    v_villa_company_id BIGINT;
    v_villa_branch_id BIGINT;
    v_villa_admin_role_id BIGINT;
    v_villa_officer_role_id BIGINT;
    v_villa_admin_user_id BIGINT;
    v_villa_officer1_user_id BIGINT;
    v_villa_cat_grand BIGINT;
    v_villa_cat_twin BIGINT;
    v_villa_cat_single BIGINT;
    v_villa_cat_townhouse BIGINT;
    v_prod_villa_rose BIGINT;
    v_prod_twin_villa BIGINT;
    v_prod_single_house BIGINT;
    v_prod_townhouse BIGINT;
BEGIN
    -- 3.1 Company
    INSERT INTO companies (name, email, phone, address, is_active, description, enable_branch, created_at, created_by)
    VALUES (
        'Menglang-Villa',
        'contact@menglang-villa.com',
        '+855-12-200-001',
        'Grand Boulevard, Villa City, Phnom Penh, Cambodia',
        TRUE,
        'Premium Real Estate Developer & Villa Loan Financing Specialist',
        TRUE,
        NOW(),
        'SYSTEM_SEED'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_villa_company_id;

    IF v_villa_company_id IS NULL THEN
        SELECT id INTO v_villa_company_id FROM companies WHERE name = 'Menglang-Villa' AND deleted_at IS NULL;
    END IF;

    -- 3.2 Branch
    INSERT INTO branches (company_id, name, phone, address, is_active, created_at, updated_at)
    VALUES (
        v_villa_company_id,
        'Menglang-Villa Main Branch',
        '+855-12-200-002',
        'Grand Boulevard, Villa City, Phnom Penh, Cambodia',
        TRUE,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_villa_branch_id;

    -- 3.3 Roles
    INSERT INTO roles (company_id, name, display_name, description, priority, created_at, created_by)
    VALUES
        (v_villa_company_id, 'VILLA_ADMIN', 'Villa Company Admin', 'Full administration access for Menglang-Villa', 1, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_villa_admin_role_id;

    INSERT INTO roles (company_id, name, display_name, description, priority, created_at, created_by)
    VALUES
        (v_villa_company_id, 'REAL_ESTATE_OFFICER', 'Real Estate Loan Officer', 'Manages property financing and villa loans', 2, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_villa_officer_role_id;

    -- 3.4 Users
    -- Password hash for 'Password@123'
    INSERT INTO users (company_id, username, email, password_hash, first_name, last_name, is_active, status, created_at, created_by)
    VALUES (
        v_villa_company_id,
        'villa_admin',
        'admin@menglang-villa.com',
        '$2a$10$SVAU4wC6jczbBq8ZStOEQOUfqUp5HIJPXFx4jzUpjC4i4UupGs12a',
        'Menglang',
        'Villa Admin',
        TRUE,
        'ACTIVE',
        NOW(),
        'SYSTEM_SEED'
    )
    RETURNING id INTO v_villa_admin_user_id;

    INSERT INTO users (company_id, username, email, password_hash, first_name, last_name, is_active, status, created_at, created_by)
    VALUES (
        v_villa_company_id,
        'villa_officer1',
        'officer@menglang-villa.com',
        '$2a$10$SVAU4wC6jczbBq8ZStOEQOUfqUp5HIJPXFx4jzUpjC4i4UupGs12a',
        'Bopha',
        'Property Loan Specialist',
        TRUE,
        'ACTIVE',
        NOW(),
        'SYSTEM_SEED'
    )
    RETURNING id INTO v_villa_officer1_user_id;

    -- User roles
    INSERT INTO user_roles (user_id, role_id, created_at, created_by)
    VALUES
        (v_villa_admin_user_id, v_villa_admin_role_id, NOW(), 'SYSTEM_SEED'),
        (v_villa_officer1_user_id, v_villa_officer_role_id, NOW(), 'SYSTEM_SEED');

    -- 3.5 Staffs
    INSERT INTO staffs (company_id, user_id, branch_id, name, phone, email, position, is_active, description, created_at, created_by)
    VALUES
        (v_villa_company_id, v_villa_admin_user_id, v_villa_branch_id, 'Menglang Villa Admin', '+855-12-200-001', 'admin@menglang-villa.com', 'Managing Director', TRUE, 'Head of Real Estate & Villa Development', NOW(), 'SYSTEM_SEED'),
        (v_villa_company_id, v_villa_officer1_user_id, v_villa_branch_id, 'Bopha Property Consultant', '+855-12-200-003', 'officer@menglang-villa.com', 'Senior Property Officer', TRUE, 'Villa and house loan financing consultant', NOW(), 'SYSTEM_SEED');

    -- 3.6 Categories (House & Villa categories)
    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_villa_company_id, 'Grand Villa', 'Exclusive luxury grand villas with private gardens & pool', '#EC4899', 1, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_villa_cat_grand;

    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_villa_company_id, 'Twin Villa', 'Modern twin villas for growing families', '#06B6D4', 2, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_villa_cat_twin;

    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_villa_company_id, 'Single House', 'Spacious standalone single residential houses', '#84CC16', 3, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_villa_cat_single;

    INSERT INTO categories (company_id, name, description, color, sort_order, created_at, created_by)
    VALUES (v_villa_company_id, 'Townhouse', 'Contemporary urban townhouses in prime locations', '#EAB308', 4, NOW(), 'SYSTEM_SEED')
    RETURNING id INTO v_villa_cat_townhouse;

    -- 3.7 Products (House & Villa Products for Loans)
    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_villa_company_id, v_villa_cat_grand, 'Grand Villa Rose - Unit A1', 'Grand Villa', 'PROP-VIL-ROSE-A1', 2024, 'NEW', 280000.0000, 35000.0000, 'USD',
        'Luxury 3-Storey Grand Villa with 5 Bedrooms, 6 Bathrooms & Private Swimming Pool',
        '{"property_type": "HOUSE_VILLA", "land_size_sqm": 350, "house_size_sqm": 420, "bedrooms": 5, "bathrooms": 6, "floors": 3, "parking_spaces": 3, "facing": "NORTH"}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_villa_rose;

    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_villa_company_id, v_villa_cat_twin, 'Modern Twin Villa - Unit B2', 'Twin Villa', 'PROP-VIL-TWIN-B2', 2024, 'NEW', 160000.0000, 210000.0000, 'USD',
        'Contemporary 2-Storey Twin Villa with 4 Bedrooms in Secured Gated Community',
        '{"property_type": "HOUSE_VILLA", "land_size_sqm": 200, "house_size_sqm": 260, "bedrooms": 4, "bathrooms": 5, "floors": 2, "parking_spaces": 2, "facing": "SOUTH"}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_twin_villa;

    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_villa_company_id, v_villa_cat_single, 'Garden Single House - Unit C3', 'Single House', 'PROP-HSE-SNGL-C3', 2023, 'NEW', 140000.0000, 185000.0000, 'USD',
        'Spacious Single Standalone House with Large Front Yard & Garden',
        '{"property_type": "HOUSE_VILLA", "land_size_sqm": 240, "house_size_sqm": 220, "bedrooms": 3, "bathrooms": 4, "floors": 2, "parking_spaces": 2, "facing": "EAST"}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_single_house;

    INSERT INTO products (
        company_id, category_id, name, model, serial_number, year, condition, base_price, sell_price, currency, description, attributes, status, is_active, created_at, created_by
    ) VALUES (
        v_villa_company_id, v_villa_cat_townhouse, 'Prime City Townhouse - Unit D4', 'Townhouse', 'PROP-TOWN-CTY-D4', 2024, 'NEW', 95000.0000, 128000.0000, 'USD',
        'Modern 3-Storey Urban Townhouse ideal for small families or business office',
        '{"property_type": "HOUSE_VILLA", "land_size_sqm": 80, "house_size_sqm": 180, "bedrooms": 4, "bathrooms": 4, "floors": 3, "parking_spaces": 1, "facing": "WEST"}'::jsonb,
        'ACTIVE', TRUE, NOW(), 'SYSTEM_SEED'
    ) RETURNING id INTO v_prod_townhouse;

    -- 3.8 Product Stocks & Inventory Batches
    INSERT INTO product_stocks (company_id, branch_id, product_id, quantity_available, created_at, created_by)
    VALUES
        (v_villa_company_id, v_villa_branch_id, v_prod_villa_rose, 2, NOW(), 'SYSTEM_SEED'),
        (v_villa_company_id, v_villa_branch_id, v_prod_twin_villa, 4, NOW(), 'SYSTEM_SEED'),
        (v_villa_company_id, v_villa_branch_id, v_prod_single_house, 3, NOW(), 'SYSTEM_SEED'),
        (v_villa_company_id, v_villa_branch_id, v_prod_townhouse, 6, NOW(), 'SYSTEM_SEED');

    INSERT INTO inventory_batches (company_id, branch_id, product_id, unit_cost, original_quantity, remaining_quantity, supplier_name, status, created_at, created_by)
    VALUES
        (v_villa_company_id, v_villa_branch_id, v_prod_villa_rose, 280000.0000, 2, 2, 'Menglang Villa Construction', 'ACTIVE', NOW(), 'SYSTEM_SEED'),
        (v_villa_company_id, v_villa_branch_id, v_prod_twin_villa, 160000.0000, 4, 4, 'Menglang Villa Construction', 'ACTIVE', NOW(), 'SYSTEM_SEED'),
        (v_villa_company_id, v_villa_branch_id, v_prod_single_house, 140000.0000, 3, 3, 'Menglang Villa Construction', 'ACTIVE', NOW(), 'SYSTEM_SEED'),
        (v_villa_company_id, v_villa_branch_id, v_prod_townhouse, 95000.0000, 6, 6, 'Menglang Villa Construction', 'ACTIVE', NOW(), 'SYSTEM_SEED');

    -- 3.9 Customers
    INSERT INTO customers (
        company_id, branch_id, name, phone, email, address, occupation, preferred_currency, gender, date_of_birth, is_active, created_at, created_by
    ) VALUES (
        v_villa_company_id, v_villa_branch_id, 'Sophal Meas', '+855-12-999-001', 'sophal@example.com', 'Norodom Blvd, Phnom Penh', 'Real Estate Investor', 'USD', 'FEMALE', '1988-08-18', TRUE, NOW(), 'SYSTEM_SEED'
    ), (
        v_villa_company_id, v_villa_branch_id, 'Rithy Keo', '+855-12-999-002', 'rithy@example.com', 'Toul Kork, Phnom Penh', 'Architect', 'USD', 'MALE', '1992-03-30', TRUE, NOW(), 'SYSTEM_SEED'
    );

    -- 3.10 Sample Company Attachments for Menglang-Villa
    INSERT INTO attachments (
        company_id, branch_id, file_name, file_key, file_url, mime_type, file_size, category, description, uploaded_by_user_id, is_public, is_active, created_at, created_by
    ) VALUES (
        v_villa_company_id, v_villa_branch_id, 'Menglang-Villa Sales & Payment Contract Template.pdf', 'companies/villa/documents/sales_contract_template.pdf', 'https://s3.amazonaws.com/rumluos-app/companies/villa/documents/sales_contract_template.pdf', 'application/pdf', 3145728, 'CONTRACT', 'Standard villa purchase and loan contract template', v_villa_admin_user_id, TRUE, TRUE, NOW(), 'SYSTEM_SEED'
    ), (
        v_villa_company_id, v_villa_branch_id, 'Menglang-Villa Master Plan Brochure.pdf', 'companies/villa/documents/master_plan_brochure.pdf', 'https://s3.amazonaws.com/rumluos-app/companies/villa/documents/master_plan_brochure.pdf', 'application/pdf', 5242880, 'REAL_ESTATE_DOC', 'Complete site master plan and house layout brochure', v_villa_admin_user_id, TRUE, TRUE, NOW(), 'SYSTEM_SEED'
    );
END $$;
