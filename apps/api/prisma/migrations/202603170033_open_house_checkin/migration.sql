-- ============================================================
-- Migration: open house check-in support
-- Allows walk-in guests (buyer_id nullable) and records
-- individual check-in details per attendee.
-- ============================================================

-- Make buyer_id nullable so walk-in guests can be recorded
ALTER TABLE property.open_house_registrations
  ALTER COLUMN buyer_id DROP NOT NULL;

-- Add guest + check-in detail columns
ALTER TABLE property.open_house_registrations
  ADD COLUMN IF NOT EXISTS guest_name     VARCHAR(200),
  ADD COLUMN IF NOT EXISTS guest_email    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guest_phone    VARCHAR(30),
  ADD COLUMN IF NOT EXISTS interest_level VARCHAR(20) CHECK (interest_level IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS notes          TEXT,
  ADD COLUMN IF NOT EXISTS checked_in_at  TIMESTAMPTZ;
