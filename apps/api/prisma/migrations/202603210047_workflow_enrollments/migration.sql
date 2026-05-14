-- Workflow enrollments: tracks a contact/lead progressing through a workflow graph
CREATE TABLE IF NOT EXISTS property.workflow_enrollments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id     uuid        NOT NULL REFERENCES property.agent_workflows(id) ON DELETE CASCADE,
  company_id      uuid        NOT NULL,
  lead_id         uuid,
  lead_email      text,
  lead_name       text,
  status          text        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'failed')),
  current_node_id text,         -- ID of the graph node to process next
  resume_at       timestamptz,  -- when to resume after a delay node
  context         jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wf_enrollments_workflow
  ON property.workflow_enrollments (workflow_id);

CREATE INDEX IF NOT EXISTS idx_wf_enrollments_lead
  ON property.workflow_enrollments (lead_id)
  WHERE lead_id IS NOT NULL;

-- Partial index for the scheduler: only paused enrollments with a resume time
CREATE INDEX IF NOT EXISTS idx_wf_enrollments_resume
  ON property.workflow_enrollments (resume_at)
  WHERE status = 'paused' AND resume_at IS NOT NULL;

-- Step execution log per enrollment
CREATE TABLE IF NOT EXISTS property.workflow_step_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid        NOT NULL REFERENCES property.workflow_enrollments(id) ON DELETE CASCADE,
  step_node_id    text        NOT NULL,
  step_type       text        NOT NULL,
  step_label      text,
  status          text        NOT NULL CHECK (status IN ('executed', 'skipped', 'failed', 'waiting')),
  result          jsonb       NOT NULL DEFAULT '{}',
  executed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wf_step_logs_enrollment
  ON property.workflow_step_logs (enrollment_id);
