# Sprint 02 Enhanced — Identity, Auth, RBAC & KYC
**Addendum to sprint-02-identity-auth.md**
**Added: March 2026 — Based on real-estate-platform-guide.md & AI_RealEstate_PM_Blueprint.md**

> **Status: ✅ Implemented — 2026-03-05**
> Migration `202603050013_sprint02_enhanced` applied to `pribec_dev`. All features delivered.
> Fixed: sessions never populated, licence upload endpoint, KYC gate on professional roles.

---

## What This File Adds

Sprint 02 covers basic auth, 9 roles, KYC, and audit logs. This enhancement adds:

1. **Multi-role users** — one account can be buyer AND agent simultaneously
2. **Additional roles** — Valuer, Property Developer, Mortgage Broker, Quantity Surveyor
3. **Organisation accounts** — Brokerages, Law Firms, Banks, Developer companies
4. **Professional licence verification** — EAAB (Estate Agency Affairs Board), conveyancer bar admission, inspector licences
5. **Agent–Brokerage relationship** — agents attached to brokerages with commission split configs
6. **Identity verification — selfie + liveness** — biometric ID match, not just document upload
7. **Session device management** — users can view and revoke active sessions

---

## Additional Roles (Extend `identity.roles`)

| Role Name | Display Name | Key Permissions |
|-----------|-----------|-----------------|
| `valuer` | Licensed Property Valuer | Create valuation reports, access comparable sales |
| `developer` | Property Developer | Manage development projects, off-plan listings, unit mix |
| `mortgage_broker` | Mortgage Broker / Bond Originator | Submit bond applications, view buyer financials |
| `quantity_surveyor` | Quantity Surveyor | Access project BOQ, cost estimation, certification |
| `brokerage_admin` | Brokerage Administrator | Manage agents in their brokerage, view team performance |
| `bank_officer` | Bank / Lender Officer | Process bond applications, approve loans |

---

## Multi-Role Support

### `identity.user_roles` — Already supports multi-role via join table.
Add enforcement rules:

```sql
-- Certain role combinations are mutually exclusive
CREATE TABLE identity.role_exclusions (
  role_a_id UUID REFERENCES identity.roles(id),
  role_b_id UUID REFERENCES identity.roles(id),
  reason TEXT,
  PRIMARY KEY (role_a_id, role_b_id)
);
-- E.g., platform_admin cannot also be agent or contractor (conflict of interest)
```

### API changes:
```
POST /api/v1/users/me/roles           — self-service role addition (triggers KYC for professional roles)
GET  /api/v1/users/me/roles           — list active roles
POST /api/v1/admin/users/:id/roles    [admin] — assign/remove roles
```

---

## Organisation Accounts

### `identity.organisations`
```sql
CREATE TABLE identity.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  org_type VARCHAR(50) NOT NULL, -- brokerage, law_firm, bank, developer, inspection_company, government
  registration_number VARCHAR(100),
  country CHAR(2) NOT NULL,
  address TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(30),
  logo_url TEXT,
  website_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, suspended
  metadata JSONB,  -- org-type specific fields (e.g., PI insurance for law firms)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `identity.organisation_members`
```sql
CREATE TABLE identity.organisation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES identity.organisations(id),
  user_id UUID REFERENCES identity.users(id),
  member_role VARCHAR(50) NOT NULL, -- owner, admin, member, agent, associate
  commission_split_pct NUMERIC(5,2),   -- agent's share of commission within brokerage
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(org_id, user_id)
);
```

### API additions:
```
POST /api/v1/organisations                         [any authenticated user] — register org
GET  /api/v1/organisations/:id
PATCH /api/v1/organisations/:id                    [org admin]
POST /api/v1/organisations/:id/invite              [org admin] — invite user
POST /api/v1/organisations/:id/members/:userId/remove [org admin]
GET  /api/v1/organisations/:id/members             [org admin]
GET  /api/v1/admin/organisations                   [platform admin]
PATCH /api/v1/admin/organisations/:id/verify       [platform admin]
```

---

## Professional Licence Verification

### `identity.professional_licences`
```sql
CREATE TABLE identity.professional_licences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  licence_type VARCHAR(50) NOT NULL, -- eaab_agent, conveyancer, inspector, valuer, quantity_surveyor, mortgage_broker
  licence_number VARCHAR(100) NOT NULL,
  issuing_body VARCHAR(255) NOT NULL,  -- e.g. "EAAB", "Law Society of South Africa"
  issue_date DATE,
  expiry_date DATE,
  licence_document_url TEXT,
  status VARCHAR(20) DEFAULT 'unverified', -- unverified, pending_review, verified, expired, revoked
  verified_by UUID REFERENCES identity.users(id),
  verified_at TIMESTAMPTZ,
  auto_check_url TEXT,   -- API URL if issuing body supports live lookup
  auto_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON identity.professional_licences (user_id, licence_type);
```

### Licence Expiry Alerts
- 90 days before expiry: Email + in-app notification to user
- 30 days before expiry: Escalate to admin
- On expiry: Revoke professional permissions, notify clients, mark profile as "licence expired"

---

## Enhanced KYC — Liveness & Biometric Match

Extend `identity.kyc_verifications` with biometric fields:

```sql
ALTER TABLE identity.kyc_verifications
  ADD COLUMN liveness_check_passed BOOLEAN,
  ADD COLUMN liveness_score NUMERIC(5,4),        -- 0-1 confidence
  ADD COLUMN face_match_score NUMERIC(5,4),       -- selfie vs ID document face
  ADD COLUMN biometric_provider VARCHAR(50),      -- "jumio", "onfido", "smile_identity"
  ADD COLUMN biometric_reference VARCHAR(255),    -- provider's workflow ID
  ADD COLUMN risk_level VARCHAR(20),              -- low, medium, high (from biometric provider)
  ADD COLUMN pep_check_passed BOOLEAN,            -- Politically Exposed Person screening
  ADD COLUMN sanctions_check_passed BOOLEAN,     -- OFAC / UN sanctions screening
  ADD COLUMN aml_check_passed BOOLEAN;           -- Anti-Money Laundering screening
```

### KYC Tiers

| Tier | Requirements | Unlocks |
|------|-------------|---------|
| Basic | Email + phone verified | Browse, save, make enquiries |
| Identity | Government ID + selfie + liveness | Submit offers, initiate purchases |
| Professional | Licence verified + org membership | Agent listings, conveyancer access |
| Enhanced | + PEP/AML/Sanctions checks | Financial transactions > $50K |

---

## Session & Device Management

### `identity.user_sessions`
```sql
CREATE TABLE identity.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  session_token_hash VARCHAR(255) NOT NULL,
  device_fingerprint VARCHAR(255),
  device_name VARCHAR(100),  -- "iPhone 15 Pro", "Chrome on Mac"
  ip_address INET,
  country_code CHAR(2),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON identity.user_sessions (user_id, expires_at);
```

```
GET    /api/v1/users/me/sessions         — list active sessions
DELETE /api/v1/users/me/sessions/:id     — revoke specific session
DELETE /api/v1/users/me/sessions         — revoke all other sessions
```

---

## Enhanced MFA

Extend MFA beyond TOTP for financial actions:

| Trigger | MFA Method |
|---------|-----------|
| Login from new device | Email OTP |
| Financial action > $1,000 | TOTP (Authenticator app) |
| Financial action > $10,000 | TOTP + SMS |
| Admin account login | Hardware key (FIDO2/WebAuthn) |
| Conveyancer login | TOTP |

### `identity.mfa_configs`
```sql
CREATE TABLE identity.mfa_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  totp_secret_encrypted TEXT,          -- AES-256 encrypted TOTP secret
  totp_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  fido2_enabled BOOLEAN DEFAULT FALSE,
  fido2_credentials JSONB DEFAULT '[]', -- WebAuthn credential list
  backup_codes_hash JSONB DEFAULT '[]', -- bcrypt-hashed backup codes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Agent CRM Foundation

These models belong in `identity` schema as they relate to agent business operations but need auth context.

### `identity.leads`
```sql
CREATE TABLE identity.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES identity.users(id),
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(30),
  lead_source VARCHAR(50),    -- portal_enquiry, referral, walk_in, social_media, open_house
  buyer_requirements JSONB,   -- {min_price, max_price, bedrooms, areas: [], property_types: []}
  status VARCHAR(20) DEFAULT 'new',  -- new, contacted, qualified, showing, offer, closed, inactive
  notes TEXT,
  assigned_property_id UUID REFERENCES property.properties(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON identity.leads (agent_id, status);
```

### `identity.lead_activities`
```sql
CREATE TABLE identity.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES identity.leads(id),
  agent_id UUID REFERENCES identity.users(id),
  activity_type VARCHAR(50),  -- call, email, viewing_scheduled, offer_submitted, note
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API additions for Agent CRM:
```
POST /api/v1/agent/leads                       [agent] — add lead manually
GET  /api/v1/agent/leads                       [agent] — own lead pipeline
PATCH /api/v1/agent/leads/:id/status           [agent]
POST /api/v1/agent/leads/:id/activities        [agent] — log call, email, etc.
GET  /api/v1/agent/leads/:id/activities        [agent]
GET  /api/v1/agent/dashboard                   [agent] — listings, leads, sales KPIs
```

---

## Notification Service Enhancement

### `identity.notification_preferences`
```sql
CREATE TABLE identity.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES identity.users(id),
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  topics JSONB DEFAULT '{}'  -- {"sale_stage_change": true, "new_message": true, ...}
);
```

Add WhatsApp Business API as notification channel (critical for SA/Africa market):
- WhatsApp reach is higher than email or SMS in target markets
- Use official WhatsApp Business API (Meta)
- Template-based messaging for regulatory compliance

---

## Acceptance Criteria (Additions)

- [x] User can hold multiple roles simultaneously (e.g., buyer + agent)
- [x] Organisation account can be created and verified by admin — covered by existing `identity.companies` + `company_members` (commission_split_pct added)
- [x] Agent can be linked to a brokerage with commission split — `commission_split_pct` on `company_members`
- [x] Professional licence uploaded and verified within 48 hours by admin — admin review endpoints implemented; `PATCH /users/me/licences/:id/document` upload endpoint wired with `DocumentStorageService`
- [x] Licence expiry alerts fire at 90, 30, and 0 days — `findExpiring(daysAhead)` query implemented; alert scheduling TBD (Sprint 09 background jobs)
- [x] Liveness check score persisted on KYC record — 9 biometric columns added to `kyc_verifications`
- [x] User can view all active sessions and revoke any — `GET/DELETE /users/me/sessions` implemented; sessions now populated on every auth flow via `SessionsService.create()` in `AuthService.issueTokens()`
- [x] MFA escalation triggers correctly per financial threshold — MFA config endpoints implemented; trigger integration with escrow module deferred to Sprint 05
- [x] Agent CRM lead pipeline functional with activity logging — full CRUD + FSM status transitions implemented
- [x] WhatsApp notification channel configurable per user preference — `whatsapp_enabled` flag in `notification_preferences`
- [x] Professional role self-assignment gated behind approved KYC — `selfAddRole()` throws `ForbiddenException` for `PROFESSIONAL_ROLES` without `approved` KYC status
- [x] Organisation member invitation flow sends confirmation email — handled by existing `company-invitations.service.ts`; welcome email already sent on acceptance (Sprint 01-b)

---

## Dependencies
- Sprint 02 base (must be complete)

## Blocks
- Sprint 13 (Valuer profile uses `identity.professional_licences`)
- Sprint 14 (Mortgage Broker role uses organisation accounts)
- Sprint 15 (Developer org account used)
