-- Sprint 05: Escrow & Financial Ledger
-- Migration: 202603110022_sprint05_financial_escrow
-- Date: 2026-03-11

-- ─────────────────────────────────────────────────────────────────────────────
-- financial.accounts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial.accounts (
  id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number   VARCHAR(30)  NOT NULL,
  account_type     VARCHAR(30)  NOT NULL,
  owner_id         UUID,
  owner_type       VARCHAR(30),
  reference_id     UUID,
  company_id       UUID,
  currency         CHAR(3)      NOT NULL DEFAULT 'USD',
  status           VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_accounts_number UNIQUE (account_number)
);
CREATE INDEX IF NOT EXISTS idx_accounts_owner_id     ON financial.accounts (owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_reference_id ON financial.accounts (reference_id);
CREATE INDEX IF NOT EXISTS idx_accounts_company_id   ON financial.accounts (company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type         ON financial.accounts (owner_type, account_type);

-- Seed platform operational accounts
INSERT INTO financial.accounts (id, account_number, account_type, owner_type, currency, status)
VALUES
  (gen_random_uuid(), 'PLATFORM-INCOMING-USD',   'operational', 'platform', 'USD', 'active'),
  (gen_random_uuid(), 'PLATFORM-COMMISSION-USD', 'commission',  'platform', 'USD', 'active'),
  (gen_random_uuid(), 'PLATFORM-FEE-USD',        'fee',         'platform', 'USD', 'active')
ON CONFLICT (account_number) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- financial.ledger_entries  (APPEND-ONLY — NEVER UPDATE/DELETE)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial.ledger_entries (
  id                   UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_reference      VARCHAR(50)    NOT NULL,
  entry_type           VARCHAR(50)    NOT NULL,
  debit_account_id     UUID           NOT NULL,
  credit_account_id    UUID           NOT NULL,
  amount               NUMERIC(18,8)  NOT NULL,
  currency             CHAR(3)        NOT NULL,
  exchange_rate        NUMERIC(18,8)  NOT NULL DEFAULT 1,
  base_currency_amount NUMERIC(18,8)  NOT NULL,
  description          TEXT,
  metadata             JSONB,
  initiated_by         UUID,
  approved_by          UUID,
  status               VARCHAR(20)    NOT NULL DEFAULT 'completed',
  idempotency_key      VARCHAR(100),
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ledger_reference    UNIQUE (entry_reference),
  CONSTRAINT uq_ledger_idempotency  UNIQUE (idempotency_key),
  CONSTRAINT chk_ledger_amount      CHECK  (amount > 0)
);
CREATE INDEX IF NOT EXISTS idx_ledger_debit   ON financial.ledger_entries (debit_account_id,  created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_credit  ON financial.ledger_entries (credit_account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_status  ON financial.ledger_entries (status, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_type    ON financial.ledger_entries (entry_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_sale_id ON financial.ledger_entries ((metadata->>'sale_id'), created_at);

-- Immutable trigger — prevents any UPDATE or DELETE
CREATE OR REPLACE FUNCTION financial.prevent_ledger_modification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'financial.ledger_entries is append-only — UPDATE and DELETE are not permitted';
END;
$$;

DROP TRIGGER IF EXISTS trg_ledger_immutable ON financial.ledger_entries;
CREATE TRIGGER trg_ledger_immutable
BEFORE UPDATE OR DELETE ON financial.ledger_entries
FOR EACH ROW EXECUTE FUNCTION financial.prevent_ledger_modification();

-- ─────────────────────────────────────────────────────────────────────────────
-- financial.escrow_conditions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial.escrow_conditions (
  id                UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_account_id UUID         NOT NULL,
  condition_type    VARCHAR(50)  NOT NULL,
  condition_details JSONB,
  is_satisfied      BOOLEAN      NOT NULL DEFAULT FALSE,
  satisfied_at      TIMESTAMPTZ,
  satisfied_by      UUID,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_escrow_conditions ON financial.escrow_conditions (escrow_account_id, is_satisfied);

-- ─────────────────────────────────────────────────────────────────────────────
-- financial.payment_requests
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial.payment_requests (
  id                UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id        UUID          NOT NULL,
  amount            NUMERIC(18,2) NOT NULL,
  currency          CHAR(3)       NOT NULL,
  payment_method    VARCHAR(30),
  gateway_reference VARCHAR(255),
  gateway_status    VARCHAR(30),
  gateway_response  JSONB,
  status            VARCHAR(20)   NOT NULL DEFAULT 'pending',
  initiated_by      UUID,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_gateway_ref UNIQUE (gateway_reference)
);
CREATE INDEX IF NOT EXISTS idx_payment_requests_account ON financial.payment_requests (account_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_gateway ON financial.payment_requests (gateway_reference);

-- ─────────────────────────────────────────────────────────────────────────────
-- financial.escrow_releases
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial.escrow_releases (
  id                     UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_account_id      UUID           NOT NULL,
  release_amount         NUMERIC(18,2)  NOT NULL,
  currency               CHAR(3)        NOT NULL,
  destination_account_id UUID           NOT NULL,
  reason                 TEXT,
  status                 VARCHAR(20)    NOT NULL DEFAULT 'pending',
  requested_by           UUID           NOT NULL,
  requested_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  buyer_approved_at      TIMESTAMPTZ,
  admin_approved_at      TIMESTAMPTZ,
  admin_approver_id      UUID,
  released_at            TIMESTAMPTZ,
  mfa_verified           BOOLEAN        NOT NULL DEFAULT FALSE,
  rejection_reason       TEXT
);
CREATE INDEX IF NOT EXISTS idx_escrow_releases_escrow    ON financial.escrow_releases (escrow_account_id, status);
CREATE INDEX IF NOT EXISTS idx_escrow_releases_requester ON financial.escrow_releases (requested_by, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- financial.exchange_rate_snapshots
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial.exchange_rate_snapshots (
  id         UUID           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base       CHAR(3)        NOT NULL DEFAULT 'USD',
  target     CHAR(3)        NOT NULL,
  rate       NUMERIC(18,8)  NOT NULL,
  source     VARCHAR(50)    NOT NULL DEFAULT 'open_exchange_rates',
  fetched_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fx_snapshots ON financial.exchange_rate_snapshots (base, target, fetched_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- financial.audit_logs  (APPEND-ONLY)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial.audit_logs (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      UUID         NOT NULL DEFAULT gen_random_uuid(),
  actor_id      UUID         NOT NULL,
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id   UUID,
  amount        NUMERIC(18,8),
  currency      CHAR(3),
  metadata      JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_financial_audit_actor    ON financial.audit_logs (actor_id,    created_at);
CREATE INDEX IF NOT EXISTS idx_financial_audit_resource ON financial.audit_logs (resource_id, created_at);
CREATE INDEX IF NOT EXISTS idx_financial_audit_action   ON financial.audit_logs (action,      created_at);

-- Immutable trigger
CREATE OR REPLACE FUNCTION financial.prevent_audit_modification()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'financial.audit_logs is immutable — UPDATE and DELETE are not permitted';
END;
$$;

DROP TRIGGER IF EXISTS trg_financial_audit_immutable ON financial.audit_logs;
CREATE TRIGGER trg_financial_audit_immutable
BEFORE UPDATE OR DELETE ON financial.audit_logs
FOR EACH ROW EXECUTE FUNCTION financial.prevent_audit_modification();

-- ─────────────────────────────────────────────────────────────────────────────
-- sales.property_sales — add escrow_account_id FK (nullable)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE sales.property_sales
  ADD COLUMN IF NOT EXISTS escrow_account_id UUID;
CREATE INDEX IF NOT EXISTS idx_sales_escrow_account ON sales.property_sales (escrow_account_id);
