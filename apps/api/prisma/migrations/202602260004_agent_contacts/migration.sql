-- Migration: 202602260004_agent_contacts
-- Creates property.agent_contacts to log Contact Agent and Schedule Call requests.

CREATE TABLE IF NOT EXISTS property.agent_contacts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id       UUID        NOT NULL,
  requester_id   UUID,                          -- NULL when submitted anonymously
  contact_type   VARCHAR(20) NOT NULL           -- 'contact' | 'schedule_call'
                 CHECK (contact_type IN ('contact', 'schedule_call')),
  message        TEXT,
  requester_name VARCHAR(120),
  requester_email VARCHAR(255),
  requester_phone VARCHAR(30),
  preferred_date  TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'acknowledged', 'closed')),
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_contacts_agent
  ON property.agent_contacts (agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_contacts_requester
  ON property.agent_contacts (requester_id)
  WHERE requester_id IS NOT NULL;

COMMENT ON TABLE property.agent_contacts IS
  'Logs every Contact Agent and Schedule Call request sent to a property agent.';
