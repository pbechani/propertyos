-- Tier 3: Price History table
CREATE TABLE IF NOT EXISTS property.price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  old_price       DECIMAL(18,2),
  new_price       DECIMAL(18,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'ZAR',
  changed_by      UUID,
  change_note     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_property_date
  ON property.price_history(property_id, created_at);

-- Tier 3: Contact preference columns on inquiries
ALTER TABLE property.inquiries
  ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20),
  ADD COLUMN IF NOT EXISTS best_contact_time VARCHAR(30);
