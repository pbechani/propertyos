# Sprint 02 — Identity, Auth, RBAC & KYC
**Phase 1 | Weeks 4–7**

## Goal
Build the complete identity layer: authentication, role-based access control across 9 roles, KYC document verification workflow, and the foundational audit logging infrastructure.

---

## Deliverables Checklist
- [ ] User registration & login (JWT + refresh tokens)
- [ ] OAuth (Google, Apple, Facebook)
- [ ] Password reset & email verification
- [ ] Session management (Redis-backed)
- [ ] 9-role RBAC permission system
- [ ] Role assignment workflow
- [ ] KYC document upload & verification workflow
- [ ] Admin verification dashboard
- [ ] Notification service (email + SMS)
- [ ] Document storage service (upload/download with access control)
- [ ] Audit log infrastructure (append-only)

---

## Data Models

### `identity.users`
```sql
CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, deleted
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `identity.roles`
```sql
CREATE TABLE identity.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- buyer_seller, investor, contractor, supplier, agent, conveyancer, inspector, admin, truck_operator
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE identity.user_roles (
  user_id UUID REFERENCES identity.users(id),
  role_id UUID REFERENCES identity.roles(id),
  assigned_by UUID REFERENCES identity.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

### `identity.permissions`
```sql
CREATE TABLE identity.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,  -- e.g. 'property', 'escrow', 'project'
  action VARCHAR(50) NOT NULL,     -- e.g. 'create', 'read', 'update', 'delete', 'approve'
  UNIQUE(resource, action)
);

CREATE TABLE identity.role_permissions (
  role_id UUID REFERENCES identity.roles(id),
  permission_id UUID REFERENCES identity.permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

### `identity.kyc_verifications`
```sql
CREATE TABLE identity.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, under_review, approved, rejected
  id_document_url TEXT,
  id_document_type VARCHAR(50), -- national_id, passport, drivers_license
  address_proof_url TEXT,
  business_registration_url TEXT,
  selfie_url TEXT,
  reviewer_id UUID REFERENCES identity.users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `identity.audit_logs`
```sql
CREATE TABLE identity.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) NOT NULL,   -- e.g. 'user.login', 'kyc.approved'
  actor_id UUID,                    -- NULL for system events
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  payload JSONB,                    -- full event data snapshot
  ip_address INET,
  user_agent TEXT,
  device_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- This table is append-only — never UPDATE or DELETE
CREATE INDEX ON identity.audit_logs (actor_id, created_at);
CREATE INDEX ON identity.audit_logs (resource_type, resource_id);
```

### `identity.refresh_tokens`
```sql
CREATE TABLE identity.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/verify-email
POST /api/v1/auth/oauth/google
POST /api/v1/auth/oauth/apple
```

### Users
```
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/:id           [admin]
PATCH  /api/v1/users/:id/status    [admin]
GET    /api/v1/users/:id/roles     [admin]
POST   /api/v1/users/:id/roles     [admin]
DELETE /api/v1/users/:id/roles/:roleId [admin]
```

### KYC
```
POST /api/v1/kyc/submit
GET  /api/v1/kyc/status
GET  /api/v1/admin/kyc/pending         [admin]
GET  /api/v1/admin/kyc/:id             [admin]
POST /api/v1/admin/kyc/:id/approve     [admin]
POST /api/v1/admin/kyc/:id/reject      [admin]
```

### Audit
```
GET /api/v1/admin/audit-logs           [admin] ?actor_id&resource_type&from&to
GET /api/v1/audit-logs/me              [authenticated user — own actions only]
```

---

## JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["contractor", "buyer_seller"],
  "kyc_status": "approved",
  "iat": 1234567890,
  "exp": 1234568790
}
```
Access token expiry: **15 minutes**
Refresh token expiry: **7 days**

---

## RBAC Permission Matrix (Seed Data)

| Role | Property | Project | Escrow | Users | KYC |
|------|----------|---------|--------|-------|-----|
| buyer_seller | read | read | deposit | self | submit |
| agent | create/read/update | — | — | — | submit |
| contractor | read | create/update | — | — | submit |
| supplier | read | read | — | — | submit |
| conveyancer | read | — | read | — | submit |
| inspector | read | read | — | — | submit |
| investor | read | read | read | — | submit |
| truck_operator | — | — | — | — | submit |
| admin | full | full | full | full | approve |

---

## Notification Service
Providers: **SendGrid** (email), **Twilio** (SMS)

Events that trigger notifications:
- User registered → email verification link
- Email verified → welcome email
- KYC submitted → confirmation email
- KYC approved/rejected → email + SMS
- Password reset requested → email link

---

## Document Storage Service
- All uploads go to S3 at path: `{context}/{user_id}/{document_type}/{uuid}.{ext}`
- Virus scanning before storage (ClamAV or cloud service)
- Signed URLs for download (expiry: 1 hour)
- Max file size: 20MB
- Allowed types: PDF, JPG, PNG, HEIC

---

## Audit Logging Rules
**Every** state-changing action must insert an audit log row before returning a response.
Audit function signature:
```typescript
audit.log({
  eventId: 'kyc.approved',
  actorId: admin.id,
  actorRole: 'admin',
  resourceType: 'kyc_verification',
  resourceId: kyc.id,
  payload: { previous_status: 'pending', new_status: 'approved' },
  request // contains ip, userAgent, deviceMetadata
})
```

---

## Acceptance Criteria
- [ ] User can register, verify email, and log in
- [ ] OAuth login works for Google
- [ ] JWT access + refresh token rotation works correctly
- [ ] Role assignment and permission checks enforced on all endpoints
- [ ] KYC submission and admin review workflow functional
- [ ] Every login, role change, KYC action creates an audit log entry
- [ ] Rate limiting: max 5 failed login attempts per 15 minutes per IP → lock
- [ ] All passwords hashed with bcrypt (cost factor 12)
- [ ] Zero plaintext PII in logs

---

## Dependencies
- Sprint 01 (infrastructure, database, S3, Redis, notifications infra)

## Blocks
- All user-facing features (every subsequent sprint)
