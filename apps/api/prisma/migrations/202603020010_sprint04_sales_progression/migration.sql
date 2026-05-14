-- Sprint 04: Sales Progression & Legal Workflow
-- Creates all sales.* tables for the 14-stage property purchase pipeline

-- ============================================================
-- sales.stage_configs  (configurable per country)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.stage_configs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country               CHAR(2)     NOT NULL,
  stage_number          SMALLINT    NOT NULL,
  stage_name            VARCHAR(100) NOT NULL,
  description           TEXT,
  responsible_role      VARCHAR(50),                    -- agent | conveyancer | buyer | seller | inspector
  is_blocker            BOOLEAN     NOT NULL DEFAULT FALSE,
  government_dept       VARCHAR(100),                   -- null if no government interaction
  typical_duration_days SMALLINT,
  required_documents    JSONB       NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country, stage_number)
);

CREATE INDEX IF NOT EXISTS idx_stage_configs_country ON sales.stage_configs (country);

-- ============================================================
-- Seed: 14 default stages for ZA (South Africa — primary market)
-- ============================================================
INSERT INTO sales.stage_configs
  (country, stage_number, stage_name, description, responsible_role, is_blocker, government_dept, typical_duration_days, required_documents)
VALUES
  ('ZA',  1, 'Offer Submitted',               'Buyer submits formal offer to purchase',                              'agent',        FALSE, NULL,                    2,  '["offer_to_purchase"]'),
  ('ZA',  2, 'Offer Accepted',                'Seller accepts or counters the offer',                               'agent',        FALSE, NULL,                    2,  '[]'),
  ('ZA',  3, 'Sale Agreement Drafted',        'Conveyancer drafts the sale agreement',                              'conveyancer',  FALSE, NULL,                    5,  '["draft_sale_agreement"]'),
  ('ZA',  4, 'Sale Agreement Signed',         'Both parties sign the sale agreement',                               'conveyancer',  TRUE,  NULL,                    3,  '["signed_sale_agreement"]'),
  ('ZA',  5, 'Deposit to Escrow',             'Buyer pays deposit into conveyancer trust account',                  'buyer',        TRUE,  NULL,                    5,  '["proof_of_payment"]'),
  ('ZA',  6, 'Title Deed Search',             'Conveyancer searches Land Registry for encumbrances',                'conveyancer',  FALSE, 'Land Registry',         10, '["title_deed_search_result"]'),
  ('ZA',  7, 'Property Survey / Valuation',   'Independent valuation and physical inspection of property',          'inspector',    FALSE, NULL,                    7,  '["valuation_report"]'),
  ('ZA',  8, 'Bond / Mortgage Approval',      'Buyer obtains mortgage bond approval from bank',                    'buyer',        FALSE, NULL,                    14, '["bond_approval_letter"]'),
  ('ZA',  9, 'Compliance Certificates',       'Electrical, beetle, gas, plumbing compliance certificates obtained', 'conveyancer',  FALSE, NULL,                    10, '["electrical_certificate","beetle_certificate"]'),
  ('ZA', 10, 'Rates Clearance',              'Municipality rates clearance certificate obtained',                  'conveyancer',  FALSE, 'Municipality',          14, '["rates_clearance_certificate"]'),
  ('ZA', 11, 'Deeds Office Submission',       'Transfer documents lodged at Deeds Office for examination',          'conveyancer',  FALSE, 'Deeds Office',          21, '["transfer_documents","power_of_attorney"]'),
  ('ZA', 12, 'Transfer Duty Payment',         'Buyer pays SARS transfer duty',                                     'buyer',        TRUE,  'SARS / Tax Authority',  7,  '["transfer_duty_receipt"]'),
  ('ZA', 13, 'Deeds Office Registration',     'Deeds Office registers transfer of ownership',                      'conveyancer',  TRUE,  'Deeds Office',          7,  '["registered_title_deed"]'),
  ('ZA', 14, 'Final Payment & Handover',      'Balance purchase price paid; keys handed to buyer',                 'conveyancer',  FALSE, NULL,                    1,  '["proof_of_final_payment","handover_certificate"]')
ON CONFLICT (country, stage_number) DO NOTHING;

-- ============================================================
-- sales.property_sales  (master sale record)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.property_sales (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id             UUID         NOT NULL,              -- app-layer ref: property.properties(id)
  sale_reference          VARCHAR(50)  UNIQUE NOT NULL,
  seller_id               UUID         NOT NULL,              -- app-layer ref: identity.users(id)
  buyer_id                UUID,                               -- may be set after offer acceptance
  agent_id                UUID,                               -- app-layer ref: identity.users(id)
  buyer_conveyancer_id    UUID,                               -- app-layer ref: identity.users(id)
  seller_conveyancer_id   UUID,                               -- app-layer ref: identity.users(id)
  agreed_price            NUMERIC(18,2) NOT NULL,
  currency                CHAR(3)       NOT NULL DEFAULT 'ZAR',
  deposit_amount          NUMERIC(18,2),
  status                  VARCHAR(30)   NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','completed','cancelled','disputed')),
  current_stage           SMALLINT      NOT NULL DEFAULT 1,
  country                 CHAR(2)       NOT NULL DEFAULT 'ZA',
  company_id              UUID,                               -- app-layer ref: identity.companies(id)
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_sales_property  ON sales.property_sales (property_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_seller    ON sales.property_sales (seller_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_buyer     ON sales.property_sales (buyer_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_agent     ON sales.property_sales (agent_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_status    ON sales.property_sales (status);
CREATE INDEX IF NOT EXISTS idx_property_sales_stage     ON sales.property_sales (current_stage);
CREATE INDEX IF NOT EXISTS idx_property_sales_company   ON sales.property_sales (company_id);

-- ============================================================
-- sales.sale_stage_progress  (per-sale stage tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.sale_stage_progress (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID        NOT NULL REFERENCES sales.property_sales(id) ON DELETE CASCADE,
  stage_number  SMALLINT    NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'not_started'
                  CHECK (status IN ('not_started','in_progress','completed','blocked','skipped')),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  completed_by  UUID,                           -- app-layer ref: identity.users(id)
  days_in_stage INTEGER,                        -- computed by application on read/complete
  notes         TEXT,
  UNIQUE(sale_id, stage_number)
);

CREATE INDEX IF NOT EXISTS idx_stage_progress_sale    ON sales.sale_stage_progress (sale_id);
CREATE INDEX IF NOT EXISTS idx_stage_progress_status  ON sales.sale_stage_progress (status);

-- ============================================================
-- sales.stage_documents  (documents uploaded per stage)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.stage_documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID        NOT NULL REFERENCES sales.property_sales(id) ON DELETE CASCADE,
  stage_number    SMALLINT    NOT NULL,
  document_name   VARCHAR(255) NOT NULL,
  document_type   VARCHAR(100),
  url             TEXT,
  version         SMALLINT    NOT NULL DEFAULT 1,
  uploaded_by     UUID,                           -- app-layer ref: identity.users(id)
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','received','verified','rejected')),
  is_required     BOOLEAN     NOT NULL DEFAULT FALSE,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stage_documents_sale    ON sales.stage_documents (sale_id);
CREATE INDEX IF NOT EXISTS idx_stage_documents_stage   ON sales.stage_documents (sale_id, stage_number);

-- ============================================================
-- sales.government_interactions  (gov dept tracking per stage)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.government_interactions (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id                   UUID        NOT NULL REFERENCES sales.property_sales(id) ON DELETE CASCADE,
  stage_number              SMALLINT    NOT NULL,
  department_name           VARCHAR(100) NOT NULL,
  application_reference     VARCHAR(100),
  submission_date           DATE,
  expected_completion_date  DATE,
  actual_completion_date    DATE,
  status                    VARCHAR(30) NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','submitted','in_review','approved','rejected')),
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gov_interactions_sale ON sales.government_interactions (sale_id);

-- ============================================================
-- sales.sale_issues  (flagged issues / disputes)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.sale_issues (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id       UUID        NOT NULL REFERENCES sales.property_sales(id) ON DELETE CASCADE,
  stage_number  SMALLINT,
  reported_by   UUID,                           -- app-layer ref: identity.users(id)
  issue_type    VARCHAR(50) CHECK (issue_type IN ('delay','missing_doc','dispute','other')),
  description   TEXT        NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_progress','resolved')),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_issues_sale    ON sales.sale_issues (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_issues_status  ON sales.sale_issues (status);

-- ============================================================
-- sales.sale_messages  (communication hub per sale)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.sale_messages (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id          UUID        NOT NULL REFERENCES sales.property_sales(id) ON DELETE CASCADE,
  sender_id        UUID        NOT NULL,                    -- app-layer ref: identity.users(id)
  message          TEXT        NOT NULL,
  attachments      JSONB       NOT NULL DEFAULT '[]',
  visible_to_roles JSONB       NOT NULL DEFAULT '["buyer","seller","agent","conveyancer"]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_messages_sale      ON sales.sale_messages (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_messages_sender    ON sales.sale_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_sale_messages_created   ON sales.sale_messages (created_at DESC);

-- ============================================================
-- sales.audit_logs  (immutable — append-only via trigger)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  actor_id      UUID,                           -- app-layer ref: identity.users(id)
  actor_role    VARCHAR(50),
  company_id    UUID,                           -- app-layer ref: identity.companies(id)
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id   UUID,
  payload       JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_audit_resource  ON sales.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_actor     ON sales.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_sales_audit_action    ON sales.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_sales_audit_created   ON sales.audit_logs (created_at DESC);

-- Prevent UPDATE or DELETE on sales.audit_logs (append-only)
CREATE OR REPLACE FUNCTION sales.fn_protect_audit_logs()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'sales.audit_logs is append-only — UPDATE and DELETE are not allowed';
END;
$$;

DROP TRIGGER IF EXISTS trg_no_update_sales_audit_logs ON sales.audit_logs;
CREATE TRIGGER trg_no_update_sales_audit_logs
  BEFORE UPDATE OR DELETE ON sales.audit_logs
  FOR EACH ROW EXECUTE FUNCTION sales.fn_protect_audit_logs();

-- ============================================================
-- updated_at auto-maintenance for property_sales
-- ============================================================
CREATE OR REPLACE FUNCTION sales.fn_set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_property_sales_updated_at ON sales.property_sales;
CREATE TRIGGER trg_property_sales_updated_at
  BEFORE UPDATE ON sales.property_sales
  FOR EACH ROW EXECUTE FUNCTION sales.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_gov_interactions_updated_at ON sales.government_interactions;
CREATE TRIGGER trg_gov_interactions_updated_at
  BEFORE UPDATE ON sales.government_interactions
  FOR EACH ROW EXECUTE FUNCTION sales.fn_set_updated_at();
