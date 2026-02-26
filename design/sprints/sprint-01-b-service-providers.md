# Sprint 01-b — Service Providers & Company Management
**Phase 1 | Extension of Weeks 4–7**

## Goal
Build the company / business-partner management layer on top of the existing identity infrastructure. Enables multi-user companies with role-scoped permissions, email-invite onboarding, context-switching at login for multi-company users, full company-admin visibility, and automatic task-pool management when member access is revoked.

---

## Foundation — Already Implemented (Do Not Rebuild)

| Layer | What Exists |
|-------|-------------|
| Sprint 01 | Infra, PostgreSQL schemas, Redis, RabbitMQ, S3/MinIO, `NotificationService` infra |
| Sprint 02 | `identity.users`, `identity.roles`, `identity.user_roles`, `identity.permissions`, `identity.role_permissions`, JWT + refresh tokens, `AuditService`, `NotificationService`, KYC workflow |
| Sprint 03 | Property module — agents create listings; `agent_id` already on listings |
| Sprint 02 ext | `identity.user_business_profiles` — individual sole-proprietor metadata (retained as-is) |

---

## New Data Models

### `identity.companies`
```sql
CREATE TABLE identity.companies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(255) NOT NULL,
  slug                 VARCHAR(100) UNIQUE NOT NULL,       -- URL-safe, auto-generated from name
  category             VARCHAR(50)  NOT NULL,              -- agent | contractor | supplier | conveyancer | inspector | logistics | developing
  registration_number  VARCHAR(100),
  tax_number           VARCHAR(100),
  website              VARCHAR(255),
  phone                VARCHAR(20),
  email                VARCHAR(255) NOT NULL,
  address              JSONB DEFAULT '{}',                 -- {line1, line2, city, region, country, postal_code}
  logo_url             TEXT,
  description          TEXT,
  status               VARCHAR(30) NOT NULL DEFAULT 'pending_verification',
                                                           -- pending_verification | active | suspended | deactivated
  verification_status  VARCHAR(30) DEFAULT 'unverified',  -- unverified | pending | verified | rejected
  verified_by          UUID REFERENCES identity.users(id),
  verified_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  created_by           UUID NOT NULL REFERENCES identity.users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON identity.companies (category);
CREATE INDEX ON identity.companies (status);
CREATE INDEX ON identity.companies (verification_status);
```

### `identity.company_members`
```sql
CREATE TABLE identity.company_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES identity.companies(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
  role         VARCHAR(50) NOT NULL,                       -- must be a valid identity.roles.name
  is_admin     BOOLEAN NOT NULL DEFAULT false,
  status       VARCHAR(30) NOT NULL DEFAULT 'active',      -- active | suspended | revoked
  permissions  JSONB DEFAULT '[]',                         -- [{resource, action}, ...] — subset of role's allowed permissions
  invited_by   UUID REFERENCES identity.users(id),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  revoked_at   TIMESTAMPTZ,
  revoked_by   UUID REFERENCES identity.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);
CREATE INDEX ON identity.company_members (company_id);
CREATE INDEX ON identity.company_members (user_id);
CREATE INDEX ON identity.company_members (status);
```

### `identity.company_invitations`
```sql
CREATE TABLE identity.company_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES identity.companies(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  permissions   JSONB DEFAULT '[]',
  token_hash    VARCHAR(255) NOT NULL,                     -- SHA-256 of the raw invitation token
  expires_at    TIMESTAMPTZ NOT NULL,                      -- 72h from creation
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',    -- pending | accepted | expired | revoked
  invited_by    UUID NOT NULL REFERENCES identity.users(id),
  accepted_by   UUID REFERENCES identity.users(id),
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX  ON identity.company_invitations (company_id, status);
CREATE UNIQUE INDEX ON identity.company_invitations (token_hash);
```

### `identity.company_orphaned_tasks`
```sql
CREATE TABLE identity.company_orphaned_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES identity.companies(id) ON DELETE CASCADE,
  original_user_id      UUID NOT NULL REFERENCES identity.users(id),
  task_type             VARCHAR(50) NOT NULL,              -- property_listing | project | inquiry | contract | etc.
  resource_type         VARCHAR(100) NOT NULL,
  resource_id           UUID NOT NULL,
  resource_snapshot     JSONB,                             -- point-in-time snapshot of the resource
  requires_notification BOOLEAN DEFAULT false,
  notification_parties  JSONB DEFAULT '[]',               -- [{party_type, party_id, party_email}, ...]
  status                VARCHAR(30) NOT NULL DEFAULT 'unassigned', -- unassigned | assigned | closed
  assigned_to           UUID REFERENCES identity.users(id),
  assigned_by           UUID REFERENCES identity.users(id),
  assigned_at           TIMESTAMPTZ,
  revocation_reason     TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON identity.company_orphaned_tasks (company_id, status);
CREATE INDEX ON identity.company_orphaned_tasks (original_user_id);
```

---

## JWT Changes

Extend `JwtPayload` (currently `{sub, email, roles, kyc_status}`) to carry the active company context:

```typescript
// apps/api/src/identity/auth/auth.types.ts — extend existing type
export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  kyc_status: string | null;
  // New: populated after company context is selected
  active_company_id: string | null;
  active_company_role: string | null;     // e.g. "agent", "contractor"
  active_company_is_admin: boolean;
};
```

Redis session key: `session:{user_id}:{jti}` — store active company context so the server can validate it independently of the token payload.

---

## Context Switching Flow

```
User logs in
     │
     ├─► 0 active companies  ──► Issue token (no company context) — solo/individual mode
     │
     ├─► 1 active company   ──► Auto-select; embed company context in token
     │
     └─► >1 active companies ──► Login response returns { requires_context_selection: true, contexts: [...] }
                                  Client calls POST /auth/contexts/select { company_id }
                                  Server issues full JWT with company context
```

---

## API Endpoints

### Company Registration & Verification
```
POST   /api/v1/companies                           [authenticated] — registers company; caller becomes first admin
GET    /api/v1/companies/:id                       [company member | platform admin]
PATCH  /api/v1/companies/:id                       [company admin]
POST   /api/v1/companies/:id/submit-verification   [company admin] — triggers platform review
GET    /api/v1/admin/companies                     [platform admin] ?status&category&page&limit
GET    /api/v1/admin/companies/:id                 [platform admin]
POST   /api/v1/admin/companies/:id/verify          [platform admin]
POST   /api/v1/admin/companies/:id/reject          [platform admin] — body: { reason }
POST   /api/v1/admin/companies/:id/suspend         [platform admin] — body: { reason }
```

### Company Members
```
GET    /api/v1/companies/:id/members                              [company admin]
POST   /api/v1/companies/:id/members/invite                       [company admin] — body: { email, role, is_admin, permissions }
GET    /api/v1/companies/:id/members/:memberId                    [company admin]
PATCH  /api/v1/companies/:id/members/:memberId/permissions        [company admin]
POST   /api/v1/companies/:id/members/:memberId/promote-admin      [company admin]
DELETE /api/v1/companies/:id/members/:memberId                    [company admin] — revokes access, triggers orphan pool
```

### Invitations
```
GET    /api/v1/invitations/:token                  [public] — preview invitation details before accepting
POST   /api/v1/invitations/:token/accept           [authenticated | unauthenticated → must register first]
DELETE /api/v1/companies/:id/invitations/:inviteId [company admin] — revoke pending invite
```

### Context Switching (Auth Extensions)
```
GET    /api/v1/auth/contexts                       [authenticated] — returns list of companies user belongs to
POST   /api/v1/auth/contexts/select                [authenticated] — body: { company_id } → returns new JWT pair
```

### Orphaned Task Pool
```
GET    /api/v1/companies/:id/orphaned-tasks                         [company admin] ?status
PATCH  /api/v1/companies/:id/orphaned-tasks/:taskId/assign          [company admin] — body: { assignee_id }
POST   /api/v1/companies/:id/orphaned-tasks/:taskId/close           [company admin]
```

### User's Companies (Self-serve)
```
GET    /api/v1/users/me/companies                  [authenticated] — list all company memberships with roles and permissions
```

---

## Company Categories & Allowed Member Roles

| Category | Allowed Member Roles |
|----------|---------------------|
| `agent` | `agent`, `admin` |
| `contractor` | `contractor`, `admin` |
| `supplier` | `supplier`, `admin` |
| `conveyancer` | `conveyancer`, `admin` |
| `inspector` | `inspector`, `admin` |
| `logistics` | `truck_operator`, `admin` |
| `developing` | `buyer_seller`, `contractor`, `agent`, `admin` |

The platform admin role (`admin`) always retains access to all companies for oversight.

---

## Permission Granularity

Member permissions in `company_members.permissions` are a **subset** of what the role's RBAC baseline allows. A company admin **cannot** grant a member a permission beyond what their role allows in `identity.role_permissions`.

Check order on any protected action:
1. `JwtAuthGuard` — valid JWT
2. `CompanyContextGuard` — `active_company_id` is set and member status is `active`
3. `CompanyPermissionGuard` — member's `permissions` JSONB includes the required `{resource, action}`

Example permissions payload for an `agent` member:
```json
[
  { "resource": "property", "action": "create" },
  { "resource": "property", "action": "update" },
  { "resource": "inquiry", "action": "read" },
  { "resource": "inquiry", "action": "respond" }
]
```

---

## Audit Events

All events logged to `identity.audit_logs` via the existing `AuditService`:

| Event ID | Actor | Resource |
|----------|-------|----------|
| `company.created` | registering user | company |
| `company.submitted_for_verification` | company admin | company |
| `company.verified` | platform admin | company |
| `company.rejected` | platform admin | company |
| `company.suspended` | platform admin | company |
| `company_member.invited` | company admin | invitation |
| `company_member.joined` | new member | company_member |
| `company_member.permissions_updated` | company admin | company_member |
| `company_member.promoted_to_admin` | company admin | company_member |
| `company_member.access_revoked` | company admin | company_member |
| `company_context.selected` | user | session |
| `orphaned_task.assigned` | company admin | orphaned_task |
| `orphaned_task.closed` | company admin | orphaned_task |

All records include `company_id` in `payload` when a company context is active, enabling full company-level audit trails.

---

## Notification Events

Handled via the existing `NotificationService` (SendGrid email + Twilio SMS):

| Event | Recipient | Channel |
|-------|-----------|---------|
| Company registered | Platform admin | Email |
| Company verified | Company admin | Email + SMS |
| Company rejected | Company admin | Email |
| Company suspended | Company admin | Email + SMS |
| Member invited | Invited email address | Email (invite link, 72h expiry) |
| Invitation accepted | Company admin | Email |
| Member access revoked | Affected user | Email |
| Orphaned tasks created | Company admin | Email (summary of resources requiring attention) |

---

## Prisma Schema Additions

Add to `apps/api/prisma/schema.prisma` under the `identity` schema section:

```prisma
model Company {
  id                 String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name               String    @db.VarChar(255)
  slug               String    @unique @db.VarChar(100)
  category           String    @db.VarChar(50)
  registrationNumber String?   @map("registration_number") @db.VarChar(100)
  taxNumber          String?   @map("tax_number") @db.VarChar(100)
  website            String?   @db.VarChar(255)
  phone              String?   @db.VarChar(20)
  email              String    @db.VarChar(255)
  address            Json      @default("{}") @db.JsonB
  logoUrl            String?   @map("logo_url") @db.Text
  description        String?   @db.Text
  status             String    @default("pending_verification") @db.VarChar(30)
  verificationStatus String    @default("unverified") @map("verification_status") @db.VarChar(30)
  verifiedBy         String?   @map("verified_by") @db.Uuid
  verifiedAt         DateTime? @map("verified_at") @db.Timestamptz(6)
  rejectionReason    String?   @map("rejection_reason") @db.Text
  createdBy          String    @map("created_by") @db.Uuid
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime  @default(now()) @map("updated_at") @db.Timestamptz(6)

  @@index([category], name: "idx_companies_category")
  @@index([status], name: "idx_companies_status")
  @@index([verificationStatus], name: "idx_companies_verification_status")
  @@schema("identity")
  @@map("companies")
}

model CompanyMember {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId   String    @map("company_id") @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  role        String    @db.VarChar(50)
  isAdmin     Boolean   @default(false) @map("is_admin")
  status      String    @default("active") @db.VarChar(30)
  permissions Json      @default("[]") @db.JsonB
  invitedBy   String?   @map("invited_by") @db.Uuid
  joinedAt    DateTime  @default(now()) @map("joined_at") @db.Timestamptz(6)
  revokedAt   DateTime? @map("revoked_at") @db.Timestamptz(6)
  revokedBy   String?   @map("revoked_by") @db.Uuid
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @default(now()) @map("updated_at") @db.Timestamptz(6)

  @@unique([companyId, userId])
  @@index([companyId], name: "idx_company_members_company")
  @@index([userId], name: "idx_company_members_user")
  @@index([status], name: "idx_company_members_status")
  @@schema("identity")
  @@map("company_members")
}

model CompanyInvitation {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId    String    @map("company_id") @db.Uuid
  invitedEmail String    @map("invited_email") @db.VarChar(255)
  role         String    @db.VarChar(50)
  isAdmin      Boolean   @default(false) @map("is_admin")
  permissions  Json      @default("[]") @db.JsonB
  tokenHash    String    @unique @map("token_hash") @db.VarChar(255)
  expiresAt    DateTime  @map("expires_at") @db.Timestamptz(6)
  status       String    @default("pending") @db.VarChar(20)
  invitedBy    String    @map("invited_by") @db.Uuid
  acceptedBy   String?   @map("accepted_by") @db.Uuid
  acceptedAt   DateTime? @map("accepted_at") @db.Timestamptz(6)
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([companyId, status], name: "idx_company_invitations_company_status")
  @@schema("identity")
  @@map("company_invitations")
}

model CompanyOrphanedTask {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId            String    @map("company_id") @db.Uuid
  originalUserId       String    @map("original_user_id") @db.Uuid
  taskType             String    @map("task_type") @db.VarChar(50)
  resourceType         String    @map("resource_type") @db.VarChar(100)
  resourceId           String    @map("resource_id") @db.Uuid
  resourceSnapshot     Json?     @map("resource_snapshot") @db.JsonB
  requiresNotification Boolean   @default(false) @map("requires_notification")
  notificationParties  Json      @default("[]") @map("notification_parties") @db.JsonB
  status               String    @default("unassigned") @db.VarChar(30)
  assignedTo           String?   @map("assigned_to") @db.Uuid
  assignedBy           String?   @map("assigned_by") @db.Uuid
  assignedAt           DateTime? @map("assigned_at") @db.Timestamptz(6)
  revocationReason     String?   @map("revocation_reason") @db.Text
  createdAt            DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt            DateTime  @default(now()) @map("updated_at") @db.Timestamptz(6)

  @@index([companyId, status], name: "idx_orphaned_tasks_company_status")
  @@index([originalUserId], name: "idx_orphaned_tasks_user")
  @@schema("identity")
  @@map("company_orphaned_tasks")
}
```

---

## NestJS Module Structure

```
apps/api/src/identity/
  companies/
    companies.module.ts
    companies.controller.ts          -- company CRUD + verification submission
    companies.service.ts             -- business logic (create, verify, suspend)
    companies.dto.ts
    company-members.controller.ts    -- members, invite, revoke
    company-members.service.ts
    company-members.dto.ts
    company-invitations.service.ts   -- token generation, accept, expire
    orphaned-tasks.service.ts        -- pool management, reassignment
  auth/
    context.controller.ts            -- GET /auth/contexts, POST /auth/contexts/select (new file)
  rbac/
    company-admin.guard.ts           -- new guard: checks is_admin for active company
    company-context.guard.ts         -- new guard: ensures active_company_id is set
    company-permission.guard.ts      -- new guard: checks member permissions JSONB
```

---

## Deliverables Checklist

### Data Layer
- [x] Migration: `identity.companies`
- [x] Migration: `identity.company_members`
- [x] Migration: `identity.company_invitations`
- [x] Migration: `identity.company_orphaned_tasks`
- [x] Prisma schema updated with all four models

### Auth Layer
- [x] `JwtPayload` extended with `active_company_id`, `active_company_role`, `active_company_is_admin`
- [x] `AuthService.login()` — detect multi-company users, return context selector response when applicable
- [x] `GET /auth/contexts` — list user's active company memberships
- [x] `POST /auth/contexts/select` — select company context and issue new JWT pair
- [x] Redis session updated with active company context

### Company Management
- [x] `CompaniesService` — create, read, update, submit-for-verification, list (admin), verify, reject, suspend
- [x] `CompaniesController` — all company registration & admin review endpoints
- [x] Slug auto-generation from company name (unique, URL-safe)
- [x] Company category validation against allowed role matrix

### Member Management
- [x] `CompanyMembersService` — invite, accept, update permissions, promote to admin, revoke
- [x] `CompanyInvitationsService` — token generation (cryptographically random, SHA-256 hashed), accept flow, auto-expire
- [x] Invitation acceptance for existing user → link to company
- [x] Invitation acceptance for new user → redirect to registration with pre-filled email, then auto-link *(backend: token preview endpoint; frontend deep-link to register flow is UI layer)*
- [x] Guard: company must retain at least one admin when promoting/revoking
- [x] `CompanyMembersController` — all member endpoints (via `CompaniesController`)

### Orphaned Tasks
- [x] `OrphanedTasksService` — create pool on revocation, identify tasks requiring third-party notification, assign, close
- [x] `OrphanedTasksController` — admin task pool endpoints
- [x] Hook into `CompanyMembersService.revokeAccess()` to auto-populate pool

### Guards
- [x] `CompanyContextGuard` — validates `active_company_id` from JWT exists and member is `active`
- [x] `CompanyAdminGuard` — validates `active_company_is_admin === true`
- [x] `CompanyPermissionGuard` — validates member permissions JSONB for specific resource/action

### Notifications
- [x] Company verified / rejected / suspended emails
- [x] Invitation email with tokenised deep-link (72h expiry)
- [x] Member access revoked email
- [x] Orphaned task summary email to company admin

### Audit
- [x] All company/member/context events logged to `identity.audit_logs` with `company_id` in payload

### Tests
- [x] Unit tests: `CompaniesService`, `CompanyMembersService`, `CompanyInvitationsService`, `OrphanedTasksService`
- [x] Unit tests: `CompanyAdminGuard`, `CompanyContextGuard`, `CompanyPermissionGuard`
- [ ] E2E: full invite-accept-login-context-switch flow *(requires running environment — deferred to integration phase)*
- [ ] E2E: revoke-access → orphaned task pool populated correctly *(deferred)*
- [ ] E2E: multi-company user login → context selection required *(deferred)*

---

## Acceptance Criteria

- [x] User registers, creates company profile; caller automatically becomes company admin
- [x] Company cannot add members until verification status is `verified`
- [x] Platform admin can verify / reject / suspend any company
- [x] Company admin invites user by email; user receives tokenised link valid for 72 hours
- [x] Existing user accepting invitation is linked to company; new user is routed to register first, then linked
- [x] A user can belong to multiple companies simultaneously
- [x] Login for multi-company user returns context selector; `POST /auth/contexts/select` issues full JWT
- [x] Single-company user receives JWT with company context embedded automatically on login
- [x] Individual/sole-proprietor user (no company) receives JWT with null company fields — backward compatible
- [x] JWT payload includes `active_company_id`, `active_company_role`, `active_company_is_admin`
- [x] All actions under a company context are tagged with `company_id` in audit logs
- [x] Company admin can view full activity history of all members under their company
- [x] Company admin can update a member's permissions within the role's allowed permission ceiling
- [x] Company admin can promote any member to admin
- [x] Company must always retain at least one admin — system rejects operations that would violate this
- [x] Revoking a member: member cannot log in to that company; all open tasks move to orphaned pool
- [x] Orphaned task pool flags tasks where third parties may need notification
- [x] Company admin can reassign orphaned tasks to other active members
- [x] Multiple admins supported; any admin can create new admins

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Sprint 01 — Infrastructure, Redis, RabbitMQ, notifications infra | ✅ Complete |
| Sprint 02 — `identity.users`, RBAC, JWT, `AuditService`, `NotificationService` | ✅ Complete |
| Sprint 03 — Property module (`agent_id` on listings feeds into orphaned task detection) | ✅ Complete |

## Blocks (Must complete before)

| Sprint | Why |
|--------|-----|
| Sprint 04 — Sales Progression | Agents act under company context; stage transitions tagged with company |
| Sprint 06 — Construction Projects | Contractors act under company context; milestone payments tagged |
| Sprint 07 — Contractor/Supplier Marketplace | Company profiles are the required foundation for marketplace listings and bidding |

---

## Sprint 07 Integration Notes

Sprint 07 defines `marketplace.contractor_profiles` and `marketplace.supplier_profiles` with `user_id UUID UNIQUE` — a single-user ownership model. This conflicts with the multi-user company model built here.

**Required adjustment in Sprint 07:** Replace the `user_id` anchor with a dual-key pattern:

```sql
-- marketplace.contractor_profiles (amended)
company_id  UUID UNIQUE REFERENCES identity.companies(id),  -- primary anchor for company service providers
user_id     UUID        REFERENCES identity.users(id),      -- retained for sole-proprietor / individual contractors

-- Exactly one of company_id or user_id must be set
CONSTRAINT chk_contractor_profile_owner
  CHECK (
    (company_id IS NOT NULL AND user_id IS NULL) OR
    (company_id IS NULL AND user_id IS NOT NULL)
  )
```

Apply the same pattern to `marketplace.supplier_profiles`.

**Prisma impact:** Sprint 07's `ContractorProfile` and `SupplierProfile` models gain an optional `companyId` field. The `user_id UNIQUE` constraint becomes conditional (unique partial index on non-null values only).

**Who creates the marketplace profile:**
- **Company** (`company_id` set) — the company admin creates the contractor/supplier profile after the company is `verified`; the profile inherits the company's `category` and `verification_status`
- **Individual** (`user_id` set) — a sole-proprietor with KYC approved creates their own profile directly (existing Sprint 07 flow unchanged)

**RFQ / quote attribution:** When a company member submits a quote (`marketplace.quotes.quoter_id`), the audit log and any escrow release must reference both the `company_id` and the acting `user_id` from the JWT company context. Sprint 07 should add a `company_id` column to `marketplace.quotes` and `marketplace.contracts` at that point.

**No Sprint 07 changes are needed now** — document this in the Sprint 07 file as a dependency note and implement the adjustments when Sprint 07 begins.
