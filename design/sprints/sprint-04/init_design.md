# Sprint 04 — Sales Progression & Legal Workflow
## Pre-Sprint Context: Platform State as of 2 March 2026

**Branch:** `feature/sprint-03-kickoff`  
**Default Branch:** `init-design`  
**Test Suite:** 280 total tests | 278 passing | 2 failing (Jest parse errors, not logic)  
**DB Migrations Applied:** 9  
**Previous Sprints:** 01 ✅ | 01-b ✅ | 02 ✅ | 02.1 ✅ | 03 ✅

> This document is the single source of context for Sprint 04 implementation. It consolidates the findings from all prior audit reports and describes the exact state of the codebase: what was built, what patterns were established, what is deferred, and what Spring 04 must implement.

---

## 1. Sprint Audit Summary

| Sprint | Scope | Grade | Status | Tests |
|--------|-------|-------|--------|-------|
| Sprint 01 – Infrastructure Foundation | Monorepo, Docker, CI/CD, Vault, ELK, Prometheus | A+ (100/100) | ✅ COMPLETE | 21 E2E pass |
| Sprint 01-b – Company Management | Companies, Members, Invitations, Orphaned Tasks, context-switching | ✅ PASS | ✅ COMPLETE | 46 pass |
| Sprint 02 – Identity, Auth, RBAC, KYC | JWT, 9-role RBAC, KYC state-machine, audit logs | PASS (3 rounds) | ✅ COMPLETE | 152 pass |
| Sprint 02.1 – Hardening | SendGrid/Twilio adapters, signed KYC download URLs, access control | ✅ PASS | ✅ COMPLETE | Included in 152 |
| Sprint 03 – Property Marketplace | Listing CRUD, PostGIS search, verification, fraud reporting | A (95/100) | ✅ COMPLETE | 40 pass (+192 total) |

---

## 2. Infrastructure Layer (Sprint 01)

### What Was Built
All 14 deliverables completed. Production-grade infrastructure is running.

| Component | Detail |
|-----------|--------|
| **Monorepo** | Turborepo — `apps/api` (NestJS), `apps/web` (Next.js), `apps/mobile` (React Native), `packages/shared-types`, `packages/ui`, `packages/config` |
| **Database** | PostgreSQL with PostGIS (`postgis/postgis:15-alpine`) — 12 bounded-context schemas live |
| **Cache** | Redis 7 (AOF persistence, health checks) |
| **Message Broker** | RabbitMQ 3 (management UI on :15672) |
| **Object Storage** | MinIO (S3-compatible, console on :9001) |
| **Secrets** | HashiCorp Vault (dev mode local, env-var fallback) |
| **Observability** | Prometheus + Grafana + ELK stack + Filebeat log shipping |
| **CI/CD** | GitHub Actions — lint → test → build → Snyk scan → deploy-staging (ECS) → deploy-prod (manual gate) |
| **IaC** | Terraform — VPC, RDS, ElastiCache, S3, ECS, ACM |
| **Security** | Helmet.js, CORS, nginx TLS 1.2/1.3, HSTS |

### Database Schemas (All Active)
```
identity.*       — Users, roles, KYC, sessions, companies
property.*       — Listings, ownership, verification
sales.*          — Purchase stages, documents  ← Sprint 04 target
financial.*      — Accounts, ledger, escrow
construction.*   — Projects, milestones, stages
marketplace.*    — Contractors, suppliers, RFQ
logistics.*      — Operators, deliveries, tracking
inspection.*     — Requirements, results, certificates
analytics.*      — Risk scores, predictions
ai_engine.*      — Design sessions, generated content
audit.*          — Shared audit logs
common.*         — Shared lookup tables
```

### Migrations Applied
```
202602210001_sprint02_identity_auth
202602210002_sprint03_property_marketplace
202602250003_identity_business_profile
202602260004_agent_contacts
202602260005_agent_reviews
202602260006_sprint01b_companies
202602280007_self_company
202603020008_property_listing_type
202603020009_company_id_on_transactions
```

Sprint 04 must create a **new migration** (suggested: `202603XXXXXX_sprint04_sales_progression`) under `apps/api/prisma/migrations/`.

---

## 3. Identity Layer (Sprint 02 + 02.1)

### What Was Built
All 11 deliverables complete. 24/24 API endpoints present. 152 tests passing.

#### Architecture Decisions
- **Module location:** `apps/api/src/identity/`
- **9 roles seeded on boot:** `admin`, `agent`, `buyer`, `seller`, `contractor`, `supplier`, `inspector`, `truck_operator`, `conveyancer`
- **RBAC:** `@Roles()` decorator + `RolesGuard` — role-based checks. Full permission matrix seeded in DB (`identity.permissions`, `identity.role_permissions`).
- **Path params:** All `:id` and `:roleId` params use `ParseUUIDPipe`

#### JWT Payload (Current Shape)
```typescript
export type JwtPayload = {
  sub: string;               // user UUID
  email: string;
  roles: string[];
  kyc_status: string | null; // null = no KYC record yet
  active_company_id: string | null;     // added in Sprint 01-b
  active_company_role: string | null;
  active_company_is_admin: boolean;
};
```

#### Token Architecture
| Token | Expiry | Storage |
|-------|--------|---------|
| Access JWT | 15 minutes | Client only |
| Refresh token | 7 days | Redis — SHA-256 hash; plaintext never persisted |

#### KYC State Machine
```
(none) → pending        [user: POST /kyc/submit]
pending → under_review  [admin: POST /admin/kyc/:id/start-review]
pending | under_review → approved  [admin: POST /admin/kyc/:id/approve]
pending | under_review → rejected  [admin: POST /admin/kyc/:id/reject]
```
Invalid transitions throw `409 Conflict`. JWT carries `kyc_status: string | null`.

#### Key Tables
| Table | Notable Columns |
|-------|----------------|
| `identity.users` | `id UUID`, `email`, `phone`, `status (active/suspended/deleted)`, `role`, `kyc_verified`, `last_login_at` |
| `identity.roles` | `id UUID`, `name` (9 roles seeded) |
| `identity.user_roles` | `user_id`, `role_id` |
| `identity.permissions` | `resource`, `action` (UNIQUE) |
| `identity.role_permissions` | `role_id`, `permission_id` |
| `identity.kyc_verifications` | `user_id`, `status`, `documents JSONB`, `reviewer_id` |
| `identity.refresh_tokens` | `user_id`, `token_hash`, `expires_at`, `revoked_at` |
| `identity.audit_logs` | `actor_id`, `action`, `resource_type`, `resource_id`, `previous_status`, `metadata JSONB`, `ip`, `user_agent` — **append-only via DB trigger** |
| `identity.user_business_profiles` | Sole-proprietor metadata — `user_id`, `business_name`, `registration_number`, `tax_number` |

#### Redis Key Patterns
| Key | TTL |
|-----|-----|
| `refresh_token:{hash}` | `REFRESH_TOKEN_EXPIRY` (7d) |
| `email_verify:{token}` | `EMAIL_VERIFY_EXPIRY` |
| `password_reset:{token}` | `PASSWORD_RESET_EXPIRY` |
| `login_attempts:{ip}` | 15 min |
| `session:{user_id}:{jti}` | Active company context (Sprint 01-b) |

#### Deferred Items (Must Complete Before Staging)
- **D1 — OAuth token verification:** `POST /auth/oauth/google|apple|facebook` endpoints exist but provider tokens not cryptographically verified. Acceptable for local dev only.
- **D2 — S3 wiring for document storage:** KYC file uploads store paths; actual MinIO/S3 write must be connected before real users.
- **D3 — TOTP MFA:** `MFASetup.tsx` and `MFAVerify.tsx` are frontend shells with passthrough. No backend MFA implemented.
- **D4 — Notification providers:** SendGrid/Twilio adapters exist; require real credentials in production. Local dev uses masked log fallback.

---

## 4. Company Management Layer (Sprint 01-b)

### What Was Built
Full company/business-partner layer on top of Sprint 02 identity. 46 tests passing.

**Module location:** `apps/api/src/identity/companies/`

#### New Tables (Migration `202602260006_sprint01b_companies`)
| Table | Purpose |
|-------|---------|
| `identity.companies` | Company profiles — `name`, `slug`, `category`, `status`, `verification_status`, `created_by` |
| `identity.company_members` | User → company many-to-many — `role`, `is_admin`, `status`, `permissions JSONB` |
| `identity.company_invitations` | Email-based invite flow — `token_hash` (SHA-256), `expires_at` (72h), `status` |
| `identity.company_orphaned_tasks` | Tasks pool when a member is revoked — `task_type`, `resource_type`, `resource_id`, `resource_snapshot JSONB`, `status (unassigned/assigned/closed)` |

**Migration `202602280007_self_company`** adds self-company mode (individual acting as their own company).  
**Migration `202603020009_company_id_on_transactions`** wires `company_id` onto financial transactions.

#### Company Categories
`agent | contractor | supplier | conveyancer | inspector | logistics | developing`

#### Context-Switching (Auth Extension)
```
POST /api/v1/auth/contexts/select  { company_id }
→ Issues new JWT with active_company_id, active_company_role, active_company_is_admin
```
Users with multiple companies receive `{ requires_context_selection: true, contexts: [...] }` on login and must call `/auth/contexts/select` before accessing company-scoped resources.

#### API Endpoints Added
```
POST   /api/v1/companies
GET    /api/v1/companies/:id
PATCH  /api/v1/companies/:id
POST   /api/v1/companies/:id/submit-verification
GET    /api/v1/admin/companies                   [paginated, ?status&category]
POST   /api/v1/admin/companies/:id/verify
POST   /api/v1/admin/companies/:id/reject
POST   /api/v1/admin/companies/:id/suspend
GET    /api/v1/companies/:id/members
POST   /api/v1/companies/:id/members/invite
PATCH  /api/v1/companies/:id/members/:memberId/permissions
POST   /api/v1/companies/:id/members/:memberId/promote-admin
DELETE /api/v1/companies/:id/members/:memberId   [triggers orphan pool]
GET    /api/v1/invitations/:token
POST   /api/v1/invitations/:token/accept
GET    /api/v1/auth/contexts
POST   /api/v1/auth/contexts/select
GET    /api/v1/companies/:id/orphaned-tasks
```

#### Guards Available for Reuse in Sprint 04
| Guard | File | Purpose |
|-------|------|---------|
| `CompanyAdminGuard` | `identity/companies/guards/` | User must be `is_admin` in the active company |
| `CompanyContextGuard` | `identity/companies/guards/` | JWT must have an `active_company_id` |
| `CompanyPermissionGuard` | `identity/companies/guards/` | Fine-grained permission check within company |

---

## 5. Property Marketplace (Sprint 03)

### What Was Built
All 10 deliverables complete. 40 Sprint 03 tests passing (198 when run in isolation). Grade A (95/100).

**Module location:** `apps/api/src/property/`

#### Tables (Migration `202602210002_sprint03_property_marketplace`)
| Table | Notable Details |
|-------|----------------|
| `property.properties` | `id UUID`, `agent_id`, `type (land/residential/commercial/off_plan)`, `status`, `price`, `currency`, `bedrooms`, `bathrooms`, `size_sqm`, `features JSONB`, `verification_status`, `listing_type` |
| `property.property_locations` | `geom GEOMETRY(Point, 4326)` + GIST index — PostGIS |
| `property.property_media` | Up to 20 files per listing; `type (photo/video)`, `is_primary`, ordering |
| `property.ownership_history` | Pre-platform ownership records |
| `property.verifications` | `status (unverified/pending/verified/flagged)` — state machine |
| `property.inquiries` | `type (viewing/offer/question)` — buyer → agent |
| `property.saved_properties` | `(user_id, property_id)` composite PK |
| `property.fraud_reports` | 5 report types; auto-flags property at ≥ 3 unresolved reports |
| `property.audit_logs` | Append-only — `BEFORE UPDATE OR DELETE` trigger (`trg_no_update_property_audit_logs`) |

**Migration `202603020008_property_listing_type`** adds `listing_type` column after post-sprint discovery (was causing HTTP 500 on login/register — now fixed).

#### Key Patterns to Replicate in Sprint 04
- **Ownership guard:** `assertAgentOwns(propertyId, userId)` — throws `ForbiddenException`. Replicate as `assertSaleParticipant(saleId, userId, allowedRoles)` for Sprint 04.
- **Parameterized raw SQL:** Dynamic search uses `$queryRawUnsafe` with positional params (`$1, $2, ...`) and a `values[]` array. Use this pattern for any complex Stage queries.
- **Immutable audit trigger:** Every domain module has its own `<schema>.audit_logs` table with a `BEFORE UPDATE OR DELETE` trigger. Sprint 04 must add `sales.audit_logs` with the same pattern.
- **State machine:** Verification service uses `current_status → valid_next_statuses` map with `ConflictException` on invalid transitions. Reuse this exact pattern for stage progression.
- **Auto-flagging:** Fraud auto-flags a property at threshold. Replicate for sale dispute/escalation logic.

#### Controllers
| Controller | Auth |
|-----------|------|
| `PropertyController` | `agent`, `admin` |
| `AgentDashboardController` | `agent`, `admin` |
| `VerificationController` | `agent` |
| `AdminVerificationController` | `admin` |
| `BuyerController` | authenticated |
| `InquiryResponseController` | `agent`, `admin` |
| `SavedPropertiesController` | authenticated |
| `FraudController` | authenticated |
| `AdminFraudController` | `admin` |

#### Verification State Machine
```
unverified → pending (agent submits)
pending → verified | flagged (admin action)
```

#### Geo-Search
```sql
ST_DWithin(loc.geom::geography, ST_SetSRID(ST_MakePoint($lon,$lat),4326)::geography, $radius_meters)
```

---

## 6. Web Frontend (apps/web)

Next.js app at `apps/web/`. The following views are implemented:

### Auth / Identity Views
`Login.tsx`, `LoginEnhanced.tsx`, `Register.tsx`, `EmailVerification.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`, `OAuthConnect.tsx`, `MFASetup.tsx`, `MFAVerify.tsx`, `KYCUpload.tsx`, `ProfileSetup.tsx`, `ProfileDashboard.tsx`, `RoleSelection.tsx`, `SessionExpired.tsx`, `ChangePassword.tsx`

### Company Views
`CompanyRegistration.tsx`, `CompanyProfile.tsx`, `CompanyDashboard.tsx`, `CompanyStatus.tsx`, `CompanyContextSelect.tsx`, `CompanyRoleSelector.tsx`, `CompanyUserManagement.tsx`, `CompanyAdminManagement.tsx`, `CompanyPermissions.tsx`, `CompanyInviteUser.tsx`, `CompanyRevokedPool.tsx`, `CompanyActivityLogs.tsx`, `MyCompanies.tsx`, `AcceptInvitation.tsx`

### Property Views
`Listings.tsx`, `PropertyDetail.tsx`, `PropertyDetailEnhanced.tsx`, `PropertyComparison.tsx`, `PropertyLifecycleDashboard.tsx`, `AgentDashboard.tsx`, `AgentDashboardEnhanced.tsx`, `AgentProfile.tsx`, `BuyerDashboard.tsx`, `BuyerDashboardEnhanced.tsx`, `BuyerSimpleView.tsx`

### Pre-built Sprint 04 / Forward-Looking Views (stubs — not wired to API)
`PropertySaleWorkspace.tsx` — **sales progression workspace; Sprint 04 target**  
`ConveyancerView.tsx` — conveyancer case management  
`EscrowFinancialDashboard.tsx` — Sprint 05 target  
`ConstructionProjectDashboard.tsx` — Sprint 06 target  
`IntelligentBOQWorkspace.tsx` — Sprint 08 target  
`ServiceProviderMarketplace.tsx` — Sprint 07 target  
`LogisticsDeliveryMarketplace.tsx` — Sprint 10 target  
`InspectionVerificationModule.tsx` — Sprint 09 target  
`RiskAnalyticsDashboard.tsx` — Sprint 11 target  
`AIDesignStudio.tsx` — Sprint 12 target  
`AdminDashboard.tsx`, `AdminVerificationPanel.tsx`

### Navigation Shell
`AppSidebar.tsx` — context-aware sidebar (Self vs Company context). Implemented in Sprint 01-b.  
`route-policy.ts` — `apps/web/src/lib/route-policy.ts` — defines authenticated/public/no-navbar routes. All 12 authenticated routes wired. **Sprint 04 must add sales-related routes here.**

---

## 7. Shared Types & Services Available

### `audit.service.ts` (`identity/audit.service.ts`)
```typescript
auditService.log({
  actorId: string,
  action: string,          // e.g. 'sale.stage.completed'
  resourceType: string,    // e.g. 'property_sale'
  resourceId: string,
  previousStatus?: string,
  metadata?: Record<string, unknown>,
  ip?: string,
  userAgent?: string,
})
```
Sprint 04 should use this service for all sale/stage/document events.

### `notification.service.ts`
```typescript
notificationService.sendEmail(recipient, subject, body)
notificationService.sendSms(recipient, message)
```
SendGrid + Twilio adapters wired. Graceful fallback to masked logging when credentials absent.  
**Use for:** stage-completion notifications, document reminder emails, stalled-sale alerts.

### `document-storage.service.ts`
```typescript
documentStorageService.storeDocument(file, userId, context)
documentStorageService.getSignedDownloadUrl(path, actorId, isAdmin)
```
Handles upload validation (MIME, 50MB limit), path generation, and time-bound signed URL issuance.  
**Use for:** `sales.stage_documents` uploads in Sprint 04.

### `property-audit.service.ts`
```typescript
propertyAuditService.log({ actorId, action, resourceType, resourceId, changes })
```
Property-scoped audit writer. Sprint 04 should create `SalesAuditService` in the same pattern.

---

## 8. Current Test Suite State

```
Total:   280 tests
Passing: 278
Failing: 2 (Jest parse errors in new/untested files — not logic failures)
Suites failing to parse: 29 (import/syntax issues in stub or partially-implemented files)
```

**Important for Sprint 04:** The 29 failing suites are caused by Jest encountering files with non-standard syntax or missing mock setup — **not business logic regressions**. Sprint 04 must:
1. Add test files for all new services (`sales.service.spec.ts`, `stage-progress.service.spec.ts`, etc.)
2. Ensure `jest.config.js` `testPathPattern` excludes any stub view files it cannot parse
3. Maintain the 80% coverage gate enforced in CI

**Known DB connection noise in tests:**
```
[PrismaService] Database health check failed   ← Expected in CI/unit tests (no real DB)
[RedisService] Redis health check failed       ← Same — mocked via ioredis mock
```
These are cosmetic noise, not failures. Fixed upstream with `ioredis` constructor mock in `redis.service.spec.ts`.

---

## 9. Architecture Patterns Established (MUST Follow in Sprint 04)

### 9.1 Module Structure
```
apps/api/src/sales/
├── sales.module.ts
├── sales.controller.ts
├── sales.service.ts
├── sales.service.spec.ts
├── sales.dto.ts
├── stage-progress.service.ts
├── stage-progress.service.spec.ts
├── stage-documents.service.ts
├── stage-documents.service.spec.ts
├── government-interactions.service.ts
├── sale-messages.service.ts
├── sales-audit.service.ts
└── index.ts
```
Register `SalesModule` in `apps/api/src/app.module.ts`.

### 9.2 Database Rules (PDR-006)
- All Sprint 04 tables go in the `sales.*` schema
- **No cross-schema FK constraints** — reference `identity.users.id` or `property.properties.id` by UUID only; referential integrity at application layer
- Every new table must have a corresponding `sales.audit_logs` entry on write
- **Append-only trigger required** on `sales.audit_logs`:
```sql
CREATE OR REPLACE FUNCTION sales.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'Audit logs are immutable'; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_sales_audit_logs
BEFORE UPDATE OR DELETE ON sales.audit_logs
FOR EACH ROW EXECUTE FUNCTION sales.prevent_audit_log_modification();
```

### 9.3 Error Handling
- `NotFoundException` for unknown resource IDs
- `ForbiddenException` for access outside sale party
- `ConflictException` for invalid state-machine transitions
- `BadRequestException` for invalid DTOs
- All errors pass through `SentryExceptionFilter` (registered globally in `main.ts`)

### 9.4 Guards Pattern
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('conveyancer', 'agent', 'admin')
@Controller('api/v1/sales')
export class SalesController { ... }
```
For sale-party access (buyer/seller/agent/conveyancer on *their* sale), implement `SalePartyGuard` that validates the requesting user's JWT `sub` is one of `seller_id`, `buyer_id`, `agent_id`, `buyer_conveyancer_id`, or `seller_conveyancer_id` on the sale record.

### 9.5 DTOs & Validation
Use `class-validator` decorators on all DTOs. All `:id` path params get `ParseUUIDPipe`. Register `ValidationPipe` globally (already set in `main.ts`).

---

## 10. Sprint 04 Scope Reference

**Goal:** Build the 14-stage property purchase pipeline — full transparency, multi-party, document management, government tracking, communications.

### Database Tables to Create
```sql
sales.property_sales
sales.stage_configs        -- configurable per country
sales.sale_stage_progress
sales.stage_documents
sales.government_interactions
sales.sale_issues
sales.sale_messages
sales.audit_logs           -- append-only, with immutable trigger
```
Detailed schema: see `design/sprints/sprint-04-sales-progression.md` (Data Models section).

### The 14 Stages (Default — ZA)
| # | Stage | Owner | Blocker |
|---|-------|-------|---------|
| 1 | Offer Submitted | Agent/Buyer | No |
| 2 | Offer Accepted | Agent/Seller | No |
| 3 | Sale Agreement Drafted | Conveyancer | No |
| 4 | Sale Agreement Signed | Both Parties | **Yes** |
| 5 | Deposit to Escrow | Buyer | **Yes** |
| 6 | Title Deed Search | Conveyancer / Land Registry | No |
| 7 | Property Survey / Valuation | Inspector | No |
| 8 | Bond / Mortgage Approval | Buyer | No |
| 9 | Compliance Certificates | Conveyancer | No |
| 10 | Rates Clearance | Conveyancer / Municipality | No |
| 11 | Deeds Office Submission | Conveyancer / Deeds Office | No |
| 12 | Transfer Duty Payment | Buyer / Tax Authority | **Yes** |
| 13 | Deeds Office Registration | Deeds Office | **Yes** |
| 14 | Final Payment & Handover | Buyer/Seller/Conveyancer | — |

Blocker stages must be `completed` before `stage_number + 1` can move to `in_progress`.

### Minimum API Endpoints
```
POST /api/v1/sales                                           [agent]
GET  /api/v1/sales/:id                                       [sale parties]
GET  /api/v1/sales/me                                        [authenticated]
PATCH /api/v1/sales/:id/assign-conveyancer                   [agent, admin]

GET  /api/v1/sales/:id/stages                                [sale parties]
POST /api/v1/sales/:id/stages/:stageNum/start                [responsible role]
POST /api/v1/sales/:id/stages/:stageNum/complete             [responsible role]
POST /api/v1/sales/:id/stages/:stageNum/flag                 [any party]

POST   /api/v1/sales/:id/stages/:stageNum/documents          [conveyancer, agent]
GET    /api/v1/sales/:id/documents                           [sale parties]
PATCH  /api/v1/sales/:id/documents/:docId/status             [admin, conveyancer]
DELETE /api/v1/sales/:id/documents/:docId                    [uploader]

POST  /api/v1/sales/:id/government-interactions              [conveyancer]
PATCH /api/v1/sales/:id/government-interactions/:intId       [conveyancer]

POST /api/v1/sales/:id/messages                              [sale parties]
GET  /api/v1/sales/:id/messages                              [sale parties]
```

### Key Business Rules
1. A sale can only be created against a `property` with `status = 'active'` and `verification_status = 'verified'`
2. Blocker stages prevent auto-advancement — system throws `ConflictException` if `stageNum+1` start is attempted while a blocker is not `completed`
3. Stage config is seeded from `sales.stage_configs` per `country` (seed ZA default on boot)
4. `sale_reference` must be unique, human-readable (e.g. `SALE-20260304-XXXX`)
5. Any sale party can flag a stage; flagging creates a `sale_issues` record and sends notifications
6. Document status flow: `pending → received → verified | rejected`
7. Every stage transition, document upload, and message must produce an audit log entry

---

## 11. Known Carry-Forward Items for Sprint 04 Consideration

| Item | Source | Risk |
|------|--------|------|
| OAuth token verification unimplemented | Sprint 02 D1 | Medium — don't expose OAuth in production |
| S3 not wired for file uploads | Sprint 02 D2 | Low for sprint 04 — use same stub URL strategy as Sprint 03 started with, then wire |
| MFA (TOTP) not implemented | Sprint 02 D3 | Low — Sprint 04 doesn't introduce new auth flows |
| Test teardown causes DB/Redis noise in logs | Sprint 03 | Low — cosmetic; doesn't affect test pass rate |
| 29 Jest suite parse failures | Current | Medium — fix `jest.config.js` test path exclusions before Sprint 04 CI runs |
| `company_id` on transactions | Migration 009 | Sprint 05 (Escrow) dependency; column exists, not yet used |

---

## 12. Running the Platform Locally

```bash
# Start all infrastructure
docker-compose up -d

# Run API in dev mode (port 3001)
npm run dev --workspace=apps/api

# Run Web in dev mode (port 3000)
npm run dev --workspace=apps/web

# Run all tests
npx jest --workspace=apps/api

# Run only sales tests (Sprint 04)
npx jest --testPathPattern="sales"

# Apply new migration
cd apps/api && npx prisma migrate dev --name sprint04_sales_progression

# Generate Prisma client after schema changes
cd apps/api && npx prisma generate
```

### Key Service Ports
| Service | Port |
|---------|------|
| API (NestJS) | 3001 |
| Web (Next.js) | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| RabbitMQ | 5672 / 15672 (mgmt) |
| MinIO | 9000 / 9001 (console) |
| Elasticsearch | 9200 |
| Kibana | 5601 |
| Prometheus | 9090 |
| Grafana | 3002 |
| Vault | 8200 |

---

## 13. File Location Quick Reference

| What | Where |
|------|-------|
| NestJS app root | `apps/api/src/app.module.ts` |
| NestJS entrypoint | `apps/api/src/main.ts` |
| Prisma schema | `apps/api/prisma/schema.prisma` |
| Migrations | `apps/api/prisma/migrations/` |
| Identity module | `apps/api/src/identity/` |
| Property module | `apps/api/src/property/` |
| Companies module | `apps/api/src/identity/companies/` |
| Auth types (JWT payload) | `apps/api/src/identity/auth/auth.types.ts` |
| Env validation | `apps/api/src/config/env.validation.ts` |
| PrismaService | `apps/api/src/database/prisma.service.ts` |
| RedisService | `apps/api/src/cache/redis.service.ts` |
| AuditService | `apps/api/src/identity/audit.service.ts` |
| NotificationService | `apps/api/src/identity/notification.service.ts` |
| DocumentStorageService | `apps/api/src/identity/document-storage.service.ts` |
| RolesGuard | `apps/api/src/identity/rbac/` |
| Web views | `apps/web/src/views/` |
| Route policy | `apps/web/src/lib/route-policy.ts` |
| Shared types | `packages/shared-types/` |
| Docker Compose | `docker/docker-compose.yml` |
| GitHub Actions CI | `.github/workflows/ci.yml` |
| Terraform | `infrastructure/terraform/` |
| Sprint 04 spec | `design/sprints/sprint-04-sales-progression.md` |
