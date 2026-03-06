# Sprint 03 — Changelog

## Unreleased (Post v0.3.0 patches)

### Fixed — 2026-03-06 (Identity suite test regressions + Sprint 03 bug fixes)

- **Identity suite — 10 pre-existing test failures resolved** (`auth.service.spec.ts`, `users.service.spec.ts`, `notification.service.spec.ts`)
  - `auth.service.spec.ts` (6 tests): Tests were written before several `$queryRaw` calls were added to the service. Added mocks for `getRolePermissions`, `pendingInvitations` query, `resolveSelfCompanyCtx`, and `active_company_id` membership re-validation in `refresh`. Also corrected `BadRequestException` → `ConflictException` for duplicate-email guard.
  - `users.service.spec.ts` (2 tests): `UsersService.create()` and `updateStatus()` delegate to `findById()` after mutation (2 `$queryRaw` calls total). Tests only mocked 1 — now correctly mocked as INSERT/UPDATE RETURNING id → findById SELECT.
  - `notification.service.spec.ts` (2 tests): `resolveEmailProvider()` requires `EMAIL_PROVIDER=sendgrid` config key explicitly. Tests only set `SENDGRID_API_KEY`/`SENDGRID_FROM_EMAIL` — added `EMAIL_PROVIDER: 'sendgrid'` to both affected `buildConfigService()` calls.
  - All 55 identity tests now passing with no regressions.

- **Sprint 03 audit — SQL table/column bugs fixed** (`property.service.ts`, `seller-dashboard.service.ts`)
  - 10 locations across 2 files referenced non-existent table/column names:
    - `property.property_viewings` → `property.viewings`
    - `property.property_inquiries` → `property.inquiries`
    - `property.property_audit_logs` → `property.audit_logs`
    - `al.changes` → `al.payload`, `al.user_id` → `al.actor_id` (audit log columns)
    - `v.feedback_notes, v.rating` → `v.buyer_feedback` (JSONB), `m.expiry_date` → `m.end_date` (mandate)
  - 3 `create()` test mocks in `property.service.spec.ts` were missing self-company lookup mock prepended before INSERT mock.

### Changed — 2026-03-06 (Dashboard UI improvements)

- **`MyDashboard.tsx` — Listings tab property column**
  - Added `title` (listing title) as primary bold text, replacing address as the headline.
  - Added `listingType` badge (`For Sale` / `To Rent` / `Development`) overlaid on the bottom edge of the property thumbnail — solid coloured strip (blue / purple / amber).
  - Address and days-on-market moved below the title as secondary metadata.

- **`AgentDashboardEnhanced.tsx` — Listings tab property column**
  - Same listing title + type badge on image treatment applied, matching MyDashboard.
  - Added **Duplicate** button to the Actions column — copies all listing fields and media to a new draft titled `"… (Duplicate)"`, with loading state ("Copying…"), disables during in-flight request, and shows a dismissable error banner on failure. Matches MyDashboard duplicate behaviour exactly.


- **Invitation acceptance — complete role & company enrolment**
  - `registerAndAccept` (new user): grants `buyer_seller` default role + Self company membership in addition to the invited company role — mirrors normal registration. Previously only the invited role was set and Self company enrolment was skipped.
  - `accept` (existing user): now calls `usersService.assignRole()` after `linkUserToCompany` so the invited role appears in `identity.user_roles` and is reflected in the next JWT. Previously only the `company_members` row was inserted.
  - Both paths now send a welcome email to the invitee via `notifyInviteeOfAcceptance()` (company name, role, login link).
  - `auth.service.ts`: `addUserToSelfCompany` → renamed to public `enrolInSelfCompany` for reuse.
  - New standalone `invitations.controller.ts` extracted from `companies.controller.ts`: `GET /invitations/:token` (public preview), `POST /invitations/:token/accept` (auth), `POST /invitations/:token/register-and-accept` (public).
  - `companies.controller.ts`: corrected — now exposes `GET /companies/:id/invitations` (list) instead of the since-moved preview/accept routes.
  - api-client: `invitationsApi.preview/accept/registerAndAccept` + `companiesApi.listInvitations/revokeInvitation`; new types `InvitationPreview`, `InviteAcceptResult`, `InviteRegisterResult`.
  - `AcceptInvitation.tsx`: enriched `accepted` screen with contextual heading ("Account Created!" vs "Invitation Accepted!"), company/role summary card, welcome-email confirmation, and dual CTAs (Dashboard / Home).
  - `CompanyUserManagement.tsx`: parallel-loads members + invitations; renders pending invitations table with expiry, inviter name, and per-row revoke button.

- **SMTP email provider + Mailpit local catcher**
  - New `email.smtp.provider.ts` (`SmtpEmailProvider` via `nodemailer`).
  - `notification.service.ts`: `EMAIL_PROVIDER=smtp|sendgrid|none` selector; Mailpit-compatible defaults for local dev.
  - `docker-compose.yml`: `mailpit` service on SMTP `:1025` / Web UI `:8025`.
  - `.env.example` / `apps/api/.env.example`: SMTP vars added; SendGrid vars moved to commented production block.

- **DB migration `202603040012_refresh_token_company_context`**
  - Adds `active_company_id UUID` FK to `identity.refresh_tokens`; fixes company context loss on JWT rotation.

### Added — 2026-03-04 (Company Management — Phase 2)
- **Company Verification Documents**
  - DB: migration `202603040011_company_documents` — `identity.company_documents` table (upload lifecycle: pending → approved/rejected, indexed on `company_id`).
  - Prisma: `CompanyDocument` model added to schema.
  - API: `GET /companies/:id/documents`, `POST /companies/:id/documents` (multipart file upload via `DocumentStorageService`).
  - Web: `CompanyProfile` view — "Verification Documents" section with type selector, name field, file picker (admin-only upload), status badges, and download links per document.
  - api-client: `CompanyDocument` type + `companiesApi.getDocuments()` / `uploadDocument()`.

- **Company Audit Logs — live data**
  - API: `GET /companies/:id/audit-logs?limit&offset` — paginated, joins `audit.shared_audit_logs` with `identity.users` for actor name/email.
  - Web: `CompanyActivityLogs` view replaced static mock with live API call; `mapEntry()` normalises raw rows; filter/search/paginate wired to real data.
  - api-client: `CompanyAuditLogEntry` type + `companiesApi.getAuditLogs()`.

- **Company Members — role permissions & invitation roles endpoints**
  - `GET /companies/:id/roles/:role/permissions` — canonical permission list for a role (read-only, no admin required).
  - `GET /companies/:id/allowed-roles` — roles available for invitation (excludes `admin`).
  - `company-members.service.ts`: `getRolePermissions(role)` queries `identity.role_permissions → permissions → roles`.

- **Auth — registration seeds permissions from DB**
  - `auth.service.ts`: new user's initial company member record now seeds `permissions` JSONB from `getRolePermissions('buyer_seller')` instead of an empty array.

### Changed — 2026-03-04
- **Company management UI fully wired to API**
  - `CompanyInviteUser` — role selector dynamically populated from `GET /allowed-roles`.
  - `CompanyPermissions` — permissions grid live from `GET /roles/:role/permissions`; save wired to `PATCH /members/:id`.
  - `CompanyRevokedPool` — real data fetch; restore/remove actions wired; typed `RevokedEntry` in api-client.
  - `CompanyUserManagement` — member list, role change, deactivate all use typed api-client methods with optimistic UI.
- **next.config.js** — added `/api/v1/**` rewrite to `http://localhost:3001` eliminating CORS for local dev.
- **auth-session.ts** — `getAccessToken()` helper + typed `getActiveCompanyContext()` return added.
- **AppSidebar** — navigation arrays (`selfNavigation`, `companyNavigation`) extended with full sprint-03 route set; active-route highlight covers nested paths.
- **MyDashboard** — quick-action links aligned to current route structure.

### Added
- `POST /api/v1/auth/resend-verification-email` endpoint for authenticated verification resend flow.
- Migration `202602250003_identity_business_profile` adding `identity.user_business_profiles` for persisted business details.
- Runtime verifier script `scripts/verify_role_setup_flow.py` for end-to-end business + KYC persistence checks.

### Changed
- Profile dashboard verification cards are now data-driven (documents verified, trust score, response rate).
- Role setup profile/business/KYC tabs now persist real data (including avatar upload and business details).
- Activity timeline rendering now handles missing/variant timestamp fields without invalid relative-time output.


## v0.3.0 — 2026-02-21

### Added

#### Database
- `property.properties` table with 4 property types, 5 statuses, verification workflow
- `property.property_locations` with PostGIS `GEOMETRY(Point, 4326)` + GIST index
- `property.property_media` with type, ordering, primary flag (max 20 per listing)
- `property.ownership_history` for pre-platform ownership records
- `property.verifications` with pending/approved/rejected state machine
- `property.inquiries` (viewing/offer/question types)
- `property.saved_properties` with composite PK
- `property.fraud_reports` with 5 report types + resolution workflow
- `property.audit_logs` append-only with immutable trigger
- PostGIS extension enabled via migration

#### Docker
- Updated `docker-compose.yml` postgres image from `postgres:15-alpine` to `postgis/postgis:15-alpine`

#### API
- `POST /api/v1/properties` — create listing
- `GET /api/v1/properties` — search with 12 filter params
- `GET /api/v1/properties/:id` — listing detail with location + media
- `PATCH /api/v1/properties/:id` — partial update
- `DELETE /api/v1/properties/:id` — hard delete
- `POST /api/v1/properties/:id/media` — upload photo/video
- `DELETE /api/v1/properties/:id/media/:mediaId` — remove media
- `GET /api/v1/agent/dashboard` — agent stats
- `POST /api/v1/properties/:id/verification-request` — submit for admin review
- `GET /api/v1/admin/properties/pending-verification` — admin verification queue
- `POST /api/v1/admin/properties/:id/verify` — approve verification
- `POST /api/v1/admin/properties/:id/reject` — reject verification
- `POST /api/v1/properties/:id/save` — buyer shortlist
- `DELETE /api/v1/properties/:id/save` — remove from shortlist
- `GET /api/v1/users/me/saved-properties` — buyer's saved list
- `POST /api/v1/properties/:id/inquiries` — inquiry submission
- `GET /api/v1/properties/:id/inquiries` — list inquiries (agent)
- `PATCH /api/v1/inquiries/:id/respond` — agent response
- `POST /api/v1/properties/:id/fraud-reports` — fraud report submission
- `GET /api/v1/admin/fraud-reports` — admin fraud dashboard
- `PATCH /api/v1/admin/fraud-reports/:id/resolve` — resolve/dismiss report

#### Services
- `PropertyService` — CRUD, dynamic search, media, agent dashboard
- `VerificationService` — state machine (unverified → pending → verified/flagged)
- `InquiryService` — buyer create, agent list + respond
- `FraudService` — create, admin resolve, list all
- `SavedPropertiesService` — idempotent save/unsave/list
- `MediaStorageService` — 50MB limit, type validation, stub signed URLs
- `PropertyAuditService` — immutable `property.audit_logs` writes

#### Tests
- `property.service.spec.ts` — 16 tests
- `verification.service.spec.ts` — 8 tests
- `inquiry.service.spec.ts` — 6 tests
- `fraud.service.spec.ts` — 6 tests

#### Prisma Schema
- 9 new models added under `@@schema("property")`

### Modified
- `apps/api/src/app.module.ts` — `PropertyModule` added to imports
- `apps/api/prisma/schema.prisma` — property models added

### Total Test Count
- Sprint 02: 152 tests
- Sprint 03: +40 tests
- **All tests: 192/192 ✅**
