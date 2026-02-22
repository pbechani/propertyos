# Sprint 02 — Completion Summary

**Sprint:** 02 — Identity, Auth, RBAC & KYC  
**Completed:** 2026-02-21  
**Final Audit Grade:** PASS — 152/152 tests passing, all issues resolved across 3 audit rounds  
**Next Sprint:** Sprint 03 — Property Marketplace ✅ APPROVED TO START

---

## 1. What Was Delivered

Sprint 02 built the complete identity and trust layer for the platform. All 11 deliverables were implemented and hardened through three audit rounds.

| Deliverable | Status | Notes |
|-------------|--------|-------|
| User registration & login (JWT + refresh rotation) | ✅ | bcrypt 12 rounds, SHA-256 hashed refresh tokens |
| OAuth login (Google, Apple, Facebook) | ✅ | Endpoint complete; provider token verification deferred (D1) |
| Password reset & email verification | ✅ | Redis one-time tokens, TTL-based expiry |
| Session management (Redis-backed) | ✅ | Per-user session revocation + revoke-all-sessions |
| 9-role RBAC permission system | ✅ | Seeded on boot; full permission matrix in DB |
| Role assignment workflow | ✅ | Admin endpoints with audit logs |
| KYC document upload & review workflow | ✅ | Full state machine with admin start-review/approve/reject |
| Admin verification dashboard APIs | ✅ | Paginated pending list |
| Notification service (email + SMS abstraction) | ✅ | PII-masked stub; provider wiring deferred (D3) |
| Document storage service | ✅ | Upload validation done; S3 real URLs deferred (D2) |
| Append-only audit log infrastructure | ✅ | DB trigger + application layer, immutable |

---

## 2. Architecture Decisions Made

### 2.1 Module Location
All identity code lives under `apps/api/src/identity/`. The module is registered in `AppModule` and uses schema-isolated tables under `identity.*` in PostgreSQL.

### 2.2 RBAC Design
- **9 roles:** `admin`, `agent`, `buyer`, `seller`, `contractor`, `supplier`, `inspector`, `truck_operator`, `conveyancer`
- Roles and permissions seeded on startup via `IdentityBootstrapService`
- Permission checks use `@Roles()` decorator + `RolesGuard`
- `SELF_REGISTRATION_ROLES` constant excludes `admin` from public registration — a user can only receive `admin` via admin assignment

### 2.3 Token Architecture
| Token | Expiry | Storage | Notes |
|-------|--------|---------|-------|
| Access JWT | 15 minutes | Client only | Contains `userId`, `email`, `roles`, `kyc_status` |
| Refresh token | 7 days | Redis (SHA-256 hash) | Plaintext never persisted; rotates on each use |

- `JWT_SECRET` must be set in production/staging or the app refuses to start
- `resolveExpiryDate()` handles `d`, `h`, `m`, `s` suffixes; logs a warning on unrecognised suffix

### 2.4 KYC State Machine
Valid transitions only:
```
(none) → pending       [user submits]
pending → under_review [admin: start-review]
pending | under_review → approved [admin: approve]
pending | under_review → rejected [admin: reject]
```
Invalid transitions throw `409 Conflict`. The JWT carries `kyc_status: string | null` — `null` means no KYC record exists yet (not `'pending'`).

### 2.5 Audit Logs
- `identity.audit_logs` is append-only enforced by DB trigger `trg_no_update_identity_audit_logs`
- Every state-changing action writes an audit row with `actor_id`, `action`, `resource_id`, `previous_status`, `metadata`, `ip`, `user_agent`
- Admin user-read (`GET /users/:id`) is also audited
- `updateMe` only audits fields that were actually sent (not `undefined` DTO properties)

### 2.6 Redis Usage
| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `refresh_token:{hash}` | Active refresh token per session | `REFRESH_TOKEN_EXPIRY` |
| `email_verify:{token}` | Email verification one-time token | `EMAIL_VERIFY_EXPIRY` |
| `password_reset:{token}` | Password reset one-time token | `PASSWORD_RESET_EXPIRY` |
| `login_attempts:{ip}` | Rate limiting (5/15min) | 15 minutes |

---

## 3. Database Schema — `identity.*`

Migration file: `apps/api/prisma/migrations/202602210001_sprint02_identity_auth/migration.sql`

### Tables

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `identity.users` | `id UUID`, `email`, `phone`, `status (active/suspended/deleted)`, `role`, `kyc_verified`, `last_login_at` | Primary user record |
| `identity.roles` | `id UUID`, `name`, `description` | 9 roles seeded on boot |
| `identity.user_roles` | `user_id`, `role_id` | Many-to-many join |
| `identity.permissions` | `id UUID`, `resource`, `action` | All permissions seeded |
| `identity.role_permissions` | `role_id`, `permission_id` | Permission matrix seeded |
| `identity.kyc_verifications` | `id UUID`, `user_id`, `status`, `documents JSONB`, `reviewer_id`, `reviewed_at` | One active record per user |
| `identity.refresh_tokens` | `id UUID`, `user_id`, `token_hash`, `expires_at`, `revoked_at` | SHA-256 hashed |
| `identity.audit_logs` | `id UUID`, `actor_id`, `action`, `resource_type`, `resource_id`, `previous_status`, `metadata JSONB`, `ip`, `user_agent`, `created_at` | Append-only via DB trigger |

### Cross-Schema References
Sprint 02 tables reference only within `identity.*`. **No cross-schema FK references** per PDR-006. Other schemas (e.g. `property.*` in Sprint 03) reference `identity.users.id` by storing the UUID directly without a database foreign key — referential integrity enforced at the application layer.

---

## 4. API Endpoints Delivered

### Auth (`/api/v1/auth`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/register` | Public | `SELF_REGISTRATION_ROLES` validates role |
| POST | `/login` | Public | Rate-limited 5/15min per IP; status check |
| POST | `/logout` | JWT | Revokes single refresh token |
| POST | `/refresh` | — | Rotates refresh token; status check |
| POST | `/forgot-password` | Public | Silent on unknown email |
| POST | `/reset-password` | — | Revokes all sessions on success |
| POST | `/verify-email` | — | One-time Redis token |
| POST | `/oauth/google` | Public | Provider token not yet verified (D1) |
| POST | `/oauth/apple` | Public | Provider token not yet verified (D1) |
| POST | `/oauth/facebook` | Public | Provider token not yet verified (D1) |

### Users (`/api/v1/users`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/me` | JWT | Returns sanitized user |
| PATCH | `/me` | JWT | Early-returns on empty body (no DB write) |
| GET | `/:id` | Admin | Audited |
| PATCH | `/:id/status` | Admin | Triggers `revokeAllSessions` on suspend/delete |
| GET | `/:id/roles` | Admin | — |
| POST | `/:id/roles` | Admin | — |
| DELETE | `/:id/roles/:roleId` | Admin | All `:id`/`:roleId` use `ParseUUIDPipe` |

### KYC (`/api/v1/kyc` and `/api/v1/admin/kyc`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/kyc/submit` | JWT | 409 if active submission exists |
| GET | `/kyc/status` | JWT | — |
| GET | `/admin/kyc/pending` | Admin | Paginated (`?limit&offset`) |
| GET | `/admin/kyc/:id` | Admin | — |
| POST | `/admin/kyc/:id/start-review` | Admin | `pending → under_review` |
| POST | `/admin/kyc/:id/approve` | Admin | State-machine guarded |
| POST | `/admin/kyc/:id/reject` | Admin | State-machine guarded |

### Audit (`/api/v1/audit-logs` and `/api/v1/admin/audit-logs`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/audit-logs/me` | JWT | Paginated (`?limit&offset`) |
| GET | `/admin/audit-logs` | Admin | Paginated (`?limit&offset`) |

---

## 5. Services & Guards — Quick Reference

| Class | File | Purpose |
|-------|------|---------|
| `AuthService` | `identity/auth/auth.service.ts` | All auth flows; `issueTokens()` accepts `prefetchedRoles` to avoid double DB call |
| `UsersService` | `identity/users.service.ts` | User CRUD, role management, KYC status; `getLatestKycStatus()` returns `null` for no KYC |
| `KycService` | `identity/kyc.service.ts` | KYC state machine; all transitions return `{ record, previousStatus }` |
| `AuditService` | `identity/audit.service.ts` | Writes to `identity.audit_logs`; used by all controllers |
| `NotificationService` | `identity/notification.service.ts` | PII-masked log stub; ready for provider wiring |
| `DocumentStorageService` | `identity/document-storage.service.ts` | Upload validation; returns stub URLs until S3 wired |
| `IdentityBootstrapService` | `identity/identity.bootstrap.service.ts` | Seeds roles + permissions on startup (`ON CONFLICT DO NOTHING`) |
| `JwtStrategy` | `identity/auth/jwt.strategy.ts` | Validates JWT; throws on startup if `JWT_SECRET` missing in prod/staging |
| `JwtAuthGuard` | `identity/rbac/jwt-auth.guard.ts` | Requires valid JWT |
| `RolesGuard` | `identity/rbac/roles.guard.ts` | Used with `@Roles()` decorator |

---

## 6. JWT Payload Shape

```typescript
interface JwtPayload {
  sub: string;          // user UUID
  email: string;
  roles: string[];      // e.g. ['agent']
  kyc_status: string | null;  // null = no KYC record; 'pending'|'under_review'|'approved'|'rejected'
  iat: number;
  exp: number;
}
```

Sprint 03 controllers can access this via `@Request() req` → `req.user` after `JwtAuthGuard`. The `roles` array is available directly in the JWT payload, avoiding a DB call in most cases (use `req.user.roles?.[0]` for single-role context).

---

## 7. Security Measures in Place

| Measure | Detail |
|---------|--------|
| Bcrypt | 12 rounds (configurable via `BCRYPT_ROUNDS` env var) |
| Refresh token hashing | SHA-256 stored; plaintext never reaches DB |
| Append-only audit | DB trigger blocks `UPDATE`/`DELETE` on `identity.audit_logs` |
| Rate limiting | 5 failed login attempts / 15 min per IP (Redis counter) |
| UUID path params | `ParseUUIDPipe` on all `:id` / `:roleId` to prevent 500s |
| Status checks | `login()`, `oauthLogin()`, `refresh()` all block `status !== 'active'` |
| Revoke-all-sessions | Called automatically on password reset and account suspension/deletion |
| Admin self-registration | Blocked via `SELF_REGISTRATION_ROLES` constant |
| KYC state machine | Transitions guarded; `ConflictException` on invalid path |
| `JWT_SECRET` guard | App refuses to start in prod/staging if not set |
| PII masking | Email/phone masked in all log output |
| No SQL injection | All queries use Prisma parameterised tagged template literals |
| One-time tokens | Email-verify and password-reset tokens deleted from Redis on first use |

---

## 8. Environment Variables Added in Sprint 02

```env
# JWT
JWT_SECRET=<min 32 chars — required in production/staging>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Bcrypt
BCRYPT_ROUNDS=12

# Token expiries
EMAIL_VERIFY_EXPIRY=24h
PASSWORD_RESET_EXPIRY=1h

# OAuth (provider credentials — for future wiring)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Notifications (for future wiring)
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Encryption
ENCRYPTION_KEY=<min 32 chars — required in production/staging>
```

---

## 9. Test Coverage

| File | Tests | Coverage Areas |
|------|-------|----------------|
| `identity/auth/auth.service.spec.ts` | 37 | register, login, logout, refresh (incl. suspended account), forgotPassword, resetPassword, verifyEmail, oauthLogin, rate-limit |
| `identity/users.service.spec.ts` | 22 | findById, findByEmail, create, updateMe, updateStatus, listUserRoles, assignRole, removeRole, getUserRoleNames, getLatestKycStatus (returns null), markLastLogin, markEmailVerified, sanitizeUser |
| `identity/kyc.service.spec.ts` | 14 | submit, getLatestByUser, listPending, getById, approve, reject, sanitize |
| `identity/rbac/roles.guard.spec.ts` | 8 | no-roles passthrough, role match, role mismatch, missing user |
| `config/env.validation.spec.ts` | Updated | Correctly includes required secrets for prod/staging cases |
| **Total** | **152/152** | All passing |

---

## 10. Known Deferred Items (Pre-Sprint 03)

These were explicitly deferred and are not blockers for Sprint 03 but **must be completed before staging/production**:

| # | Item | Risk | When |
|---|------|------|------|
| D1 | OAuth provider token verification (verify token against Google/Apple/Facebook before trusting `dto.email`) | High — any caller can impersonate an email | Before staging |
| D2 | S3 real signed URLs in `DocumentStorageService` (`storage.pribec.local` is a stub) | High — no real file storage | Before real user onboarding |
| D3 | Notification provider integration (SendGrid / Twilio) | Medium — emails/SMS not sent | Before staging |

---

## 11. Sprint 03 Integration Points

Sprint 03 (Property Marketplace) builds on top of Sprint 02's identity layer. Key integration points:

### 11.1 Auth Guards
Reuse existing guards directly:
```typescript
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('agent', 'admin')
```

### 11.2 User Reference Pattern
Sprint 03 tables will store `agent_id` and `owner_id` as UUIDs referencing `identity.users(id)`. Per PDR-006, **no cross-schema database foreign keys** — store the UUID and resolve at the application layer:
```sql
agent_id UUID,  -- references identity.users(id) — no FK constraint
owner_id UUID   -- references identity.users(id) — no FK constraint
```

### 11.3 Roles Required in Sprint 03
| Role | Sprint 03 Usage |
|------|-----------------|
| `agent` | Create/manage listings, respond to inquiries |
| `buyer` | Browse, save, inquire, schedule viewings |
| `admin` | Verify properties, manage fraud reports |
| `seller` | Overlaps with agent for private sales |

All of these are already seeded in the DB. No new roles needed for Sprint 03.

### 11.4 Audit Log Pattern
Follow the same pattern used throughout Sprint 02 — inject `AuditService` and call it before returning from any state-changing endpoint:
```typescript
await this.auditService.log({
  actorId: req.user.sub,
  action: 'property.created',
  resourceType: 'property',
  resourceId: property.id,
  metadata: { title: property.title },
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});
```
Note: Sprint 03 audit logs should go to `audit.audit_logs` (shared schema) or `property.audit_logs`, **not** `identity.audit_logs` (which is identity-specific). Clarify schema placement at sprint start.

### 11.5 KYC Gate (Optional for Sprint 03)
If Sprint 03 needs to restrict certain property actions to KYC-verified users, check `req.user.kyc_status === 'approved'` from the JWT payload. No additional DB call needed.

### 11.6 `ParseUUIDPipe` Pattern
All path params that accept UUIDs must use `ParseUUIDPipe` — already established as a convention in Sprint 02:
```typescript
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) { ... }
```

### 11.7 Document/Media Uploads
Sprint 02 laid down `DocumentStorageService` with upload validation. Sprint 03 needs **photo/video uploads** for property listings. Options:
- Extend `DocumentStorageService` for property media (recommended for consistency)
- Create a separate `MediaStorageService` in the `property` module
- Either way, S3 must be wired before real uploads work (Deferred item D2)

### 11.8 PostGIS for Geo Search
Sprint 03 requires `GEOMETRY(Point, 4326)` and `GIST` index for geo-radius search. This requires the `postgis` extension in PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```
Add this to the Sprint 03 migration. Verify PostGIS is available in the Docker image (`postgres:15-alpine` does **not** include PostGIS — switch to `postgis/postgis:15-alpine` or install via `docker-entrypoint-initdb.d`).

---

## 12. Frontend UI Wiring (Phase UI-2)

Completed 2026-02-22. All Sprint 02 UI screens in `apps/web/src/views/` are now wired to the live backend. No hardcoded mock data remains in any Sprint 02 screen.

### 12.1 API Client Extensions

File: `apps/web/src/lib/api-client.ts`

New exports added:

| Export | Endpoints Used | Purpose |
|--------|---------------|--------|
| `authExtApi.logout()` | POST /auth/logout | Token revocation |
| `authExtApi.refresh()` | POST /auth/refresh | Token rotation |
| `KycRecord` type | — | Full KYC record shape |
| `adminKycApi.listPending()` | GET /admin/kyc/pending | Paginated queue |
| `adminKycApi.getById()` | GET /admin/kyc/:id | Record detail |
| `adminKycApi.startReview()` | POST /admin/kyc/:id/start-review | State transition |
| `adminKycApi.approve()` | POST /admin/kyc/:id/approve | State transition |
| `adminKycApi.reject()` | POST /admin/kyc/:id/reject | State transition |
| `AuditLogEntry` type | — | Audit log entry shape |
| `auditApi.getMyLogs()` | GET /audit-logs/me | User activity |
| `auditApi.getAdminLogs()` | GET /admin/audit-logs | Admin audit tab |
| `adminUsersApi.getUser()` | GET /users/:id (admin) | User detail for KYC panel |
| `adminUsersApi.updateUserStatus()` | PATCH /users/:id/status | Admin user status |

Also added `roles?: string[]` and `role?: string | null` fields to `AuthUser` type to match the actual API response shape.

### 12.2 Screens Modified

| Screen | Change |
|--------|--------|
| `RoleSelection.tsx` | Stores role in `sessionStorage` (`pribec.pending_role`); routes to `/register` |
| `Register.tsx` | Reads role from `sessionStorage` on submit; passes to `authApi.register()`; clears key after |
| `MFAVerify.tsx` | Removed hardcoded `if (code === "123456")` check; TOTP is a Sprint 02 deferred item |
| `MFASetup.tsx` | Removed hardcoded secret `JBSWY3DPEHPK3PXP`; placeholder until TOTP backend is wired |
| `SessionExpired.tsx` | Calls `clearAuthSession()` on mount to purge stale tokens |
| `ProfileDashboard.tsx` | Full live data: real KYC status → verification levels & trust score; audit logs → activity timeline; edit panel → `usersApi.updateMe()` |
| `AdminVerificationPanel.tsx` | Full rewrite: live KYC queue, lazy user details, approve/reject/start-review API calls, reviewer notes, loading states, live audit logs tab |

### 12.3 Screens Already Wired (No Changes Needed)

These screens were correctly wired during the initial UI migration phase:

| Screen | API Used |
|--------|----------|
| `LoginEnhanced.tsx` | `authApi.login()`, `saveAuthSession()` |
| `ForgotPassword.tsx` | `authApi.forgotPassword()` |
| `ResetPassword.tsx` | `authApi.resetPassword()` |
| `EmailVerification.tsx` | `authApi.verifyEmail()` |
| `OAuthConnect.tsx` | `authApi.oauthLogin()` |
| `ProfileSetup.tsx` | `usersApi.me()`, `usersApi.updateMe()` |
| `KYCUpload.tsx` | `kycApi.getStatus()`, `kycApi.submit()` |

### 12.4 Implementation Notes

- **`/admin/kyc/pending` userId-only constraint:** The paginated KYC queue endpoint returns only `userId` (no joined user data). `AdminVerificationPanel` resolves this by lazy-loading user details via `GET /users/:id` (admin) on row selection and caching results in a `userMap` state record.
- **MFA deferred:** TOTP MFA (`MFASetup`, `MFAVerify`) is not in the Sprint 02 backend. Both screens now contain a comment explaining the deferred status with a passthrough flow.
- **Role flow:** `RoleSelection → sessionStorage → Register` — the role is bridged via `sessionStorage` key `pribec.pending_role` since the two screens are separate routes.

---

## 13. Files to Read Before Implementing Sprint 03

1. `design/sprints/sprint-03-property-marketplace.md` — Full spec with all data models, endpoints, and acceptance criteria
2. `apps/api/src/identity/identity.module.ts` — Module wiring pattern to replicate for `PropertyModule`
3. `apps/api/src/identity/auth/auth.service.ts` — Reference for service patterns, error handling conventions
4. `apps/api/src/identity/audit.service.ts` — Copy audit logging pattern into property controllers
5. `apps/api/prisma/schema.prisma` — Add `property.*` models here; follow the multi-schema pattern already established
6. `apps/api/prisma/migrations/202602210001_sprint02_identity_auth/migration.sql` — Reference migration structure
7. `docker/init-scripts/01-create-schemas.sql` — Verify `property` schema is already created (it should be from Sprint 01)

---

## 13. Sprint 01 Foundation Still Applicable

From `completed-sprint-01.md` — the following Sprint 01 infrastructure is actively used by Sprint 03:

| Service | Use in Sprint 03 |
|---------|-----------------|
| PostgreSQL (`pribec-postgres:5432`) | `property.*` schema storage |
| Redis (`pribec-redis:6379`) | Session continuity (from Sprint 02), potential search cache |
| MinIO (`pribec-minio:9000`) | Photo/video storage (S3-compatible) — wire D2 here |
| Elasticsearch (`pribec-elasticsearch:9200`) | Property search indexing (if using ES for full-text search) |
| Prometheus + Grafana | Metrics for property search endpoints |
| RabbitMQ | Future: `property.listed` events for async notifications |

The `property` schema was already created in Sprint 01 via `docker/init-scripts/01-create-schemas.sql` — no schema creation needed in the Sprint 03 migration, only table creation.
