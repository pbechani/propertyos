-- Migration: 202603060017_property_view_count
-- Adds a dedicated view_count column to property.properties.
-- This replaces the previous approach of counting property.audit_logs rows
-- for the Views stat card, which was unreliable because:
--   1. All historical audit log rows have actor_id = NULL (auth tokens were
--      never forwarded by the frontend), making owner-exclusion impossible.
--   2. Next.js SSR renders the property page without auth, so each page load
--      produced an additional null-actor audit log row regardless of who the
--      viewer was.
-- The new view_count column is only incremented via an explicit UPDATE inside
-- findById() when the caller is authenticated AND is not the property owner or
-- agent — the SSR anonymous call does not trigger an increment.

ALTER TABLE property.properties
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_property_view_count
  ON property.properties (id, view_count);
