-- Create agent_workflows table for marketing automation workflows
CREATE TABLE IF NOT EXISTS property.agent_workflows (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL,
  created_by      uuid        NOT NULL,
  name            text        NOT NULL,
  description     text,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('active', 'inactive', 'draft')),
  trigger_type    text        NOT NULL DEFAULT '',
  steps           jsonb       NOT NULL DEFAULT '[]',
  performance     jsonb       NOT NULL DEFAULT '{"sent":0,"opened":0,"clicked":0}',
  enrolled_count  integer     NOT NULL DEFAULT 0,
  completed_count integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_workflows_company
  ON property.agent_workflows (company_id);

CREATE INDEX IF NOT EXISTS idx_agent_workflows_created_by
  ON property.agent_workflows (created_by);
