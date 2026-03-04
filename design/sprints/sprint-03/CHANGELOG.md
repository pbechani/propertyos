# Sprint 03 — Changelog

## Unreleased (Post v0.3.0 patches)

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
