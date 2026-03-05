-- Sprint 02 Enhanced: Multi-role support, Professional Licences, Enhanced KYC,
-- Session Management, MFA Config, Agent CRM, Notification Preferences
-- Sprint file: design/sprints/sprint-02-identity-auth_enhanced.md

-- ============================================================
-- 1. New roles: valuer, developer, mortgage_broker, etc.
-- ============================================================
INSERT INTO identity.roles (name, display_name, description)
VALUES
  ('valuer',            'Licensed Property Valuer',          'Creates valuation reports, accesses comparable sales'),
  ('developer',         'Property Developer',                'Manages development projects, off-plan listings, unit mix'),
  ('mortgage_broker',   'Mortgage Broker / Bond Originator', 'Submits bond applications, views buyer financials'),
  ('quantity_surveyor', 'Quantity Surveyor',                 'Accesses project BOQ, cost estimation, certification'),
  ('brokerage_admin',   'Brokerage Administrator',           'Manages agents in brokerage, views team performance'),
  ('bank_officer',      'Bank / Lender Officer',             'Processes bond applications, approves loans')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Role exclusions (conflict of interest enforcement)
-- ============================================================
CREATE TABLE IF NOT EXISTS identity.role_exclusions (
  role_a_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
  role_b_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
  reason    TEXT,
  PRIMARY KEY (role_a_id, role_b_id)
);

COMMENT ON TABLE identity.role_exclusions IS
  'Pairs of roles that cannot be held simultaneously (conflict of interest).';

-- Admin cannot simultaneously be a marketplace participant role
INSERT INTO identity.role_exclusions (role_a_id, role_b_id, reason)
SELECT r1.id, r2.id, 'Platform admin conflict of interest'
FROM identity.roles r1
CROSS JOIN identity.roles r2
WHERE r1.name = 'admin'
  AND r2.name IN ('agent', 'contractor', 'supplier', 'mortgage_broker', 'brokerage_admin')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Professional licences
-- ============================================================
CREATE TABLE IF NOT EXISTS identity.professional_licences (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID         NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  licence_type         VARCHAR(50)  NOT NULL,
  licence_number       VARCHAR(100) NOT NULL,
  issuing_body         VARCHAR(255) NOT NULL,
  issue_date           DATE,
  expiry_date          DATE,
  licence_document_url TEXT,
  status               VARCHAR(20)  NOT NULL DEFAULT 'unverified',
  verified_by          UUID         REFERENCES identity.users(id),
  verified_at          TIMESTAMPTZ,
  auto_check_url       TEXT,
  auto_checked_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_licences_user
  ON identity.professional_licences(user_id, licence_type);
CREATE INDEX IF NOT EXISTS idx_professional_licences_status
  ON identity.professional_licences(status);
CREATE INDEX IF NOT EXISTS idx_professional_licences_expiry
  ON identity.professional_licences(expiry_date)
  WHERE expiry_date IS NOT NULL;

COMMENT ON TABLE identity.professional_licences IS
  'Professional licences: EAAB agent, conveyancer, inspector, valuer, QS, mortgage broker.';
COMMENT ON COLUMN identity.professional_licences.licence_type IS
  'One of: eaab_agent, conveyancer, inspector, valuer, quantity_surveyor, mortgage_broker';
COMMENT ON COLUMN identity.professional_licences.status IS
  'Lifecycle: unverified → pending_review → verified | expired | revoked';

-- ============================================================
-- 4. Enhance kyc_verifications with biometric / AML fields
-- ============================================================
ALTER TABLE identity.kyc_verifications
  ADD COLUMN IF NOT EXISTS liveness_check_passed  BOOLEAN,
  ADD COLUMN IF NOT EXISTS liveness_score          NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS face_match_score        NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS biometric_provider      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS biometric_reference     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS risk_level              VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pep_check_passed        BOOLEAN,
  ADD COLUMN IF NOT EXISTS sanctions_check_passed  BOOLEAN,
  ADD COLUMN IF NOT EXISTS aml_check_passed        BOOLEAN;

COMMENT ON COLUMN identity.kyc_verifications.biometric_provider IS
  'Provider used for liveness/face match: jumio, onfido, smile_identity';
COMMENT ON COLUMN identity.kyc_verifications.risk_level IS
  'AML risk tier from biometric provider: low, medium, high';

-- ============================================================
-- 5. User sessions — device management
-- ============================================================
CREATE TABLE IF NOT EXISTS identity.user_sessions (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID         NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  session_token_hash VARCHAR(255) NOT NULL,
  device_fingerprint VARCHAR(255),
  device_name        VARCHAR(100),
  ip_address         INET,
  country_code       CHAR(2),
  last_active_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at         TIMESTAMPTZ  NOT NULL,
  revoked_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires
  ON identity.user_sessions(user_id, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_token_hash
  ON identity.user_sessions(session_token_hash);

COMMENT ON TABLE identity.user_sessions IS
  'Rich session tracking with device info. session_token_hash = SHA-256 of refresh token.';

-- ============================================================
-- 6. MFA configs
-- ============================================================
CREATE TABLE IF NOT EXISTS identity.mfa_configs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES identity.users(id) ON DELETE CASCADE,
  totp_secret_encrypted TEXT,
  totp_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,
  sms_enabled           BOOLEAN     NOT NULL DEFAULT FALSE,
  fido2_enabled         BOOLEAN     NOT NULL DEFAULT FALSE,
  fido2_credentials     JSONB       NOT NULL DEFAULT '[]',
  backup_codes_hash     JSONB       NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE identity.mfa_configs IS
  'Per-user MFA: TOTP (authenticator app), SMS, FIDO2/WebAuthn, backup codes.';
COMMENT ON COLUMN identity.mfa_configs.totp_secret_encrypted IS
  'AES-256-GCM encrypted TOTP secret. Format: iv_hex:authtag_hex:ciphertext_b64. Key from ENCRYPTION_KEY env.';
COMMENT ON COLUMN identity.mfa_configs.fido2_credentials IS
  'Array of WebAuthn credential objects: [{id, publicKey, counter, deviceType, transports}]';
COMMENT ON COLUMN identity.mfa_configs.backup_codes_hash IS
  'Array of bcrypt hashes for one-time-use backup codes (exactly 10 codes generated at a time).';

-- ============================================================
-- 7. Agent CRM — leads
-- ============================================================
CREATE TABLE IF NOT EXISTS identity.leads (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id             UUID         NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  contact_name         VARCHAR(255) NOT NULL,
  contact_email        VARCHAR(255),
  contact_phone        VARCHAR(30),
  lead_source          VARCHAR(50),
  buyer_requirements   JSONB,
  status               VARCHAR(20)  NOT NULL DEFAULT 'new',
  notes                TEXT,
  assigned_property_id UUID,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_agent_status
  ON identity.leads(agent_id, status);

COMMENT ON TABLE identity.leads IS
  'Agent CRM lead pipeline tracking. lead_source: portal_enquiry|referral|walk_in|social_media|open_house';
COMMENT ON COLUMN identity.leads.status IS
  'Pipeline stage: new → contacted → qualified → showing → offer → closed | inactive';
COMMENT ON COLUMN identity.leads.buyer_requirements IS
  'Structured buyer criteria: {min_price, max_price, bedrooms, areas: [], property_types: []}';

-- ============================================================
-- 8. Agent CRM — lead activities
-- ============================================================
CREATE TABLE IF NOT EXISTS identity.lead_activities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID        NOT NULL REFERENCES identity.leads(id) ON DELETE CASCADE,
  agent_id      UUID        NOT NULL REFERENCES identity.users(id),
  activity_type VARCHAR(50),
  notes         TEXT,
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead
  ON identity.lead_activities(lead_id);

COMMENT ON COLUMN identity.lead_activities.activity_type IS
  'call | email | viewing_scheduled | offer_submitted | note';

-- ============================================================
-- 9. Notification preferences (incl. WhatsApp)
-- ============================================================
CREATE TABLE IF NOT EXISTS identity.notification_preferences (
  user_id          UUID        PRIMARY KEY REFERENCES identity.users(id) ON DELETE CASCADE,
  email_enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
  sms_enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  push_enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  whatsapp_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
  topics           JSONB       NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE identity.notification_preferences IS
  'Per-user notification channel and topic preferences. WhatsApp via Meta Business API.';
COMMENT ON COLUMN identity.notification_preferences.topics IS
  'Map of topic → enabled: {"sale_stage_change": true, "new_message": true, "licence_expiry": true}';

-- ============================================================
-- 10. Add commission_split_pct to company_members
-- ============================================================
ALTER TABLE identity.company_members
  ADD COLUMN IF NOT EXISTS commission_split_pct NUMERIC(5,2);

COMMENT ON COLUMN identity.company_members.commission_split_pct IS
  'For brokerage members: agent percentage share of commission (e.g. 70.00 = 70%).';
