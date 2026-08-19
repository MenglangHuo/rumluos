-- V1__init_schema.sql
-- Full schema: loan-focused catalog, tenant isolation (company_id), partial indexes, audit fields.

-- ============================================================
-- 1. currencies
-- ============================================================
CREATE TABLE currencies (
                            code           VARCHAR(3)   PRIMARY KEY,
                            name           VARCHAR(100) NOT NULL,
                            symbol         VARCHAR(10)  NOT NULL,
                            decimal_places INT          NOT NULL DEFAULT 2,
                            is_active      BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ============================================================
-- 2. companies
-- ============================================================
CREATE TABLE companies (
                           id          BIGSERIAL    PRIMARY KEY,
                           name        VARCHAR(100) NOT NULL,
                           email       VARCHAR(100),
                           phone       VARCHAR(50),
                           address     TEXT,
                           is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
                           description TEXT,
                           created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                           created_by  VARCHAR(100),
                           updated_at  TIMESTAMP WITH TIME ZONE,
                           updated_by  VARCHAR(100),
                           deleted_at  TIMESTAMP WITH TIME ZONE,
                           deleted_by  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_companies_name ON companies (name) WHERE deleted_at IS NULL;

-- ============================================================
-- 3. exchange_rates
-- ============================================================
CREATE TABLE exchange_rates (
                                id            BIGSERIAL      PRIMARY KEY,
                                from_currency VARCHAR(3)     NOT NULL REFERENCES currencies(code),
                                to_currency   VARCHAR(3)     NOT NULL REFERENCES currencies(code),
                                rate          NUMERIC(15, 6) NOT NULL,
                                rate_date     DATE           NOT NULL,
                                source        VARCHAR(50),
                                created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                created_by    VARCHAR(100),
                                updated_at    TIMESTAMP WITH TIME ZONE,
                                updated_by    VARCHAR(100),
                                deleted_at    TIMESTAMP WITH TIME ZONE,
                                deleted_by    VARCHAR(100)
);

CREATE UNIQUE INDEX uq_exchange_rates        ON exchange_rates (from_currency, to_currency, rate_date) WHERE deleted_at IS NULL;
CREATE        INDEX idx_exchange_rates_lookup ON exchange_rates (from_currency, to_currency, rate_date DESC);

-- ============================================================
-- 4. brands
-- ============================================================
CREATE TABLE brands (
                        id          BIGSERIAL    PRIMARY KEY,
                        company_id  BIGINT       NOT NULL REFERENCES companies(id),
                        name        VARCHAR(100) NOT NULL,
                        description TEXT,
                        logo_url    VARCHAR(255),
                        is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
                        created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        created_by  VARCHAR(100),
                        updated_at  TIMESTAMP WITH TIME ZONE,
                        updated_by  VARCHAR(100),
                        deleted_at  TIMESTAMP WITH TIME ZONE,
                        deleted_by  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_brands_name   ON brands (name, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_brands_company ON brands (company_id)       WHERE deleted_at IS NULL;

-- ============================================================
-- 5. categories
-- ============================================================
CREATE TABLE categories (
                            id          BIGSERIAL    PRIMARY KEY,
                            company_id  BIGINT       NOT NULL REFERENCES companies(id),
                            name        VARCHAR(100) NOT NULL,
                            description TEXT,
                            color       VARCHAR(50),
                            parent_id   BIGINT       REFERENCES categories(id),
                            image_url   VARCHAR(255),
                            sort_order  INT,
                            created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                            created_by  VARCHAR(100),
                            updated_at  TIMESTAMP WITH TIME ZONE,
                            updated_by  VARCHAR(100),
                            deleted_at  TIMESTAMP WITH TIME ZONE,
                            deleted_by  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_categories_name     ON categories (name, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_categories_company  ON categories (company_id)       WHERE deleted_at IS NULL;
CREATE        INDEX idx_categories_parent   ON categories (parent_id);

-- ============================================================
-- 6. products
-- ============================================================
CREATE TABLE products (
                          id            BIGSERIAL      PRIMARY KEY,
                          company_id    BIGINT         REFERENCES companies(id),
                          brand_id      BIGINT         REFERENCES brands(id),
                          category_id   BIGINT         REFERENCES categories(id),
                          name          VARCHAR(80)    NOT NULL,
                          model         VARCHAR(100),
                          serial_number VARCHAR(100),
                          year          SMALLINT,
                          condition     VARCHAR(20)    NOT NULL DEFAULT 'USED',
                          base_price    NUMERIC(15, 4),
                          sell_price    NUMERIC(15, 4),
                          currency      VARCHAR(3)     REFERENCES currencies(code),
                          description   TEXT,
                          image_url     VARCHAR(255),
                          attributes    JSONB,
                          status        VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
                          is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
                          notes         TEXT,
                          created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                          created_by    VARCHAR(100),
                          updated_at    TIMESTAMP WITH TIME ZONE,
                          updated_by    VARCHAR(100),
                          deleted_at    TIMESTAMP WITH TIME ZONE,
                          deleted_by    VARCHAR(100)
);

CREATE UNIQUE INDEX uq_product_name_company ON products (name, company_id)   WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_company     ON products (company_id)          WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_category    ON products (category_id)         WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_brand       ON products (brand_id)            WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_status      ON products (status)              WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_condition   ON products (condition)           WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_price       ON products (sell_price)          WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_serial      ON products (serial_number)       WHERE deleted_at IS NULL AND serial_number IS NOT NULL;
CREATE        INDEX idx_product_year        ON products (year)                WHERE deleted_at IS NULL AND year IS NOT NULL;
CREATE        INDEX idx_product_active      ON products (is_active)           WHERE deleted_at IS NULL AND is_active = TRUE;
CREATE        INDEX idx_product_name_lower  ON products (LOWER(name))         WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_created     ON products (created_at)          WHERE deleted_at IS NULL;
CREATE        INDEX idx_product_attrs_gin   ON products USING GIN (attributes);

-- ============================================================
-- 7. product_price_history
-- ============================================================
CREATE TABLE product_price_history (
                                       id             BIGSERIAL      PRIMARY KEY,
                                       product_id     BIGINT         NOT NULL REFERENCES products(id),
                                       old_base_price NUMERIC(15, 4),
                                       new_base_price NUMERIC(15, 4) NOT NULL,
                                       old_sell_price NUMERIC(15, 4),
                                       new_sell_price NUMERIC(15, 4) NOT NULL,
                                       currency       VARCHAR(3)     REFERENCES currencies(code),
                                       reason         VARCHAR(255),
                                       created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                       created_by     VARCHAR(100),
                                       updated_at     TIMESTAMP WITH TIME ZONE,
                                       updated_by     VARCHAR(100),
                                       deleted_at     TIMESTAMP WITH TIME ZONE,
                                       deleted_by     VARCHAR(100)
);

CREATE INDEX idx_price_history_lookup ON product_price_history (product_id, created_at DESC);

-- ============================================================
-- 8. customers
-- ============================================================
CREATE TABLE customers (
                           id                 BIGSERIAL    PRIMARY KEY,
                           company_id         BIGINT       NOT NULL REFERENCES companies(id),
                           name               VARCHAR(100) NOT NULL,
                           phone              VARCHAR(50)  NOT NULL,
                           address            TEXT,
                           occupation         VARCHAR(100),
                           image_url          VARCHAR(255),
                           preferred_currency VARCHAR(3)   NOT NULL DEFAULT 'USD' REFERENCES currencies(code),
                           is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
                           email              VARCHAR(100),
                           date_of_birth      DATE,
                           gender             VARCHAR(20),
                           national_id        VARCHAR(50),
                           created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                           created_by         VARCHAR(100),
                           updated_at         TIMESTAMP WITH TIME ZONE,
                           updated_by         VARCHAR(100),
                           deleted_at         TIMESTAMP WITH TIME ZONE,
                           deleted_by         VARCHAR(100)
);

CREATE UNIQUE INDEX uq_customers_phone      ON customers (phone, company_id)  WHERE deleted_at IS NULL;
CREATE        INDEX idx_customers_company    ON customers (company_id)         WHERE deleted_at IS NULL;
CREATE        INDEX idx_customers_active     ON customers (is_active)          WHERE deleted_at IS NULL;
CREATE        INDEX idx_customers_name_lower ON customers (LOWER(name))        WHERE deleted_at IS NULL;
CREATE        INDEX idx_customers_national_id ON customers (national_id)       WHERE deleted_at IS NULL AND national_id IS NOT NULL;

-- ============================================================
-- 9. customer_documents
-- ============================================================
CREATE TABLE customer_documents (
                                    id          BIGSERIAL    PRIMARY KEY,
                                    customer_id BIGINT       NOT NULL REFERENCES customers(id),
                                    doc_type    VARCHAR(50)  NOT NULL,
                                    url         VARCHAR(255) NOT NULL,
                                    file_name   VARCHAR(255),
                                    mime_type   VARCHAR(100),
                                    file_size   BIGINT,
                                    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                    created_by  VARCHAR(100),
                                    updated_at  TIMESTAMP WITH TIME ZONE,
                                    updated_by  VARCHAR(100),
                                    deleted_at  TIMESTAMP WITH TIME ZONE,
                                    deleted_by  VARCHAR(100)
);

CREATE INDEX idx_customer_docs_customer ON customer_documents (customer_id);

-- ============================================================
-- 10. loans
-- ============================================================
CREATE TABLE loans (
                       id                BIGSERIAL      PRIMARY KEY,
                       company_id        BIGINT         NOT NULL REFERENCES companies(id),
                       loan_key          VARCHAR(50)    NOT NULL,
                       customer_id       BIGINT         NOT NULL REFERENCES customers(id),
                       currency          VARCHAR(3)     NOT NULL REFERENCES currencies(code),
                       term              VARCHAR(50)    NOT NULL,
                       interest_rate_bps SMALLINT       NOT NULL,
                       interest_method   VARCHAR(30)    NOT NULL DEFAULT 'EMI',
                       principal         NUMERIC(15, 4) NOT NULL,
                       total_interest    NUMERIC(15, 4) NOT NULL,
                       deposit           NUMERIC(15, 4) NOT NULL DEFAULT 0,
                       status            VARCHAR(50)    NOT NULL DEFAULT 'PENDING',
                       start_date        DATE,
                       end_date          DATE,
                       description       TEXT,
                       approved_by       VARCHAR(100),
                       approved_at       TIMESTAMP WITH TIME ZONE,
                       disbursed_at      TIMESTAMP WITH TIME ZONE,
                       closed_at         TIMESTAMP WITH TIME ZONE,
                       notes             TEXT,
                       created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                       created_by        VARCHAR(100),
                       updated_at        TIMESTAMP WITH TIME ZONE,
                       updated_by        VARCHAR(100),
                       deleted_at        TIMESTAMP WITH TIME ZONE,
                       deleted_by        VARCHAR(100)
);

CREATE UNIQUE INDEX uq_loans_key                    ON loans (loan_key, company_id)              WHERE deleted_at IS NULL;
CREATE        INDEX idx_loans_company                ON loans (company_id)                        WHERE deleted_at IS NULL;
CREATE        INDEX idx_loans_customer               ON loans (customer_id)                       WHERE deleted_at IS NULL;
CREATE        INDEX idx_loans_status_date            ON loans (status, start_date)                WHERE deleted_at IS NULL;
CREATE        INDEX idx_loans_customer_status_created ON loans (customer_id, status, created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================
-- 11. loan_items
-- ============================================================
CREATE TABLE loan_items (
                            id                  BIGSERIAL      PRIMARY KEY,
                            loan_id             BIGINT         NOT NULL REFERENCES loans(id),
                            product_id          BIGINT         NOT NULL REFERENCES products(id),
                            quantity            INT            NOT NULL DEFAULT 1,
                            unit_price_snapshot NUMERIC(15, 4) NOT NULL,
                            currency            VARCHAR(3)     NOT NULL REFERENCES currencies(code),
                            subtotal            NUMERIC(15, 4) GENERATED ALWAYS AS (quantity * unit_price_snapshot) STORED,
    -- Snapshot fields frozen at loan creation
                            product_name        VARCHAR(80),
                            product_model       VARCHAR(100),
                            serial_number       VARCHAR(100),
                            condition           VARCHAR(20),
                            attributes_snapshot JSONB,
                            created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                            created_by          VARCHAR(100),
                            updated_at          TIMESTAMP WITH TIME ZONE,
                            updated_by          VARCHAR(100),
                            deleted_at          TIMESTAMP WITH TIME ZONE,
                            deleted_by          VARCHAR(100)
);

CREATE INDEX idx_loan_items_loan    ON loan_items (loan_id)    WHERE deleted_at IS NULL;
CREATE INDEX idx_loan_items_product ON loan_items (product_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 12. loan_schedules
-- ============================================================
CREATE TABLE loan_schedules (
                                id                  BIGSERIAL      PRIMARY KEY,
                                loan_id             BIGINT         NOT NULL REFERENCES loans(id),
                                period_number       SMALLINT       NOT NULL,
                                due_date            DATE           NOT NULL,
                                principal_due       NUMERIC(15, 4) NOT NULL,
                                interest_due        NUMERIC(15, 4) NOT NULL,
                                principal_balance   NUMERIC(15, 4) NOT NULL,
                                outstanding_balance NUMERIC(15, 4) NOT NULL,
                                is_penalty          BOOLEAN        NOT NULL DEFAULT FALSE,
                                status              VARCHAR(50)    NOT NULL DEFAULT 'PENDING',
                                paid_at             TIMESTAMP WITH TIME ZONE,
                                paid_amount         NUMERIC(15, 4),
                                created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                created_by          VARCHAR(100),
                                updated_at          TIMESTAMP WITH TIME ZONE,
                                updated_by          VARCHAR(100),
                                deleted_at          TIMESTAMP WITH TIME ZONE,
                                deleted_by          VARCHAR(100)
);

CREATE UNIQUE INDEX uq_loan_schedules_period  ON loan_schedules (loan_id, period_number)  WHERE deleted_at IS NULL;
CREATE        INDEX idx_loan_schedules_due     ON loan_schedules (loan_id, due_date)       WHERE deleted_at IS NULL;
CREATE        INDEX idx_loan_schedules_pending ON loan_schedules (status, due_date)        WHERE status IN ('PENDING', 'ACTIVE') AND deleted_at IS NULL;

-- ============================================================
-- 13. invoices
-- ============================================================
CREATE TABLE invoices (
                          id              BIGSERIAL      PRIMARY KEY,
                          company_id      BIGINT         NOT NULL REFERENCES companies(id),
                          invoice_no      VARCHAR(50)    NOT NULL,
                          customer_id     BIGINT         NOT NULL REFERENCES customers(id),
                          loan_id         BIGINT         REFERENCES loans(id),
                          subtotal        NUMERIC(15, 4) NOT NULL DEFAULT 0,
                          tax_amount      NUMERIC(15, 4) NOT NULL DEFAULT 0,
                          discount_amount NUMERIC(15, 4) NOT NULL DEFAULT 0,
                          total_amount    NUMERIC(15, 4) NOT NULL,
                          currency        VARCHAR(3)     NOT NULL REFERENCES currencies(code),
                          status          VARCHAR(50)    NOT NULL DEFAULT 'DRAFT',
                          description     TEXT,
                          due_date        DATE,
                          paid_at         TIMESTAMP WITH TIME ZONE,
                          issued_at       TIMESTAMP WITH TIME ZONE,
                          created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                          created_by      VARCHAR(100),
                          updated_at      TIMESTAMP WITH TIME ZONE,
                          updated_by      VARCHAR(100),
                          deleted_at      TIMESTAMP WITH TIME ZONE,
                          deleted_by      VARCHAR(100)
);

CREATE UNIQUE INDEX uq_invoices_no       ON invoices (invoice_no, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_invoices_company  ON invoices (company_id)             WHERE deleted_at IS NULL;
CREATE        INDEX idx_invoices_customer ON invoices (customer_id);
CREATE        INDEX idx_invoices_loan     ON invoices (loan_id);
CREATE        INDEX idx_invoices_status   ON invoices (status);

-- ============================================================
-- 14. payments
-- ============================================================
CREATE TABLE payments (
                          id                      BIGSERIAL      PRIMARY KEY,
                          company_id              BIGINT         NOT NULL REFERENCES companies(id),
                          payment_ref             VARCHAR(50)    NOT NULL,
                          invoice_id              BIGINT         REFERENCES invoices(id),
                          loan_schedule_id        BIGINT         REFERENCES loan_schedules(id),
                          customer_id             BIGINT         REFERENCES customers(id),
                          payment_currency        VARCHAR(3)     NOT NULL REFERENCES currencies(code),
                          amount_paid             NUMERIC(15, 4) NOT NULL,
                          exchange_rate_snapshot  NUMERIC(15, 6),
                          amount_in_base_currency NUMERIC(15, 4),
                          penalty_amount          NUMERIC(15, 4) NOT NULL DEFAULT 0,
                          payment_method          VARCHAR(50)    NOT NULL,
                          payment_date            DATE           NOT NULL,
                          status                  VARCHAR(50)    NOT NULL DEFAULT 'COMPLETED',
                          notes                   TEXT,
                          receipt_url             VARCHAR(255),
                          created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                          created_by              VARCHAR(100),
                          updated_at              TIMESTAMP WITH TIME ZONE,
                          updated_by              VARCHAR(100),
                          deleted_at              TIMESTAMP WITH TIME ZONE,
                          deleted_by              VARCHAR(100)
);

CREATE UNIQUE INDEX uq_payments_ref       ON payments (payment_ref, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_payments_company   ON payments (company_id)              WHERE deleted_at IS NULL;
CREATE        INDEX idx_payments_invoice   ON payments (invoice_id);
CREATE        INDEX idx_payments_schedule  ON payments (loan_schedule_id);
CREATE        INDEX idx_payments_date      ON payments (payment_date);
CREATE        INDEX idx_payments_customer  ON payments (customer_id);

-- ============================================================
-- 15. income_expense_categories
-- ============================================================
CREATE TABLE income_expense_categories (
                                           id          BIGSERIAL    PRIMARY KEY,
                                           company_id  BIGINT       NOT NULL REFERENCES companies(id),
                                           title       VARCHAR(100) NOT NULL,
                                           description TEXT,
                                           type        VARCHAR(50)  NOT NULL,
                                           is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
                                           parent_id   BIGINT       REFERENCES income_expense_categories(id),
                                           sort_order  INT,
                                           created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                           created_by  VARCHAR(100),
                                           updated_at  TIMESTAMP WITH TIME ZONE,
                                           updated_by  VARCHAR(100),
                                           deleted_at  TIMESTAMP WITH TIME ZONE,
                                           deleted_by  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_income_expense_cats         ON income_expense_categories (title, type, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_income_expense_cats_company ON income_expense_categories (company_id)              WHERE deleted_at IS NULL;
CREATE        INDEX idx_income_expense_cats_type    ON income_expense_categories (type);
CREATE        INDEX idx_income_expense_cats_parent  ON income_expense_categories (parent_id);

-- ============================================================
-- 16. ledger_entries
-- ============================================================
CREATE TABLE ledger_entries (
                                id          BIGSERIAL      PRIMARY KEY,
                                company_id  BIGINT         NOT NULL REFERENCES companies(id),
                                category_id BIGINT         REFERENCES income_expense_categories(id),
                                entry_type  VARCHAR(50)    NOT NULL,
                                amount      NUMERIC(15, 4) NOT NULL,
                                currency    VARCHAR(3)     NOT NULL REFERENCES currencies(code),
                                ref_type    VARCHAR(50),
                                ref_id      BIGINT,
                                description TEXT,
                                entry_date  DATE           NOT NULL,
                                created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                created_by  VARCHAR(100),
                                updated_at  TIMESTAMP WITH TIME ZONE,
                                updated_by  VARCHAR(100),
                                deleted_at  TIMESTAMP WITH TIME ZONE,
                                deleted_by  VARCHAR(100)
);

CREATE INDEX idx_ledger_entries_company  ON ledger_entries (company_id)           WHERE deleted_at IS NULL;
CREATE INDEX idx_ledger_entries_date     ON ledger_entries (entry_date);
CREATE INDEX idx_ledger_entries_category ON ledger_entries (category_id, entry_date);
CREATE INDEX idx_ledger_entries_ref      ON ledger_entries (ref_type, ref_id);

-- ============================================================
-- 17. users
-- ============================================================
CREATE TABLE users (
                       id                   BIGSERIAL    PRIMARY KEY,
                       company_id           BIGINT       NOT NULL REFERENCES companies(id),
                       username             VARCHAR(100) NOT NULL,
                       email                VARCHAR(100) NOT NULL,
                       password_hash        VARCHAR(255) NOT NULL,
                       first_name           VARCHAR(100),
                       last_name            VARCHAR(100),
                       is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
                       status               VARCHAR(30)  NOT NULL DEFAULT 'PENDING_VERIFICATION',
    -- Auth / session tracking
                       last_login_at        TIMESTAMP WITH TIME ZONE,
                       last_logout_at       TIMESTAMP WITH TIME ZONE,
                       token_version        INT          NOT NULL DEFAULT 0,
    -- Brute-force protection
                       login_attempt        SMALLINT     NOT NULL DEFAULT 0,
                       account_locked_until TIMESTAMP WITH TIME ZONE,
    -- Profile
                       avatar_url           VARCHAR(255),
                       created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                       created_by           VARCHAR(100),
                       updated_at           TIMESTAMP WITH TIME ZONE,
                       updated_by           VARCHAR(100),
                       deleted_at           TIMESTAMP WITH TIME ZONE,
                       deleted_by           VARCHAR(100),
                       CONSTRAINT chk_users_status CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'))
);

CREATE UNIQUE INDEX uq_users_username ON users (username, company_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_email    ON users (email,    company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_users_company  ON users (company_id)           WHERE deleted_at IS NULL;
CREATE        INDEX idx_users_status   ON users (status)               WHERE deleted_at IS NULL;

-- ============================================================
-- 18. roles
-- ============================================================
CREATE TABLE roles (
                       id           BIGSERIAL    PRIMARY KEY,
                       company_id   BIGINT       NOT NULL REFERENCES companies(id),
                       name         VARCHAR(100) NOT NULL,
                       display_name VARCHAR(100) NOT NULL,
                       description  VARCHAR(500),
                       priority     INT          NOT NULL DEFAULT 0,
                       created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                       created_by   VARCHAR(100),
                       updated_at   TIMESTAMP WITH TIME ZONE,
                       updated_by   VARCHAR(100),
                       deleted_at   TIMESTAMP WITH TIME ZONE,
                       deleted_by   VARCHAR(100)
);

CREATE UNIQUE INDEX uq_roles_name    ON roles (name, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_roles_company ON roles (company_id)       WHERE deleted_at IS NULL;

-- ============================================================
-- 19. permissions  (resource label only — actions are separate)
-- ============================================================
CREATE TABLE permissions (
                             id          BIGSERIAL    PRIMARY KEY,
                             company_id  BIGINT       NOT NULL REFERENCES companies(id),
                             name        VARCHAR(100) NOT NULL,
                             description VARCHAR(100),
                             created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                             created_by  VARCHAR(100),
                             updated_at  TIMESTAMP WITH TIME ZONE,
                             updated_by  VARCHAR(100),
                             deleted_at  TIMESTAMP WITH TIME ZONE,
                             deleted_by  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_permissions_name    ON permissions (name, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_permissions_company ON permissions (company_id)       WHERE deleted_at IS NULL;

-- ============================================================
-- 19a. actions  (verbs: read, write, delete, approve, …)
-- ============================================================
CREATE TABLE actions (
                         id          BIGSERIAL    PRIMARY KEY,
                         company_id  BIGINT       NOT NULL REFERENCES companies(id),
                         name        VARCHAR(100) NOT NULL,
                         description VARCHAR(255),
                         created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                         created_by  VARCHAR(100),
                         updated_at  TIMESTAMP WITH TIME ZONE,
                         updated_by  VARCHAR(100),
                         deleted_at  TIMESTAMP WITH TIME ZONE,
                         deleted_by  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_actions_name    ON actions (name, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_actions_company ON actions (company_id)       WHERE deleted_at IS NULL;

-- ============================================================
-- 19b. permission_grants  (permission × action combos per company)
-- ============================================================
CREATE TABLE permission_grants (
                                   id            BIGSERIAL PRIMARY KEY,
                                   company_id    BIGINT    NOT NULL REFERENCES companies(id),
                                   permission_id BIGINT    NOT NULL REFERENCES permissions(id),
                                   action_id     BIGINT    NOT NULL REFERENCES actions(id),
                                   disabled      BOOLEAN   NOT NULL DEFAULT FALSE,
                                   created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                   created_by    VARCHAR(100),
                                   updated_at    TIMESTAMP WITH TIME ZONE,
                                   updated_by    VARCHAR(100),
                                   deleted_at    TIMESTAMP WITH TIME ZONE,
                                   deleted_by    VARCHAR(100)
);

CREATE UNIQUE INDEX uq_permission_grants          ON permission_grants (permission_id, action_id, company_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_pg_permission              ON permission_grants (permission_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_pg_action                  ON permission_grants (action_id)     WHERE deleted_at IS NULL;
CREATE        INDEX idx_pg_company                 ON permission_grants (company_id)    WHERE deleted_at IS NULL;

-- ============================================================
-- 20. staffs
-- ============================================================
CREATE TABLE staffs (
                        id          BIGSERIAL    PRIMARY KEY,
                        company_id  BIGINT       NOT NULL REFERENCES companies(id),
                        user_id     BIGINT       REFERENCES users(id),
                        name        VARCHAR(100) NOT NULL,
                        phone       VARCHAR(50),
                        description TEXT,
                        is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
                        email       VARCHAR(100),
                        position    VARCHAR(100),
                        created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                        created_by  VARCHAR(100),
                        updated_at  TIMESTAMP WITH TIME ZONE,
                        updated_by  VARCHAR(100),
                        deleted_at  TIMESTAMP WITH TIME ZONE,
                        deleted_by  VARCHAR(100)
);

CREATE UNIQUE INDEX uq_staffs_user_id  ON staffs (user_id)   WHERE deleted_at IS NULL;
CREATE        INDEX idx_staffs_company  ON staffs (company_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 21. user_roles
-- ============================================================
CREATE TABLE user_roles (
                            id         BIGSERIAL PRIMARY KEY,
                            user_id    BIGINT    NOT NULL REFERENCES users(id),
                            role_id    BIGINT    NOT NULL REFERENCES roles(id),
                            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                            created_by VARCHAR(100),
                            updated_at TIMESTAMP WITH TIME ZONE,
                            updated_by VARCHAR(100),
                            deleted_at TIMESTAMP WITH TIME ZONE,
                            deleted_by VARCHAR(100)
);

CREATE UNIQUE INDEX uq_user_roles       ON user_roles (user_id, role_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_user_roles_user  ON user_roles (user_id);
CREATE        INDEX idx_user_roles_role  ON user_roles (role_id);

-- ============================================================
-- 22. role_permission_grants  (Role ↔ PermissionGrant, many-to-many)
-- ============================================================
CREATE TABLE role_permission_grants (
                                        id                  BIGSERIAL PRIMARY KEY,
                                        role_id             BIGINT    NOT NULL REFERENCES roles(id),
                                        permission_grant_id BIGINT    NOT NULL REFERENCES permission_grants(id),
                                        created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                        created_by          VARCHAR(100),
                                        updated_at          TIMESTAMP WITH TIME ZONE,
                                        updated_by          VARCHAR(100),
                                        deleted_at          TIMESTAMP WITH TIME ZONE,
                                        deleted_by          VARCHAR(100)
);

CREATE UNIQUE INDEX uq_role_permission_grants      ON role_permission_grants (role_id, permission_grant_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_rpg_role                    ON role_permission_grants (role_id)             WHERE deleted_at IS NULL;
CREATE        INDEX idx_rpg_grant                   ON role_permission_grants (permission_grant_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 23. role_permission_grant_exclusions  (per-role grant overrides)
-- ============================================================
CREATE TABLE role_permission_grant_exclusions (
                                                  id                  BIGSERIAL PRIMARY KEY,
                                                  role_id             BIGINT    NOT NULL REFERENCES roles(id),
                                                  permission_grant_id BIGINT    NOT NULL REFERENCES permission_grants(id),
                                                  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                                                  created_by          VARCHAR(100),
                                                  updated_at          TIMESTAMP WITH TIME ZONE,
                                                  updated_by          VARCHAR(100),
                                                  deleted_at          TIMESTAMP WITH TIME ZONE,
                                                  deleted_by          VARCHAR(100)
);

CREATE UNIQUE INDEX uq_rpge                ON role_permission_grant_exclusions (role_id, permission_grant_id) WHERE deleted_at IS NULL;
CREATE        INDEX idx_rpge_role           ON role_permission_grant_exclusions (role_id)             WHERE deleted_at IS NULL;
CREATE        INDEX idx_rpge_grant          ON role_permission_grant_exclusions (permission_grant_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 24. sequence_registry + native sequences
-- ============================================================
CREATE TABLE sequence_registry (
                                   seq_name       VARCHAR(100) PRIMARY KEY,
                                   current_value  BIGINT       NOT NULL,
                                   increment_by   INT          NOT NULL DEFAULT 1,
                                   prefix         VARCHAR(50),
                                   format_pattern VARCHAR(100),
                                   updated_at     TIMESTAMP WITH TIME ZONE
);

CREATE SEQUENCE invoice_seq START 1000 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE loan_seq    START 1000 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE payment_seq START 1000 INCREMENT BY 1 NO CYCLE;