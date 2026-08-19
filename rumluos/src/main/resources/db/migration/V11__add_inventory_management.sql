-- V12__add_inventory_management.sql

-- 1. Product Stocks: Aggregated inventory per branch
CREATE TABLE product_stocks (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT    NOT NULL REFERENCES companies(id),
    branch_id           BIGINT    NOT NULL REFERENCES branches(id),
    product_id          BIGINT    NOT NULL REFERENCES products(id),
    quantity_available  INT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_at          TIMESTAMP WITH TIME ZONE,
    updated_by          VARCHAR(100),
    deleted_at          TIMESTAMP WITH TIME ZONE,
    deleted_by          VARCHAR(100)
);

CREATE UNIQUE INDEX uq_product_stocks_branch ON product_stocks (product_id, branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_stocks_company      ON product_stocks (company_id)            WHERE deleted_at IS NULL;

-- 2. Inventory Batches: FIFO Tracking
CREATE TABLE inventory_batches (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT    NOT NULL REFERENCES companies(id),
    branch_id           BIGINT    NOT NULL REFERENCES branches(id),
    product_id          BIGINT    NOT NULL REFERENCES products(id),
    unit_cost           NUMERIC(15, 4) NOT NULL,
    original_quantity   INT       NOT NULL,
    remaining_quantity  INT       NOT NULL,
    received_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    supplier_name       VARCHAR(100),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DEPLETED
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_at          TIMESTAMP WITH TIME ZONE,
    updated_by          VARCHAR(100),
    deleted_at          TIMESTAMP WITH TIME ZONE,
    deleted_by          VARCHAR(100),
    CONSTRAINT chk_batch_quantity CHECK (remaining_quantity >= 0 AND remaining_quantity <= original_quantity)
);

CREATE INDEX idx_inventory_batches_lookup ON inventory_batches (product_id, branch_id, status, received_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_batches_company ON inventory_batches (company_id) WHERE deleted_at IS NULL;

-- 3. Inventory Transactions: Ledger
CREATE TABLE inventory_transactions (
    id                  BIGSERIAL PRIMARY KEY,
    company_id          BIGINT    NOT NULL REFERENCES companies(id),
    branch_id           BIGINT    NOT NULL REFERENCES branches(id),
    product_id          BIGINT    NOT NULL REFERENCES products(id),
    batch_id            BIGINT    REFERENCES inventory_batches(id),
    transaction_type    VARCHAR(50) NOT NULL, -- STOCK_IN, SALE, RETURN, TRANSFER, ADJUSTMENT
    quantity_change     INT       NOT NULL, -- Positive for IN, Negative for OUT
    unit_cost           NUMERIC(15, 4) NOT NULL,
    reference_type      VARCHAR(50), -- LOAN, PURCHASE_ORDER, MANUAL
    reference_id        BIGINT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_at          TIMESTAMP WITH TIME ZONE,
    updated_by          VARCHAR(100),
    deleted_at          TIMESTAMP WITH TIME ZONE,
    deleted_by          VARCHAR(100)
);

CREATE INDEX idx_inv_tx_lookup   ON inventory_transactions (product_id, branch_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_tx_company  ON inventory_transactions (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_tx_batch    ON inventory_transactions (batch_id)   WHERE deleted_at IS NULL;

-- 4. Alter loan_items to capture total_cost_snapshot
ALTER TABLE loan_items 
ADD COLUMN total_cost_snapshot NUMERIC(15, 4) DEFAULT 0;
