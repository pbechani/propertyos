-- Migration: inspection_requests
-- Stores property inspection requests submitted by agents.

CREATE TABLE IF NOT EXISTS property.inspection_requests (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID          NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  requested_by        UUID          NOT NULL,
  status              VARCHAR(30)   NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  inspection_types    JSONB         NOT NULL DEFAULT '[]',
  urgency             VARCHAR(20)   NOT NULL DEFAULT 'standard'
                        CHECK (urgency IN ('standard', 'priority', 'rush')),
  preferred_date      DATE          NOT NULL,
  preferred_time      VARCHAR(10)   NOT NULL,
  alternate_date      DATE,
  alternate_time      VARCHAR(10),
  inspector_name      VARCHAR(255),
  inspector_company   VARCHAR(255),
  inspector_phone     VARCHAR(50),
  inspector_email     VARCHAR(255),
  access_method       VARCHAR(30)   NOT NULL DEFAULT 'lockbox'
                        CHECK (access_method IN ('lockbox', 'occupied', 'contact')),
  lockbox_code        VARCHAR(50),
  contact_person      VARCHAR(255),
  contact_phone       VARCHAR(50),
  contact_email       VARCHAR(255),
  areas_of_concern    TEXT,
  special_instructions TEXT,
  notify_client       BOOLEAN       NOT NULL DEFAULT TRUE,
  send_report_to      VARCHAR(20)   NOT NULL DEFAULT 'both'
                        CHECK (send_report_to IN ('me', 'client', 'both')),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_property
  ON property.inspection_requests (property_id);

CREATE INDEX IF NOT EXISTS idx_inspection_requests_requester
  ON property.inspection_requests (requested_by);
