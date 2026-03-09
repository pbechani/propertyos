-- ============================================================
-- Migration 202603060015 — Viewing Lifecycle & Notifications
-- ============================================================
-- Extends property.viewings with cancellation / reschedule tracking
-- Adds 'declined' to the status enum
-- Creates identity.user_notifications for in-app notification inbox
-- ============================================================

-- 1. Add lifecycle columns to property.viewings
ALTER TABLE property.viewings
  ADD COLUMN IF NOT EXISTS cancel_reason        TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by         VARCHAR(20)
      CHECK (cancelled_by IN ('buyer', 'agent', 'system')),
  ADD COLUMN IF NOT EXISTS rescheduled_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rescheduled_reason   TEXT,
  ADD COLUMN IF NOT EXISTS declined_at          TIMESTAMPTZ;

-- 2. Expand status enum — drop inline constraint and add named one
--    PostgreSQL auto-names inline CHECK as <table>_<col>_check
ALTER TABLE property.viewings
  DROP CONSTRAINT IF EXISTS viewings_status_check;

ALTER TABLE property.viewings
  ADD CONSTRAINT viewings_status_check
  CHECK (status IN ('requested', 'confirmed', 'completed', 'no_show', 'cancelled', 'declined'));

-- 3. In-app notification inbox
CREATE TABLE IF NOT EXISTS identity.user_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  type          VARCHAR(60)  NOT NULL,   -- e.g. 'viewing_requested', 'viewing_declined'
  title         VARCHAR(255) NOT NULL,
  body          TEXT         NOT NULL,
  resource_type VARCHAR(50),             -- 'viewing'
  resource_id   UUID,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
  ON identity.user_notifications (user_id, read_at NULLS FIRST, created_at DESC);
