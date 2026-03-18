-- Migration: property.viewings reminder columns
-- Adds reminder_send_at (when to dispatch reminder) and reminder_sent_at (when it was sent).

ALTER TABLE property.viewings
  ADD COLUMN IF NOT EXISTS reminder_send_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_viewings_reminder_send_at
  ON property.viewings (reminder_send_at)
  WHERE reminder_send_at IS NOT NULL AND reminder_sent_at IS NULL;
