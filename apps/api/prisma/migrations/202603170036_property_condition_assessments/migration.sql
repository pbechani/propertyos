-- Migration: property_condition_assessments
-- Stores condition assessments submitted for a property listing.

CREATE TABLE IF NOT EXISTS property.property_condition_assessments (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID          NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  submitted_by      UUID          NOT NULL,
  inspection_date   DATE          NOT NULL,
  inspector_name    VARCHAR(255),
  year_built        VARCHAR(20),
  last_renovation   VARCHAR(255),
  overall_notes     TEXT,
  -- JSONB snapshot of all room conditions keyed by roomId
  room_conditions   JSONB         NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_condition_property
  ON property.property_condition_assessments (property_id);
