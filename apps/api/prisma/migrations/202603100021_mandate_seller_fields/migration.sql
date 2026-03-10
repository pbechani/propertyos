-- ============================================================
-- Migration: Mandate seller contact fields + offline signing
--
-- Adds seller contact info (for sellers not on the platform)
-- and an agreement_document_url for uploaded signed documents.
-- seller_is_platform_user distinguishes online vs offline sign.
-- ============================================================

ALTER TABLE property.mandates
  ADD COLUMN IF NOT EXISTS seller_name             VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seller_email            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS seller_phone            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS seller_is_platform_user BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS agreement_document_url  TEXT;
