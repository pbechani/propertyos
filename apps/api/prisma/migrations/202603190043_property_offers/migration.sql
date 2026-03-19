-- Migration: property_offers table
-- Allows agents to record buyer offers against a listing.

CREATE TABLE IF NOT EXISTS sales.property_offers (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID          NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  agent_id        UUID          NOT NULL,  -- app-layer ref: identity.users(id)
  buyer_name      VARCHAR(255)  NOT NULL,
  amount          NUMERIC(18,2) NOT NULL,
  earnest_money   NUMERIC(18,2),
  financing       VARCHAR(50)   NOT NULL DEFAULT 'conventional'
                    CHECK (financing IN ('cash','conventional','fha','va','usda','other')),
  contingencies   TEXT[]        NOT NULL DEFAULT '{}',
  closing_date    DATE,
  notes           TEXT,
  status          VARCHAR(30)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','rejected','countered','withdrawn')),
  submitted_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_offers_property ON sales.property_offers (property_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_agent    ON sales.property_offers (agent_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_status   ON sales.property_offers (property_id, status);
