-- Migration: Add company_id to transaction tables
-- Every write made through an authenticated company context is now stamped
-- with the active_company_id from the JWT so that all transactions can be
-- attributed to the company the user was operating under at the time.

-- ============================================================
-- identity.audit_logs
-- ============================================================
ALTER TABLE identity.audit_logs
  ADD COLUMN IF NOT EXISTS company_id UUID; -- app-layer ref to identity.companies(id)

CREATE INDEX IF NOT EXISTS idx_identity_audit_company
  ON identity.audit_logs (company_id);
-- ============================================================
-- property.properties
-- ============================================================
ALTER TABLE property.properties
  ADD COLUMN IF NOT EXISTS company_id UUID; -- app-layer ref to identity.companies(id)

CREATE INDEX IF NOT EXISTS idx_properties_company
  ON property.properties (company_id);

-- ============================================================
-- property.audit_logs
-- Note: the append-only trigger only blocks UPDATE/DELETE, not DDL,
--       so ALTER TABLE ADD COLUMN is safe here.
-- ============================================================
ALTER TABLE property.audit_logs
  ADD COLUMN IF NOT EXISTS company_id UUID; -- app-layer ref to identity.companies(id)

CREATE INDEX IF NOT EXISTS idx_property_audit_company
  ON property.audit_logs (company_id);

-- ============================================================
-- property.inquiries
-- ============================================================
ALTER TABLE property.inquiries
  ADD COLUMN IF NOT EXISTS company_id UUID; -- app-layer ref to identity.companies(id)

CREATE INDEX IF NOT EXISTS idx_inquiries_company
  ON property.inquiries (company_id);

-- ============================================================
-- property.fraud_reports
-- ============================================================
ALTER TABLE property.fraud_reports
  ADD COLUMN IF NOT EXISTS company_id UUID; -- app-layer ref to identity.companies(id)

CREATE INDEX IF NOT EXISTS idx_fraud_reports_company
  ON property.fraud_reports (company_id);
