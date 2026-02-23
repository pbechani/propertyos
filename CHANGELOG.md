# Changelog

All notable changes to the PRIBEC platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Sprint 02.1 — Identity Hardening Completion** (2026-02-22)
  - Added provider-based notification adapters in API:
    - `apps/api/src/identity/notifications/email.sendgrid.provider.ts`
    - `apps/api/src/identity/notifications/sms.twilio.provider.ts`
    - `apps/api/src/identity/notifications/types.ts`
  - `NotificationService` now supports env-gated provider delivery with fallback and strict mode (`NOTIFICATIONS_STRICT_MODE`)
  - Added signed KYC document download URL flow with access control:
    - New service: `apps/api/src/identity/document-access.service.ts`
    - New endpoint: `GET /api/v1/kyc/:id/documents/:documentType/download-url`
    - Authorization: owner or admin only
    - Audit event: `kyc.document_download_url_issued`
  - Added tests for hardening work:
    - `apps/api/src/identity/notification.service.spec.ts`
    - `apps/api/src/identity/document-access.service.spec.ts`
    - `apps/api/src/identity/document-storage.service.spec.ts`
  - Added web client support for secure KYC document retrieval:
    - `adminKycApi.getDocumentDownloadUrl()` in `apps/web/src/lib/api-client.ts`
    - `AdminVerificationPanel` now opens backend-issued secure URLs for all available KYC documents

- **Phase UI-2 — Sprint 02 Screen Wiring to Backend** (2026-02-22)
  - Wired all 8 Sprint 02 identity/auth screens to the live NestJS API at `localhost:3001/api/v1`
  - Extended `apps/web/src/lib/api-client.ts` with:
    - `authExtApi` — `logout()`, `refresh()` (POST /auth/logout, POST /auth/refresh)
    - `KycRecord` type — full KYC record shape
    - `adminKycApi` — `listPending()`, `getById()`, `startReview()`, `approve()`, `reject()`
    - `AuditLogEntry` type — full audit log entry shape
    - `auditApi` — `getMyLogs()`, `getAdminLogs()`
    - `adminUsersApi` — `getUser()` (admin GET /users/:id), `updateUserStatus()`
    - Added `roles` and `role` fields to `AuthUser` type
  - **RoleSelection.tsx** — saves selected role to `sessionStorage` (`pribec.pending_role`); navigates to `/register` (was `/profile-setup`)
  - **Register.tsx** — reads role from `sessionStorage` on submit; passes it to `authApi.register()`; clears key after use
  - **MFAVerify.tsx** — removed hardcoded `if (code === "123456")` mock; replaced with passthrough + explanatory comment (TOTP backend not in Sprint 02 scope)
  - **MFASetup.tsx** — removed hardcoded secret key `JBSWY3DPEHPK3PXP`; replaced with `TOTP-SETUP-PENDING` placeholder and comment
  - **SessionExpired.tsx** — calls `clearAuthSession()` on mount to purge stale JWT/refresh tokens from localStorage
  - **ProfileDashboard.tsx** — full live data wiring:
    - Fetches real user + KYC status on mount (`usersApi.me()` + `kycApi.getStatus()`)
    - Derives `completedSteps` (4 real steps) from `user.emailVerifiedAt` and KYC status
    - Derives `verificationLevel` (1–3) and `trustScore` (25–85) from KYC state
    - Loads last 5 audit log entries via `auditApi.getMyLogs()` for activity timeline
    - Avatar initials derived from real first/last name (replaced hardcoded "AT")
    - Trust score label dynamically shows "Excellent" / "Good" / "Fair" / "Building"
    - Edit profile panel: controlled inputs wired to `usersApi.updateMe()` with success/error feedback
  - **AdminVerificationPanel.tsx** — complete rewrite from hardcoded mock data to live API:
    - Loads KYC queue on mount via `adminKycApi.listPending()`
    - Lazy-loads user details per record via `adminUsersApi.getUser()` when a row is selected (resolves the userId-only constraint on `/admin/kyc/pending`)
    - Stats grid derived from live `kycRecords` state
    - Approve / Start Review / Reject buttons wired to `adminKycApi.approve()` / `startReview()` / `reject()` with loading spinners and `actionInProgress` guard
    - Reviewer notes textarea feeds into approve/reject API calls
    - Error display for failed actions (`actionError` state)
    - Audit Logs tab populated from `auditApi.getAdminLogs()` via `auditToActivity()` mapper
    - Queue re-fetched after each action; deselects current record on success
- **Phase UI-0 — Sample UI Integration into apps/web** (2026-02-22)
  - Migrated 46 screen views from `sample_ui/Propmarketfigma-main/src/app/pages/` → `apps/web/src/views/`
  - Copied 52 shadcn/Radix UI components to `apps/web/src/components/ui/`
  - Copied 8 custom application components to `apps/web/src/components/` (Layout, ProtectedRoute, ThemeToggle, ErrorBoundary, CreateListing, NotificationCenter, figma/, property/)
  - Scaffolded 37 Next.js App Router `page.tsx` files — each re-exports from `src/views/`
  - Created `apps/web/src/lib/router-compat.tsx` — React Router v7 → Next.js compatibility shim (`Link`, `useNavigate`, `useLocation`, `useParams`, `Navigate`)
  - Created `apps/web/src/lib/utils.ts` — shared `cn()` utility (`clsx` + `tailwind-merge`)
  - Installed missing dependencies: `react-resizable-panels@^2.1.9`, `react-day-picker@8.10.1`, `recharts@2.15.2`
  - Build verified: `npm run build` completes with zero errors across all 37 routes
- **Sprint 02 — Identity, Auth, RBAC & KYC** complete implementation
  - JWT authentication with access (15m) + refresh (7d) token rotation
  - OAuth endpoints (Google, Apple, Facebook)
  - Password reset & email verification (Redis-backed one-time tokens)
  - 9-role RBAC with permission matrix and seeded roles
  - KYC document upload & review workflow (submit → under_review → approved/rejected)
  - Admin verification dashboard APIs
  - Notification and document storage service foundations
  - Append-only identity audit logs (DB trigger + application layer)
  - `SELF_REGISTRATION_ROLES` constant — admin cannot be self-assigned at registration
  - `ParseIntPipe` on KYC list endpoints for pagination query params
- Comprehensive unit tests for Sprint 02 code (79 tests, 151 total)
- Comprehensive unit tests for Sprint 01 infrastructure modules
  - PrismaService, RedisService, VaultService, MetricsService, MetricsController, env.validation
- E2E infrastructure tests (`infrastructure.e2e-spec.ts`)

### Fixed
- **AdminVerificationPanel accessibility/style diagnostics**
  - Added accessible names to severity/category selects
  - Replaced `flex-shrink-0` with `shrink-0` where flagged
- **[High] CSS typography inconsistency across all screens** — `apps/web/src/app/globals.css` was missing the base typography layer present in `sample_ui/src/styles/theme.css`. Added `h1`–`h4`, `label`, `button`, `input` font-size/weight/line-height defaults plus `@keyframes wave` / `.animate-wave` inside `@layer base`. All Tailwind utility classes continue to override these defaults per-component.
- **[Critical] Admin self-registration** — `RegisterDto` now validates role against `SELF_REGISTRATION_ROLES` (excludes `admin`)
- **[High] Suspended/deleted users could obtain tokens** — `login()` checks `user.status === 'active'` after password validation
- **[High] Same status gap in `oauthLogin()` and `forgotPassword()`** — Both now gate on active account status
- **[High] KYC state-machine had no transition guards** — `startReview`, `approve`, `reject` throw `ConflictException` on invalid status transitions
- **[High] Audit log recorded incorrect `previous_status`** — approve/reject fetch real prior status; `KycUpdateResult` type carries `previousStatus` to controller
- **[Medium] `listPending()` silently capped results at 200** — Added `limit`/`offset` params (capped at 500) and query params on the endpoint
- **[Medium] Duplicate `users:self` permission entry** — Removed duplicate from `IDENTITY_PERMISSIONS`
- **[Medium] Double `getUserRoleNames()` DB call per auth action** — `issueTokens()` accepts optional `prefetchedRoles`; callers pre-fetch once
- **[Medium] Admin `GET /users/:id` produced no audit log** — Added `user.accessed` audit entry
- **[Low] `resolveExpiryDate()` silent 7-day fallback** — Now logs `Logger.warn()` on unrecognised suffix
- **[Low] Hardcoded JWT secret fallback in source** — `JwtStrategy` throws on missing `JWT_SECRET` in production/staging
- **[Low] Empty `PATCH /users/me` triggered unnecessary DB write** — Early return when no non-undefined fields present
- Sprint 01 test gaps (Prisma + health + env validation baseline)

---

## [0.1.0] - 2026-02-20

### Added
- Complete infrastructure foundation (Sprint 01)
- Turborepo monorepo with apps (api, web, mobile placeholder)
- NestJS API application with health check endpoints
- Next.js web application
- PostgreSQL database with 12 schema separation (identity, property, sales, financial, construction, marketplace, logistics, inspection, analytics, ai_engine, audit, common)
- Redis cache instance with AOF persistence
- RabbitMQ message broker with management UI
- MinIO S3-compatible object storage
- Elasticsearch + Kibana for centralized logging
- Prometheus + Grafana for metrics collection
- HashiCorp Vault for secrets management
- Sentry error tracking integration
- Docker Compose development environment (10 services)
- GitHub Actions CI/CD pipeline (lint, test, build, security-scan, deploy)
- Terraform infrastructure as code (VPC, RDS, ElastiCache, S3, ECS, ACM modules)
- SSL/TLS certificate configuration (local + production)
- Shared packages (shared-types, ui, config)

### Security
- Helmet.js security headers configured
- Rate limiting: 100 req/min default, 10 req/min for auth endpoints
- CORS whitelist configuration
- Input validation pipes
- Secret scanning in CI (TruffleHog)
- Vulnerability scanning (Trivy)
- Zero secrets committed to repository

### Documentation
- Comprehensive architecture specification (design/design.md)
- Sprint-based implementation plan (18 phases)
- Development workflow guide (CLAUDE.md)
- Project README with tech stack overview
- Sprint 01 detailed changelog
- Manual setup instructions

### Infrastructure
- Docker Compose with health checks for all services
- PostgreSQL init scripts for schema creation
- Prometheus scrape configuration
- Nginx HTTPS proxy configuration
- Vault policies and initialization scripts

---

## Development Philosophy

PRIBEC follows these core principles:
1. **Security by design** — Financial-grade, no shortcuts
2. **Auditability as core primitive** — Every action has immutable log entry
3. **Offline-first mobile** — Construction workers operate with poor connectivity
4. **Event sourcing for financials** — Double-entry ledger, zero data loss tolerance
5. **Multi-tenant & multi-country ready** — Multi-currency, multi-language from day one

---

[unreleased]: https://github.com/pribec/pribec/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/pribec/pribec/releases/tag/v0.1.0
