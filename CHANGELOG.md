# Changelog

All notable changes to the PRIBEC platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Service provider routing + marketplace rename alignment** (2026-02-25)
  - Standardized marketplace naming from "Contractor Marketplace" to "Service Provider Marketplace" across app routes and documentation.
  - Replaced legacy route references with `/service-providers` in navigation/docs where applicable.
  - Added new Next.js route entrypoint:
    - `apps/web/src/app/service-providers/page.tsx`

- **Authenticated shell + account flow consistency updates** (2026-02-25)
  - Added reusable authenticated shell wrapper:
    - `apps/web/src/components/AuthenticatedShell.tsx`
    - Ensures authenticated pages render with app layout while auth-exempt routes stay minimal.
  - Added route support for account recovery/setup follow-up screens:
    - `/change-password`
    - `/role-setup`
  - Added keyboard-submit behavior and clearer auth error states on login/register/password recovery screens.

- **Web UX consistency + quality remediation sweep** (2026-02-24)
  - Standardized authenticated navigation shell behavior across app routes:
    - persistent reusable left sidebar for logged-in app experiences
    - top navigation hidden for authenticated app pages where sidebar is primary
    - sidebar branding updated to show app logo/name
  - Sidebar user identity/actions are now session-backed:
    - removed hardcoded profile name
    - display logged-in user name/avatar (with initials fallback)
    - added profile + logout dropdown actions on avatar/name trigger
  - Enforced consistent theme behavior:
    - locked web app to light theme for consistent cross-route appearance
    - hid theme toggle controls when theme lock is active
    - added scoped normalization for legacy hardcoded utility colors under authenticated shell
  - Completed broad diagnostics remediation in `apps/web/src`:
    - accessibility fixes for icon-only buttons/links and select/form control naming
    - replacement of deprecated utility aliases (e.g. `flex-shrink-0` → `shrink-0`, `bg-gradient-to-*` → `bg-linear-to-*`)
    - removal of inline style violations by replacing with `Progress` patterns and reusable CSS helpers
    - result: `get_errors` for `apps/web/src` now returns no errors

- **Browser tab branding + icon update** (2026-02-24)
  - `apps/web/src/app/layout.tsx`
    - updated root metadata title from PRIBEC label to `PropertyOS`
    - added explicit `icons` metadata (`icon`, `shortcut`, `apple`) pointing to app icon
  - `apps/web/src/app/icon.svg`
    - added Next.js app icon asset used for browser tab/favicon rendering

### Added
- **Web account/client API extensions** (2026-02-25)
  - `apps/web/src/lib/api-client.ts`
    - Added `usersApi.uploadAvatar(authToken, file)` for profile avatar upload.
    - Added `authExtApi.changePassword(authToken, payload)` for authenticated password change.
    - Extended auth/KYC response typings to include newly surfaced optional fields.

- **Web route smoke test command** (2026-02-24)
  - `scripts/smoke-web-routes.sh`
    - checks key web routes against `BASE_URL` (default `http://localhost:3000`)
    - supports custom route arguments
    - fails fast on any `4xx/5xx` status
  - `package.json`
    - added script: `smoke:web` → `bash scripts/smoke-web-routes.sh`

### Added
- **Sprint-03 agent dashboard metrics wiring** (2026-02-23)
  - `apps/api/src/property/property.service.ts`
    - Extended `GET /api/v1/agent/dashboard` response with:
      - `listingViewsLast7d`
      - `listingViewsPrevious7d`
      - `listingViewsTrendPct`
      - `inquiryResponseRatePct`
    - Metrics are computed from real property inquiry/audit data.
  - `apps/api/src/property/property.controller.ts`
    - Property detail reads now include request context for view-event logging (`property.viewed`) used by listing view trends.
  - `apps/web/src/lib/api-client.ts`
    - Added `AgentDashboardResponse` and `propertiesApi.getAgentDashboard(authToken)`.
  - `apps/web/src/views/AgentDashboardEnhanced.tsx`
    - Replaced static conversion placeholders with live listing-views trend and inquiry response-rate metrics.

- **Listings layout alignment with property detail shell** (2026-02-23)
  - `apps/web/src/views/Listings.tsx`
    - Aligned Listings page frame to the same shell pattern used by property detail (`bg-gray-50 min-h-screen` + centered `max-w-7xl` content wrapper).
    - Updated grid view to render a single card per row (`grid-cols-1`) for consistent vertical scanning.

- **Listings AI voice search implementation + microphone diagnostics** (2026-02-23)
  - `apps/web/src/views/Listings.tsx`
    - Replaced simulated voice-search timeout behavior with real browser speech recognition (`SpeechRecognition` + `webkitSpeechRecognition` fallback).
    - Wired recognized transcript into existing AI parsing flow so `Apply AI Search` updates active listing filters (location, property type, beds/baths, features, price bounds, verified-only).
    - Added explicit voice-status guidance for unsupported browsers, insecure origins (non-HTTPS/non-localhost), blocked microphone permissions, no-speech events, and missing microphone devices.
    - Added a reusable `Start Listening` action within the modal and ensured recognition is stopped on cancel/close/apply/unmount.

- **Listings/client request resilience + sold listing action guard** (2026-02-23)
  - `apps/web/src/views/PropertyDetailEnhanced.tsx`
    - Blocked inquiries and viewing requests when `listingStatus` is `sold`.
    - Disabled schedule/inquiry/contact CTA controls for sold properties and added user-facing unavailable messaging.
  - `apps/web/src/views/Listings.tsx`
    - Hardened listing fetch/mapping flow:
      - fallback retry without sort only on validation-like errors (`400`/`422`), not on `429`
      - per-record mapping guard so malformed listings do not fail the entire page
      - safer currency formatting fallback for invalid currency codes
  - `apps/web/src/lib/api-client.ts`
    - Added in-flight GET request deduplication for identical concurrent requests.
    - Added short-lived GET response cache (default 15s, `/properties*` 20s).
    - Added 429 cooldown handling (3s) with cached-response fallback where available.
  - Result: reduced duplicate API traffic during fast back/forward navigation, fewer `429 Too Many Requests` cascades, and more stable listing/property UX.

- **Listings first-load filter defaults update** (2026-02-23)
  - Updated `apps/web/src/views/Listings.tsx` to start with no selected filters:
    - `verifiedOnly` default is now `false`
    - property type defaults are all unselected
    - location defaults are all unselected
    - bedroom/bathroom minimum defaults are now `0`
  - Versioned the listings session-storage key so stale previously-selected filters do not auto-apply on first load after deploy.
  - Result: listings page initially displays backend data without requiring users to reset filters.

- **Listings location filter UX update** (2026-02-23)
  - Updated `apps/web/src/views/Listings.tsx` to remove predefined location toggles.
  - Added assisted location typing using a text input with suggestions (`datalist`) and keyboard support (`Enter`/`,` to add).
  - Added multi-location selection via removable chips in the filters panel.
  - Updated filtering logic to match listings against one or more typed locations.
  - Versioned listings session-storage key to `pribec.listings.view_state.v3` to avoid incompatibility with previously persisted location filter shape.

- **Web UX routing + shell consistency update** (2026-02-23)
  - Added reusable authenticated app sidebar component:
    - `apps/web/src/components/AppSidebar.tsx`
  - Updated app shell behavior in `apps/web/src/components/Layout.tsx`:
    - Left sidebar now renders only when the user is logged in
    - Property detail route (`/app/property/:id`) now uses minimal header (search/create-listing toolbar removed)
    - Listings-style sidebar behavior is reused across app screens when authenticated
  - Standardized property detail navigation across views to `/app/property/:id`:
    - `apps/web/src/views/Listings.tsx`
    - `apps/web/src/views/PropertyComparison.tsx`
    - `apps/web/src/views/AgentDashboardEnhanced.tsx`
    - `apps/web/src/views/AgentProfile.tsx`
  - Added return-path navigation from property detail → agent profile:
    - `PropertyDetailEnhanced` now links to `/agent-profile/:id?back=/app/property/:id`
    - `AgentProfile` back button now returns to `back` path when present, otherwise falls back to `/app/listings`
  - Improved listings filter sidebar responsiveness:
    - `apps/web/src/views/Listings.tsx` now prevents horizontal overflow when filters are open
    - Filter controls no longer require left/right scrolling on smaller viewports
    - Sidebar overlay uses full-screen fixed positioning on mobile for consistent control visibility
  - Fixed listings filter application logic:
    - `Apply Filters` now applies selected filter criteria to listing results
    - Results count and applied filter badges now reflect the active applied filters
    - `Reset All` now resets both pending and applied filter state
    - Bedroom/Bathroom `+/-` steppers now reliably update values on click/tap
  - Improved listings view accessibility labels:
    - Added `aria-label`/`title` to icon-only controls in `apps/web/src/views/Listings.tsx` (filter close, voice modal close, view toggles, save/bookmark)
  - Added authentication guard for listing favorites action:
    - Clicking the listing save/favorite control while logged out now redirects to `/login`
    - Logged-in flow remains ready for favorites persistence integration
    - Property detail favorite action now follows the same rule and redirects to `/login?next=<current-path>` when logged out
  - Added return-to-origin authentication flow:
    - Login/Register now honor `?next=<path>` and return users to their previous screen after successful auth
    - Login/Register links preserve the `next` target between screens
    - Listings saves and restores local view/filter state via `sessionStorage`, so users return with the same listings screen state
    - Login screen now includes `Cancel`, which returns users to `next` when present, otherwise browser back/home fallback
  - Updated relevant documentation for routing and flow behavior:
    - `docs/sample-ui-analysis.md`
    - `docs/archtecture/routing-map.md`
    - `docs/archtecture/02_Buyer_IA.md`
    - `design/sprints/ui_dev/init_dev.md`
    - `apps/web/src/views/BuyerFlowDocumentation.tsx`
  - Manual verification checklist:
    - Logged-out user does not see left sidebar on `/app/*` screens
    - Logged-in user sees reusable left sidebar on `/app/*` screens
    - `/app/property/:id` shows minimal header (no search/create-listing toolbar)
    - Clicking a listing card or map pin opens `/app/property/:id`
    - Opening agent profile from property detail appends `?back=/app/property/:id`
    - Back action on agent profile returns to originating property detail page
    - Direct agent-profile visits without `back` still return to `/app/listings`

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
- **[Build] shared `useSearchParams()` prerender failures on web routes** (2026-02-23)
  - Added page-level `Suspense` wrappers for client views using `useSearchParams`:
    - `apps/web/src/app/app/listings/page.tsx`
    - `apps/web/src/app/login/page.tsx`
    - `apps/web/src/app/email-verification/page.tsx`
    - `apps/web/src/app/oauth-connect/page.tsx`
    - `apps/web/src/app/register/page.tsx`
    - `apps/web/src/app/service-providers/page.tsx`
    - `apps/web/src/app/properties/search/page.tsx`
  - Result: `npm run build --workspace=apps/web` completes successfully.

- **[Critical] React hydration mismatch on initial page load** (2026-02-23)
  - `apps/web/src/contexts/ThemeContext.tsx` — `useState(getInitialTheme)` was used as a lazy initializer, causing `localStorage`/`window.matchMedia` to be read synchronously during the client's first render while the server always returns `"light"`. Fixed by initializing state to `"light"` on both server and client and syncing to the real user preference in a dedicated `useEffect` after mount. The existing inline `<Script>` in `layout.tsx` continues to stamp the correct class on `<html>` before React hydrates, so there is no FOUC.
  - `apps/web/src/views/Listings.tsx` — `Math.random()` was called directly inside JSX for the voice-search waveform visualization, producing a different value on every render (server ≠ client). Replaced with a stable array of fixed heights computed via `useMemo` with no dependencies.
  - `apps/web/src/views/SessionExpired.tsx` — `new Date().toLocaleTimeString()` was rendered inline; the timestamp captured at SSR time differed from the one captured at client hydration. Moved to a `useState` / `useEffect` pattern — renders `"—"` until mounted.
  - `apps/web/src/views/LogisticsDeliveryMarketplace.tsx` — same `new Date().toLocaleString()` inline render pattern. Applied the same `useState` / `useEffect` fix with a `"—"` placeholder until mount.

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
