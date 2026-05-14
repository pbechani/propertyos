-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 202604170051 — Add esign_submission_id columns
--
-- Adds e-signature tracking columns to:
--   • property.mandates             → esign_submission_id
--   • sales.offer_to_purchase       → esign_submission_id, esign_provider
--
-- conveyancing.generated_documents already has esign_provider + esign_envelope_id
-- from the sprint-05 migration; no changes needed there.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── property.mandates ─────────────────────────────────────────────────────────

ALTER TABLE property.mandates
  ADD COLUMN IF NOT EXISTS esign_submission_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mandates_esign_submission_id
  ON property.mandates (esign_submission_id)
  WHERE esign_submission_id IS NOT NULL;

-- ── sales.offer_to_purchase ───────────────────────────────────────────────────

ALTER TABLE sales.offer_to_purchase
  ADD COLUMN IF NOT EXISTS esign_submission_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS esign_provider      VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS uq_otp_esign_submission_id
  ON sales.offer_to_purchase (esign_submission_id)
  WHERE esign_submission_id IS NOT NULL;
