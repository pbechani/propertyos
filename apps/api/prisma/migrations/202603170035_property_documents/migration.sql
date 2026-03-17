-- Migration: property_documents
-- Stores uploaded documents for a property listing.

CREATE TABLE IF NOT EXISTS property.property_documents (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID          NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  uploaded_by      UUID          NOT NULL,
  title            VARCHAR(255)  NOT NULL,
  category         VARCHAR(50)   NOT NULL,
  description      TEXT,
  status           VARCHAR(30)   NOT NULL DEFAULT 'current',
  access_level     VARCHAR(20)   NOT NULL DEFAULT 'team',
  file_url         TEXT          NOT NULL,
  storage_path     TEXT          NOT NULL,
  file_name        VARCHAR(255)  NOT NULL,
  file_size        INTEGER,
  file_type        VARCHAR(100),
  is_required      BOOLEAN       NOT NULL DEFAULT false,
  expiration_date  DATE,
  tags             TEXT[]        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_docs_property
  ON property.property_documents (property_id);
