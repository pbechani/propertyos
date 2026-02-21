CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity.user_roles (
  user_id UUID REFERENCES identity.users(id),
  role_id UUID REFERENCES identity.roles(id),
  assigned_by UUID REFERENCES identity.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS identity.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS identity.role_permissions (
  role_id UUID REFERENCES identity.roles(id),
  permission_id UUID REFERENCES identity.permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS identity.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  id_document_url TEXT,
  id_document_type VARCHAR(50),
  address_proof_url TEXT,
  business_registration_url TEXT,
  selfie_url TEXT,
  reviewer_id UUID REFERENCES identity.users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) NOT NULL,
  actor_id UUID,
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  payload JSONB,
  ip_address INET,
  user_agent TEXT,
  device_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_audit_actor_created ON identity.audit_logs (actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_identity_audit_resource ON identity.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_identity_kyc_status_submitted ON identity.kyc_verifications (status, submitted_at);

CREATE TABLE IF NOT EXISTS identity.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_refresh_user ON identity.refresh_tokens (user_id);

CREATE OR REPLACE FUNCTION identity.prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'identity.audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_no_update_identity_audit_logs ON identity.audit_logs;
CREATE TRIGGER trg_no_update_identity_audit_logs
BEFORE UPDATE OR DELETE ON identity.audit_logs
FOR EACH ROW
EXECUTE FUNCTION identity.prevent_audit_log_mutation();
