-- Migration: property.communication_logs
-- Stores all agent communication records for a property listing.

CREATE TABLE property.communication_logs (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id        UUID         NOT NULL
                                    REFERENCES property.properties(id)
                                    ON DELETE CASCADE,
  logged_by          UUID         NOT NULL,
  type               VARCHAR(50)  NOT NULL
                                    CHECK (type IN (
                                      'call-out','call-in',
                                      'email-sent','email-received',
                                      'text','video-call','in-person'
                                    )),
  contact_name       VARCHAR(255) NOT NULL,
  contact_role       VARCHAR(255),
  contact_email      VARCHAR(255),
  contact_phone      VARCHAR(50),
  subject            VARCHAR(500) NOT NULL,
  summary            TEXT         NOT NULL,
  communication_date TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  duration           VARCHAR(50),
  outcome            VARCHAR(255),
  follow_up_required BOOLEAN      NOT NULL DEFAULT FALSE,
  follow_up_details  TEXT,
  follow_up_date     DATE,
  tags               TEXT[]       NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comm_logs_property_id ON property.communication_logs(property_id);
CREATE INDEX idx_comm_logs_logged_by   ON property.communication_logs(logged_by);
