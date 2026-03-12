-- Sprint 05-b: Conveyancing Case Management Platform
-- Migration: 202603110024_sprint05b_conveyancing
-- Date: 2026-03-11

-- ─────────────────────────────────────────────────────────────────────────────
-- Schema
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS conveyancing;

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.cases
-- Wraps a sales.property_sales record with firm ownership + legal metadata.
-- Cross-schema reference via app-layer UUID (no FK across schemas — PDR-006)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.cases (
  id                       UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_reference           VARCHAR(50)  NOT NULL,
  sale_id                  UUID         NOT NULL,
  firm_id                  UUID         NOT NULL,
  lead_conveyancer_id      UUID         NOT NULL,
  support_staff_ids        JSONB        NOT NULL DEFAULT '[]',
  case_type                VARCHAR(30)  NOT NULL DEFAULT 'transfer',
  priority                 VARCHAR(20)  NOT NULL DEFAULT 'normal',
  status                   VARCHAR(30)  NOT NULL DEFAULT 'open',
  opened_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  target_registration_date DATE,
  actual_registration_date DATE,
  country                  CHAR(2)      NOT NULL DEFAULT 'ZA',
  notes                    TEXT,
  metadata                 JSONB        NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cases_reference UNIQUE (case_reference)
);
CREATE INDEX IF NOT EXISTS idx_conv_cases_firm_status    ON conveyancing.cases (firm_id, status);
CREATE INDEX IF NOT EXISTS idx_conv_cases_conveyancer    ON conveyancing.cases (lead_conveyancer_id);
CREATE INDEX IF NOT EXISTS idx_conv_cases_sale_id        ON conveyancing.cases (sale_id);
CREATE INDEX IF NOT EXISTS idx_conv_cases_status_country ON conveyancing.cases (status, country);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.task_templates
-- Pre-defined tasks auto-created when a case stage opens.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.task_templates (
  id                              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id                         UUID,
  country                         CHAR(2)      NOT NULL DEFAULT 'ZA',
  case_type                       VARCHAR(30)  NOT NULL DEFAULT 'transfer',
  stage_number                    SMALLINT     NOT NULL,
  title                           VARCHAR(255) NOT NULL,
  description                     TEXT,
  default_due_days_from_stage_open SMALLINT,
  responsible_role                VARCHAR(50),
  is_blocker                      BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order                      SMALLINT     NOT NULL DEFAULT 0,
  is_active                       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_task_templates_lookup ON conveyancing.task_templates (country, case_type, stage_number);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.case_tasks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.case_tasks (
  id                 UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id            UUID         NOT NULL REFERENCES conveyancing.cases(id) ON DELETE CASCADE,
  template_task_id   UUID         REFERENCES conveyancing.task_templates(id),
  title              VARCHAR(255) NOT NULL,
  description        TEXT,
  stage_number       SMALLINT,
  responsible_id     UUID,
  responsible_role   VARCHAR(50),
  due_date           DATE,
  status             VARCHAR(20)  NOT NULL DEFAULT 'pending',
  completed_at       TIMESTAMPTZ,
  completed_by       UUID,
  escalated_at       TIMESTAMPTZ,
  escalation_reason  TEXT,
  priority           VARCHAR(20)  NOT NULL DEFAULT 'normal',
  is_blocker         BOOLEAN      NOT NULL DEFAULT FALSE,
  notes              TEXT,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_tasks_case_status    ON conveyancing.case_tasks (case_id, status);
CREATE INDEX IF NOT EXISTS idx_conv_tasks_responsible    ON conveyancing.case_tasks (responsible_id, due_date);
CREATE INDEX IF NOT EXISTS idx_conv_tasks_firm_due       ON conveyancing.case_tasks (due_date) WHERE status NOT IN ('completed', 'waived');

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.case_notes  (internal, never visible to clients)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.case_notes (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id     UUID         NOT NULL REFERENCES conveyancing.cases(id) ON DELETE CASCADE,
  author_id   UUID         NOT NULL,
  content     TEXT         NOT NULL,
  attachments JSONB        NOT NULL DEFAULT '[]',
  is_pinned   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_notes_case_id ON conveyancing.case_notes (case_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.deadlines
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.deadlines (
  id                 UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id            UUID         NOT NULL REFERENCES conveyancing.cases(id) ON DELETE CASCADE,
  task_id            UUID         REFERENCES conveyancing.case_tasks(id),
  deadline_type      VARCHAR(50)  NOT NULL,
  description        VARCHAR(255),
  due_date           DATE         NOT NULL,
  status             VARCHAR(20)  NOT NULL DEFAULT 'active',
  extension_reason   TEXT,
  extended_due_date  DATE,
  reminder_sent_at   TIMESTAMPTZ,
  escalated_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_deadlines_case_due ON conveyancing.deadlines (case_id, due_date);
CREATE INDEX IF NOT EXISTS idx_conv_deadlines_active   ON conveyancing.deadlines (due_date) WHERE status = 'active';

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.trust_accounts  (1 per firm per currency)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.trust_accounts (
  id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id      UUID         NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  account_number_enc VARCHAR(255),  -- encrypted; never returned in API
  bank_name    VARCHAR(100),
  currency     CHAR(3)      NOT NULL DEFAULT 'ZAR',
  status       VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trust_account_firm_currency UNIQUE (firm_id, currency)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.trust_ledger_entries  (APPEND-ONLY — NEVER UPDATE/DELETE)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.trust_ledger_entries (
  id               UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_account_id UUID          NOT NULL REFERENCES conveyancing.trust_accounts(id),
  case_id          UUID          NOT NULL REFERENCES conveyancing.cases(id),
  entry_type       VARCHAR(50)   NOT NULL,
  description      TEXT          NOT NULL,
  amount           NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency         CHAR(3)       NOT NULL DEFAULT 'ZAR',
  direction        VARCHAR(10)   NOT NULL CHECK (direction IN ('credit', 'debit')),
  reference        VARCHAR(100),
  received_from    VARCHAR(255),
  paid_to          VARCHAR(255),
  payment_date     DATE          NOT NULL,
  recorded_by      UUID          NOT NULL,
  approved_by      UUID,
  idempotency_key  VARCHAR(100),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trust_ledger_idempotency UNIQUE (idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_conv_trust_ledger_account   ON conveyancing.trust_ledger_entries (trust_account_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_conv_trust_ledger_case       ON conveyancing.trust_ledger_entries (case_id);

-- Prevent UPDATE or DELETE on trust_ledger_entries (append-only)
CREATE OR REPLACE FUNCTION conveyancing.fn_protect_trust_ledger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'conveyancing.trust_ledger_entries is append-only — UPDATE and DELETE are not allowed';
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_trust_ledger ON conveyancing.trust_ledger_entries;
CREATE TRIGGER trg_protect_trust_ledger
  BEFORE UPDATE OR DELETE ON conveyancing.trust_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION conveyancing.fn_protect_trust_ledger();

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.fee_schedules
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.fee_schedules (
  id             UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country        CHAR(2)      NOT NULL,
  schedule_name  VARCHAR(100) NOT NULL,
  fee_type       VARCHAR(30)  NOT NULL,
  effective_from DATE         NOT NULL,
  effective_to   DATE,
  currency       CHAR(3)      NOT NULL DEFAULT 'ZAR',
  bands          JSONB        NOT NULL,
  vat_rate       NUMERIC(5,4) NOT NULL DEFAULT 0.15,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_fee_schedules_lookup ON conveyancing.fee_schedules (country, fee_type, effective_from);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.invoices
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.invoices (
  id             UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50)   NOT NULL,
  case_id        UUID          NOT NULL REFERENCES conveyancing.cases(id),
  firm_id        UUID          NOT NULL,
  billed_to_id   UUID          NOT NULL,
  invoice_type   VARCHAR(30)   NOT NULL,
  subtotal       NUMERIC(18,2) NOT NULL,
  vat_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_amount   NUMERIC(18,2) NOT NULL,
  currency       CHAR(3)       NOT NULL DEFAULT 'ZAR',
  status         VARCHAR(20)   NOT NULL DEFAULT 'draft',
  issue_date     DATE,
  due_date       DATE,
  paid_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
  paid_at        TIMESTAMPTZ,
  document_url   TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_invoice_number UNIQUE (invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_conv_invoices_case   ON conveyancing.invoices (case_id);
CREATE INDEX IF NOT EXISTS idx_conv_invoices_firm   ON conveyancing.invoices (firm_id, status);
CREATE INDEX IF NOT EXISTS idx_conv_invoices_billed ON conveyancing.invoices (billed_to_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.invoice_line_items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.invoice_line_items (
  id          UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id  UUID          NOT NULL REFERENCES conveyancing.invoices(id) ON DELETE CASCADE,
  description VARCHAR(255)  NOT NULL,
  line_type   VARCHAR(50)   NOT NULL,
  quantity    NUMERIC(8,2)  NOT NULL DEFAULT 1,
  unit_price  NUMERIC(18,2) NOT NULL,
  amount      NUMERIC(18,2) NOT NULL,
  sort_order  SMALLINT      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_line_items_invoice ON conveyancing.invoice_line_items (invoice_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.document_templates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.document_templates (
  id                           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id                      UUID,
  country                      CHAR(2)      NOT NULL DEFAULT 'ZA',
  case_type                    VARCHAR(30)  NOT NULL DEFAULT 'transfer',
  template_name                VARCHAR(100) NOT NULL,
  document_type                VARCHAR(50)  NOT NULL,
  template_url                 TEXT         NOT NULL,
  required_fields              JSONB        NOT NULL DEFAULT '[]',
  requires_buyer_signature     BOOLEAN      NOT NULL DEFAULT FALSE,
  requires_seller_signature    BOOLEAN      NOT NULL DEFAULT FALSE,
  requires_conveyancer_signature BOOLEAN    NOT NULL DEFAULT FALSE,
  version                      SMALLINT     NOT NULL DEFAULT 1,
  is_active                    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.generated_documents
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.generated_documents (
  id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id          UUID         NOT NULL REFERENCES conveyancing.cases(id),
  template_id      UUID         REFERENCES conveyancing.document_templates(id),
  document_name    VARCHAR(255) NOT NULL,
  document_type    VARCHAR(50)  NOT NULL,
  generated_by     UUID         NOT NULL,
  document_url     TEXT,
  status           VARCHAR(20)  NOT NULL DEFAULT 'draft',
  field_values     JSONB        NOT NULL DEFAULT '{}',
  signatures       JSONB        NOT NULL DEFAULT '[]',
  fully_signed_at  TIMESTAMPTZ,
  hash             VARCHAR(64),
  esign_provider   VARCHAR(30),
  esign_envelope_id VARCHAR(255),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_docs_case_type ON conveyancing.generated_documents (case_id, document_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_docs_envelope ON conveyancing.generated_documents (esign_envelope_id)
  WHERE esign_envelope_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.client_portal_access
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.client_portal_access (
  id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id          UUID         NOT NULL REFERENCES conveyancing.cases(id),
  user_id          UUID         NOT NULL,
  party_role       VARCHAR(20)  NOT NULL,
  token_hash       VARCHAR(64)  NOT NULL,
  token_expires_at TIMESTAMPTZ  NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_by       UUID         NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_portal_token UNIQUE (token_hash)
);
CREATE INDEX IF NOT EXISTS idx_conv_portal_case   ON conveyancing.client_portal_access (case_id, is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- conveyancing.audit_logs  (append-only)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conveyancing.audit_logs (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id      UUID         NOT NULL DEFAULT gen_random_uuid(),
  actor_id      UUID,
  actor_role    VARCHAR(50),
  firm_id       UUID,
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id   UUID,
  payload       JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_audit_resource ON conveyancing.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_conv_audit_actor    ON conveyancing.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_conv_audit_action   ON conveyancing.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_conv_audit_created  ON conveyancing.audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION conveyancing.fn_protect_audit_logs()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'conveyancing.audit_logs is append-only — UPDATE and DELETE are not allowed';
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_conv_audit ON conveyancing.audit_logs;
CREATE TRIGGER trg_protect_conv_audit
  BEFORE UPDATE OR DELETE ON conveyancing.audit_logs
  FOR EACH ROW EXECUTE FUNCTION conveyancing.fn_protect_audit_logs();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: SA LSSA Transfer Fee Schedule 2024
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO conveyancing.fee_schedules
  (country, schedule_name, fee_type, effective_from, currency, vat_rate, is_active, bands)
VALUES
  ('ZA', 'LSSA Transfer Fee Scale 2024', 'transfer', '2024-01-01', 'ZAR', 0.15, TRUE,
   '[
     {"from":0,       "to":100000,  "base_fee":1053,  "pct_over_from":0},
     {"from":100001,  "to":200000,  "base_fee":1580,  "pct_over_from":0},
     {"from":200001,  "to":300000,  "base_fee":2213,  "pct_over_from":0},
     {"from":300001,  "to":400000,  "base_fee":2741,  "pct_over_from":0},
     {"from":400001,  "to":500000,  "base_fee":3532,  "pct_over_from":0},
     {"from":500001,  "to":750000,  "base_fee":4512,  "pct_over_from":0},
     {"from":750001,  "to":1000000, "base_fee":6076,  "pct_over_from":0},
     {"from":1000001, "to":1500000, "base_fee":8185,  "pct_over_from":0},
     {"from":1500001, "to":2000000, "base_fee":10821, "pct_over_from":0},
     {"from":2000001, "to":2500000, "base_fee":13457, "pct_over_from":0},
     {"from":2500001, "to":3000000, "base_fee":15566, "pct_over_from":0},
     {"from":3000001, "to":null,    "base_fee":17149, "pct_over_from":0.003}
   ]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Seed: SA Bond Registration Fee Scale 2024
INSERT INTO conveyancing.fee_schedules
  (country, schedule_name, fee_type, effective_from, currency, vat_rate, is_active, bands)
VALUES
  ('ZA', 'LSSA Bond Registration Scale 2024', 'bond_registration', '2024-01-01', 'ZAR', 0.15, TRUE,
   '[
     {"from":0,       "to":100000,  "base_fee":897,   "pct_over_from":0},
     {"from":100001,  "to":200000,  "base_fee":1344,  "pct_over_from":0},
     {"from":200001,  "to":300000,  "base_fee":1882,  "pct_over_from":0},
     {"from":300001,  "to":500000,  "base_fee":2328,  "pct_over_from":0},
     {"from":500001,  "to":750000,  "base_fee":3836,  "pct_over_from":0},
     {"from":750001,  "to":1000000, "base_fee":5164,  "pct_over_from":0},
     {"from":1000001, "to":1500000, "base_fee":6861,  "pct_over_from":0},
     {"from":1500001, "to":null,    "base_fee":9197,  "pct_over_from":0.002}
   ]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Seed: Default ZA Transfer task templates
INSERT INTO conveyancing.task_templates
  (country, case_type, stage_number, title, responsible_role, default_due_days_from_stage_open, is_blocker, sort_order)
VALUES
  ('ZA','transfer', 5,  'Confirm deposit receipt in trust account',             'conveyancer', 3,  TRUE,  1),
  ('ZA','transfer', 6,  'Submit title deed search to Land Registry',             'conveyancer', 2,  FALSE, 1),
  ('ZA','transfer', 6,  'Obtain Deeds Office search result',                     'conveyancer', 14, FALSE, 2),
  ('ZA','transfer', 6,  'Check for existing bonds / endorsements',               'conveyancer', 14, FALSE, 3),
  ('ZA','transfer', 9,  'Instruct seller to obtain electrical certificate',      'conveyancer', 3,  FALSE, 1),
  ('ZA','transfer', 9,  'Confirm compliance certificates received',              'conveyancer', 21, TRUE,  2),
  ('ZA','transfer', 10, 'Apply for rates clearance certificate',                 'conveyancer', 3,  FALSE, 1),
  ('ZA','transfer', 10, 'Confirm rates clearance received',                      'conveyancer', 30, TRUE,  2),
  ('ZA','transfer', 11, 'Prepare transfer deed draft',                           'conveyancer', 5,  FALSE, 1),
  ('ZA','transfer', 11, 'Prepare Power of Attorney documents',                   'conveyancer', 5,  FALSE, 2),
  ('ZA','transfer', 11, 'Send POA to buyer for signature',                       'conveyancer', 7,  TRUE,  3),
  ('ZA','transfer', 11, 'Send transfer documents to Deeds Office',               'conveyancer', 14, FALSE, 4),
  ('ZA','transfer', 12, 'Confirm transfer duty payment received from buyer',     'conveyancer', 3,  TRUE,  1),
  ('ZA','transfer', 12, 'Submit transfer duty via SARS eFiling',                 'conveyancer', 5,  TRUE,  2),
  ('ZA','transfer', 13, 'Track Deeds Office registration queue',                 'paralegal',   1,  FALSE, 1),
  ('ZA','transfer', 13, 'Receive registered title deed from Deeds Office',       'conveyancer', 30, TRUE,  2),
  ('ZA','transfer', 14, 'Release net proceeds to seller',                        'conveyancer', 1,  FALSE, 1),
  ('ZA','transfer', 14, 'Confirm keys handover',                                 'conveyancer', 1,  FALSE, 2),
  ('ZA','transfer', 14, 'Send title deed to buyer/bank',                         'conveyancer', 3,  FALSE, 3),
  ('ZA','transfer', 14, 'Close trust ledger for case',                           'conveyancer', 5,  TRUE,  4)
ON CONFLICT DO NOTHING;
