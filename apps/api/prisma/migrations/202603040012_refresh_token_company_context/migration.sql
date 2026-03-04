-- Migration: store selected company context on refresh tokens
-- This allows token rotation to re-embed the exact company the user
-- had active, fixing the "No active company context" error on token refresh.

ALTER TABLE identity.refresh_tokens
  ADD COLUMN IF NOT EXISTS active_company_id UUID
    REFERENCES identity.companies(id) ON DELETE SET NULL;

COMMENT ON COLUMN identity.refresh_tokens.active_company_id IS
  'The company context active when this token was issued. Carried forward on rotation.';
