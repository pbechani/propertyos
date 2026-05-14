CREATE TABLE IF NOT EXISTS property.notes (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID         NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  created_by   UUID         NOT NULL,
  title        VARCHAR(500) NOT NULL,
  content      TEXT         NOT NULL,
  category     VARCHAR(50)  NOT NULL DEFAULT 'general',
  is_pinned    BOOLEAN      NOT NULL DEFAULT FALSE,
  visibility   VARCHAR(20)  NOT NULL DEFAULT 'private'
                CHECK (visibility IN ('private','team','client')),
  tags         JSONB        NOT NULL DEFAULT '[]',
  reminder     DATE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_property_id ON property.notes(property_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by  ON property.notes(created_by);
