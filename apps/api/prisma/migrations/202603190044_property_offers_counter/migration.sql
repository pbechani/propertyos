-- Migration: add counter offer fields to sales.property_offers

ALTER TABLE sales.property_offers
  ADD COLUMN IF NOT EXISTS counter_amount       NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS counter_earnest_money NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS counter_closing_date  DATE,
  ADD COLUMN IF NOT EXISTS counter_notes         TEXT,
  ADD COLUMN IF NOT EXISTS countered_at          TIMESTAMPTZ;
