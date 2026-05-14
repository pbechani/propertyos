-- Sprint 03 (cont.): Lead Management Module
-- Creates sales.leads, sales.lead_activities, sales.lead_tasks
--
-- Multi-tenant design:
--   • Every row is scoped to company_id (identity.companies)
--   • assigned_to references the agent/user within that company
--   • Cross-company access is blocked at application layer via active_company_id JWT claim
-- ─────────────────────────────────────────────────────────────────────────────

-- ============================================================
-- sales.leads
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.leads (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  company_id        UUID          NOT NULL,  -- app-layer ref: identity.companies(id)
  assigned_to       UUID,                    -- app-layer ref: identity.users(id)  (the agent)
  created_by        UUID          NOT NULL,  -- app-layer ref: identity.users(id)

  -- Contact
  name              VARCHAR(255)  NOT NULL,
  email             VARCHAR(255),
  phone             VARCHAR(50),
  address           TEXT,

  -- Lead attributes
  source            VARCHAR(100),            -- 'zillow','website','referral','facebook_ad', etc.
  type              VARCHAR(20)   NOT NULL DEFAULT 'buyer'
                      CHECK (type IN ('buyer','seller','renter','investor')),
  timeline          VARCHAR(100),
  budget_min        NUMERIC(18,2),
  budget_max        NUMERIC(18,2),
  budget_currency   CHAR(3)       NOT NULL DEFAULT 'ZAR',
  preferences       TEXT,

  -- Pipeline
  temperature       VARCHAR(20)   NOT NULL DEFAULT 'cold'
                      CHECK (temperature IN ('hot','warm','cold','nurture')),
  stage             VARCHAR(30)   NOT NULL DEFAULT 'new'
                      CHECK (stage IN ('new','contacted','qualified','active','under_contract','closed','lost')),
  prequalified      BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Financials
  deal_value        NUMERIC(18,2),           -- expected deal value

  -- Tracking
  notes             TEXT,
  next_follow_up    TIMESTAMPTZ,
  last_contact_at   TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,
  lost_reason       TEXT,

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_company         ON sales.leads (company_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to     ON sales.leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_stage           ON sales.leads (stage);
CREATE INDEX IF NOT EXISTS idx_leads_temperature     ON sales.leads (temperature);
CREATE INDEX IF NOT EXISTS idx_leads_type            ON sales.leads (type);
CREATE INDEX IF NOT EXISTS idx_leads_company_stage   ON sales.leads (company_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_company_created ON sales.leads (company_id, created_at DESC);

-- ============================================================
-- sales.lead_activities  (immutable timeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.lead_activities (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID          NOT NULL REFERENCES sales.leads(id) ON DELETE CASCADE,
  company_id  UUID          NOT NULL,  -- denormalized for fast tenant queries
  actor_id    UUID          NOT NULL,  -- app-layer ref: identity.users(id)

  type        VARCHAR(30)   NOT NULL DEFAULT 'note'
                CHECK (type IN ('email','call','sms','meeting','note','stage_change')),
  description TEXT          NOT NULL,
  metadata    JSONB         NOT NULL DEFAULT '{}',  -- e.g. {from_stage, to_stage} for stage_change

  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead       ON sales.lead_activities (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_company    ON sales.lead_activities (company_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created    ON sales.lead_activities (lead_id, created_at DESC);

-- Append-only guard: activities form an immutable audit trail
CREATE OR REPLACE FUNCTION sales.fn_protect_lead_activities()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'sales.lead_activities is append-only — no updates or deletes allowed';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_activities_immutable ON sales.lead_activities;
CREATE TRIGGER trg_lead_activities_immutable
BEFORE UPDATE OR DELETE ON sales.lead_activities
FOR EACH ROW EXECUTE FUNCTION sales.fn_protect_lead_activities();

-- ============================================================
-- sales.lead_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS sales.lead_tasks (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID          NOT NULL REFERENCES sales.leads(id) ON DELETE CASCADE,
  company_id   UUID          NOT NULL,  -- denormalized for fast tenant queries
  assigned_to  UUID,                    -- app-layer ref: identity.users(id)
  created_by   UUID          NOT NULL,  -- app-layer ref: identity.users(id)

  title        VARCHAR(255)  NOT NULL,
  type         VARCHAR(30)   NOT NULL DEFAULT 'follow_up'
                 CHECK (type IN ('call','email','meeting','follow_up')),
  priority     VARCHAR(20)   NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('high','medium','low')),
  due_date     DATE,

  completed    BOOLEAN       NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID,                    -- app-layer ref: identity.users(id)

  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead        ON sales.lead_tasks (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_company     ON sales.lead_tasks (company_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_assigned    ON sales.lead_tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_due         ON sales.lead_tasks (company_id, due_date);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_completed   ON sales.lead_tasks (company_id, completed, due_date);
