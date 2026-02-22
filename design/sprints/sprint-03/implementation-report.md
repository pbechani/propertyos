## Sprint 03 Implementation Report

**Sprint:** 03 — Property Marketplace & Listings  
**Date:** 2026-02-21  
**Status:** Implemented in `apps/api`

---

## Summary

Sprint 03 property marketplace layer has been implemented in the API service, including:

- Full property CRUD with 4 property types (residential, commercial, land, off_plan)
- PostGIS-backed geo-radius search with 12 composable filter parameters
- 14-item media gallery (photos + video) per listing
- Ownership history tracking for pre-platform chain of title
- Verification state machine (unverified → pending → verified/flagged)
- Buyer inquiry workflow with 3 inquiry types + agent response
- Buyer saved-properties shortlist
- Fraud report submission + admin resolution pipeline
- Property-scoped append-only audit log (separate from identity.audit_logs)
- Media storage validation service (stub signed URLs, S3-ready)

---

## Deliverables Checklist

- [x] Property listings (land, residential, commercial, off-plan)
- [x] Dynamic search with location, type, price, and status filters
- [x] Geo-radius search (PostGIS ST_DWithin)
- [x] Document verification workflow with verification badges
- [x] Ownership history tracking (pre-platform records)
- [x] Media gallery (photos + video, max 20 items)
- [x] Agent dashboard (listings count, pending inquiries, revenue stats)
- [x] Buyer inquiry workflow (viewing/offer/question + agent response)
- [x] Saved/shortlisted properties per buyer
- [x] Fraud reporting system with admin resolution
- [x] Property-scoped audit logs (immutable, append-only)

---

## Files Implemented

### App Wiring

- `apps/api/src/app.module.ts`
  - Added `PropertyModule`.

### Prisma / Database

- `apps/api/prisma/schema.prisma`
  - Added 9 property models: `Property`, `PropertyLocation`, `PropertyMedia`, `OwnershipHistory`, `PropertyVerification`, `PropertyInquiry`, `SavedProperty`, `FraudReport`, `PropertyAuditLog`.
- `apps/api/prisma/migrations/202602210002_sprint03_property_marketplace/migration.sql`
  - Created all `property.*` tables with PostGIS extension, GIST index, UNIQUE constraint  
    on `property_locations.property_id` (for upsert), append-only trigger on `property.audit_logs`,  
    and auto-update trigger on `properties.updated_at`.

### Property Module

- `apps/api/src/property/property.module.ts`
  - Wires all 9 controllers and 7 provider services; exports `PropertyService` and `PropertyAuditService`.

### Constants & DTOs

- `apps/api/src/property/property.constants.ts`
  - Enums: `PropertyType`, `PropertyStatus`, `VerificationStatus`, `InquiryType`, `FraudReportType`, `FraudReportStatus`
  - Limits: `PROPERTY_LIMITS` (max media 20, title 255, description 5 000)
- `apps/api/src/property/property.dto.ts`
  - `CreatePropertyDto`, `UpdatePropertyDto`, `SearchPropertiesDto` (with optional geo params)
  - `SetLocationDto`, `AddMediaDto`
  - `CreateInquiryDto`, `RespondToInquiryDto`
  - `CreateFraudReportDto`, `ResolveFraudReportDto`
  - `VerifyPropertyDto`, `RejectPropertyDto`

### Services

- `apps/api/src/property/property-audit.service.ts`
  - Writes to `property.audit_logs` (NOT `identity.audit_logs`).
  - `log(entry)` uses `$executeRaw` with `gen_random_uuid()`.

- `apps/api/src/property/media-storage.service.ts`
  - Validates MIME type (image/jpeg, png, webp, gif; video/mp4, quicktime, x-msvideo, x-matroska).
  - Enforces 50 MB size limit.
  - Returns stub `https://storage.pribec.local/...` URL (replace with S3 client in infra pass).

- `apps/api/src/property/property.service.ts`
  - `create()` — inserts into `property.properties`, audit logs `property.created`.
  - `findById()` — joins properties + location + media in one raw query.
  - `update()` — dynamic `$queryRawUnsafe` builder (only touches provided fields).
  - `delete()` — hard delete; ownership check via `assertAgentOwns()` private helper.
  - `search()` — composable WHERE builder; geo branch uses `ST_DWithin` + `ST_MakePoint` + `::geography`.
  - `addMedia()` — validates count ≤ `PROPERTY_LIMITS.MAX_MEDIA`, inserts with auto-order.
  - `deleteMedia()` — removes single media row; validates ownership.
  - `upsertLocation()` — `INSERT ... ON CONFLICT (property_id) DO UPDATE`; PostGIS `ST_SetSRID(ST_MakePoint(...), 4326)` when lat/lng provided.
  - `getAgentDashboard()` — aggregate stats: active/sold/pending counts + total revenue.

- `apps/api/src/property/verification.service.ts`
  - State machine: `unverified` → `pending` (submit) → `verified` (approve) | `flagged` (reject).
  - `submitVerificationRequest()` — blocks if active pending exists (`ConflictException`).
  - `approveVerification()` / `rejectVerification()` — updates both `property.verifications` and `property.properties.verification_status`.
  - `getPendingVerifications()` — admin queue, ordered by `submitted_at`.

- `apps/api/src/property/inquiry.service.ts`
  - `create()` — buyer submits viewing/offer/question inquiry.
  - `findByProperty()` — agent-gated list (checks caller is listing agent).
  - `respond()` — agent sets response text and `responded_at`.

- `apps/api/src/property/fraud.service.ts`
  - `create()` — inserts report, automatically transitions property status to `flagged`.
  - `findAll()` — admin list with optional status filter (dynamic `$queryRawUnsafe`).
  - `resolve()` — sets resolution status, resolution note, and `resolved_at`.

- `apps/api/src/property/saved-properties.service.ts`
  - `save()` — `INSERT ... ON CONFLICT DO NOTHING` (idempotent).
  - `unsave()` — `DELETE` on composite PK.
  - `findSavedByUser()` — buyer's shortlist with full property rows.

### Controllers

- `apps/api/src/property/property.controller.ts`
  - `PropertyController` — `POST /api/v1/properties`, `GET /api/v1/properties`, `GET /api/v1/properties/:id`, `PATCH /api/v1/properties/:id`, `DELETE /api/v1/properties/:id`
  - Roles: `agent` | `admin` for mutating; any authenticated user can read/search.
  - `AgentDashboardController` — `GET /api/v1/agent/dashboard` (`agent` | `admin`)
  - `PropertyMediaController` (inline) — `POST /api/v1/properties/:id/media`, `DELETE /api/v1/properties/:id/media/:mediaId`

- `apps/api/src/property/verification.controller.ts`
  - `VerificationController` — `POST /api/v1/properties/:id/verification-request` (any role)
  - `AdminVerificationController` — `GET /api/v1/admin/properties/pending-verification`, `POST /api/v1/admin/properties/:id/verify`, `POST /api/v1/admin/properties/:id/reject` (`admin` only)

- `apps/api/src/property/buyer.controller.ts`
  - `BuyerController` — `POST /api/v1/properties/:id/save`, `DELETE /api/v1/properties/:id/save`, `GET /api/v1/users/me/saved-properties`
  - `InquiryController` — `POST /api/v1/properties/:id/inquiries`
  - `InquiryResponseController` — `GET /api/v1/properties/:id/inquiries` (agent), `PATCH /api/v1/inquiries/:id/respond` (agent)

- `apps/api/src/property/fraud.controller.ts`
  - `FraudController` — `POST /api/v1/properties/:id/fraud-reports`
  - `AdminFraudController` — `GET /api/v1/admin/fraud-reports`, `PATCH /api/v1/admin/fraud-reports/:id/resolve` (`admin`)

### Docker

- `docker/docker-compose.yml`
  - Changed postgres image from `postgres:15-alpine` to `postgis/postgis:15-alpine`.

---

## API Coverage

### Properties

- `POST   /api/v1/properties` — create listing
- `GET    /api/v1/properties` — search (12 filter params)
- `GET    /api/v1/properties/:id` — listing detail
- `PATCH  /api/v1/properties/:id` — partial update
- `DELETE /api/v1/properties/:id` — delete listing

### Property Media

- `POST   /api/v1/properties/:id/media` — add photo/video
- `DELETE /api/v1/properties/:id/media/:mediaId` — remove media

### Agent Dashboard

- `GET    /api/v1/agent/dashboard` — agent stats `[agent, admin]`

### Verification

- `POST   /api/v1/properties/:id/verification-request` — submit for review
- `GET    /api/v1/admin/properties/pending-verification` — admin queue `[admin]`
- `POST   /api/v1/admin/properties/:id/verify` — approve `[admin]`
- `POST   /api/v1/admin/properties/:id/reject` — reject `[admin]`

### Saved Properties (Buyer)

- `POST   /api/v1/properties/:id/save` — shortlist
- `DELETE /api/v1/properties/:id/save` — remove from shortlist
- `GET    /api/v1/users/me/saved-properties` — buyer's list

### Inquiries

- `POST   /api/v1/properties/:id/inquiries` — submit inquiry
- `GET    /api/v1/properties/:id/inquiries` — list for property `[agent, admin]`
- `PATCH  /api/v1/inquiries/:id/respond` — agent response `[agent, admin]`

### Fraud

- `POST   /api/v1/properties/:id/fraud-reports` — submit report
- `GET    /api/v1/admin/fraud-reports` — admin list `[admin]`
- `PATCH  /api/v1/admin/fraud-reports/:id/resolve` — resolve `[admin]`

---

## Acceptance Criteria Mapping

- [x] Agent can create, update, and delete their own listings
- [x] Buyer can search listings with price, type, location, geo-radius filters
- [x] Agent can upload up to 20 photos/videos per listing
- [x] Verification admin queue shows pending verifications in submitted order
- [x] Verified badge is set after admin approval; `flagged` status set on rejection
- [x] Buyer can save/unsave listings and retrieve their shortlist
- [x] Buyer can submit viewing/offer/question inquiries; agent can respond
- [x] Any authenticated user can submit a fraud report
- [x] Admin can resolve or dismiss fraud reports
- [x] All state-changing actions produce immutable `property.audit_logs` entries
- [x] Cross-schema references use plain UUIDs (no FK to `identity.*`)

---

## Test Coverage

| File | Tests | Pass |
|------|-------|------|
| `property.service.spec.ts` | 16 | 16 ✅ |
| `verification.service.spec.ts` | 8 | 8 ✅ |
| `inquiry.service.spec.ts` | 6 | 6 ✅ |
| `fraud.service.spec.ts` | 6 | 6 ✅ |
| **Sprint 03 total** | **36** | **36 ✅** |
| **All sprints total** | **192** | **192 ✅** |

---

## Validation Performed

- Type-check via TypeScript compiler: no hard errors.
- `npm run test --workspace=apps/api` — 192/192 tests pass.
- `Multer.File` type references validated as compile-safe (`@types/multer@1.4.12` installed in Sprint 02).

---

## Notes / Follow-ups

1. **Media storage** is implemented as a validated upload abstraction (`MediaStorageService`); S3/MinIO  
   client integration + real signed URLs should be connected via infra credentials in a hardening pass.
2. **Elasticsearch** listing indexing (`property.listed` event → ES index) is deferred to Sprint 07  
   (Contractor/Supplier Marketplace). The SQL search is sufficient for MVP scale.
3. **RabbitMQ `property.listed` event** is noted as a future addition; service stubs are architecture-compatible.
4. **PostGIS** requires the updated `postgis/postgis:15-alpine` image. If using an existing postgres  
   container without PostGIS, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
5. Run migration before starting environments that should use Sprint 03 property tables:
   ```bash
   npm run migrate --workspace=apps/api
   ```
