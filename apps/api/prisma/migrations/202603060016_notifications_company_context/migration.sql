-- ============================================================
-- Migration 202603060016 — Notifications: company context
-- ============================================================
-- Adds company_id to identity.user_notifications so that
-- notifications can be scoped to the active company context a
-- user was logged in under when the event occurred.
-- Users without a company get company_id = NULL and see all
-- of their unscoped notifications.
-- ============================================================

ALTER TABLE identity.user_notifications
  ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES identity.companies(id) ON DELETE SET NULL;

-- Optimised index for the common query pattern:
--   WHERE user_id = ? AND (company_id = ? OR company_id IS NULL)
--   ORDER BY created_at DESC
DROP INDEX IF EXISTS idx_user_notifications_user_unread;

CREATE INDEX idx_user_notifications_user_company
  ON identity.user_notifications (user_id, company_id, read_at NULLS FIRST, created_at DESC);
