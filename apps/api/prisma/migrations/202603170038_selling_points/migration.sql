CREATE TABLE IF NOT EXISTS property.selling_points (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID          NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  created_by     UUID          NOT NULL,
  title          VARCHAR(500)  NOT NULL,
  description    TEXT          NOT NULL,
  priority       VARCHAR(10)   NOT NULL DEFAULT 'medium'
                               CHECK (priority IN ('high', 'medium', 'low')),
  category       VARCHAR(50)   NOT NULL DEFAULT 'unique',
  tags           JSONB         NOT NULL DEFAULT '[]',
  show_in_listing  BOOLEAN     NOT NULL DEFAULT TRUE,
  show_in_flyer    BOOLEAN     NOT NULL DEFAULT TRUE,
  show_on_website  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_selling_points_property_id
  ON property.selling_points (property_id);

CREATE INDEX IF NOT EXISTS idx_selling_points_created_by
  ON property.selling_points (created_by);
