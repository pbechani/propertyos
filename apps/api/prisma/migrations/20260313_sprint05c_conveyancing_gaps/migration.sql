-- Sprint 05-c Conveyancing Gaps
-- Adds:
--   1. lifecycle_phase column on conveyancing.cases
--   2. conveyancing.government_interactions table
--   3. conveyancing.case_lifecycle_history table

-- ------------------------------------------------------------------
-- 1. Add lifecycle_phase to existing cases table
-- ------------------------------------------------------------------
ALTER TABLE conveyancing.cases
  ADD COLUMN IF NOT EXISTS lifecycle_phase SMALLINT NOT NULL DEFAULT 1;

-- ------------------------------------------------------------------
-- 2. Government Department Interactions
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conveyancing.government_interactions (
  id                   UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id              UUID         NOT NULL,
  department           VARCHAR(50)  NOT NULL,
  interaction_type     VARCHAR(50)  NOT NULL,
  reference_number     VARCHAR(100),
  description          VARCHAR(500) NOT NULL,
  submitted_at         TIMESTAMPTZ,
  expected_response_at DATE,
  resolved_at          TIMESTAMPTZ,
  status               VARCHAR(30)  NOT NULL DEFAULT 'pending',
  notes                TEXT,
  recorded_by          UUID         NOT NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_gov_interaction_case
    FOREIGN KEY (case_id) REFERENCES conveyancing.cases (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_gov_case_dept
  ON conveyancing.government_interactions (case_id, department);

CREATE INDEX IF NOT EXISTS idx_conv_gov_status_due
  ON conveyancing.government_interactions (status, expected_response_at);

-- ------------------------------------------------------------------
-- 3. Case Lifecycle History
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conveyancing.case_lifecycle_history (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id       UUID        NOT NULL,
  from_phase    SMALLINT,
  to_phase      SMALLINT    NOT NULL,
  from_status   VARCHAR(30),
  to_status     VARCHAR(30) NOT NULL,
  triggered_by  UUID        NOT NULL,
  trigger       VARCHAR(50) NOT NULL DEFAULT 'manual',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_lifecycle_case
    FOREIGN KEY (case_id) REFERENCES conveyancing.cases (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_lifecycle_case
  ON conveyancing.case_lifecycle_history (case_id, created_at DESC);
