-- Extend property_offers to support buyer-submitted (self-serve) offers
-- agent_id becomes nullable so buyers can submit without an agent

ALTER TABLE sales.property_offers
  ALTER COLUMN agent_id DROP NOT NULL;

ALTER TABLE sales.property_offers
  ADD COLUMN IF NOT EXISTS buyer_id        UUID,
  ADD COLUMN IF NOT EXISTS expires_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deposit_amount  NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS metadata        JSONB NOT NULL DEFAULT '{}';

-- Widen the financing check constraint to include bond terminology
ALTER TABLE sales.property_offers
  DROP CONSTRAINT IF EXISTS property_offers_financing_check;

ALTER TABLE sales.property_offers
  ADD CONSTRAINT property_offers_financing_check
    CHECK (financing IN (
      'cash', 'conventional', 'fha', 'va', 'usda', 'other',
      'bond', 'part_cash_bond', 'subject_to_bond'
    ));

CREATE INDEX IF NOT EXISTS idx_property_offers_buyer ON sales.property_offers (buyer_id);
