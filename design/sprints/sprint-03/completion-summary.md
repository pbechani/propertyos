# Sprint 03 — Property Marketplace
**Completed:** 2026-02-21
**Final Test Grade:** PASS — 192/192 tests (152 Sprint 02 + 40 Sprint 03)
**Next Sprint:** Sprint 04 — Sales Progression ✅ APPROVED TO START

---

## 1. What Was Delivered

Sprint 03 built the complete property marketplace — listing management, geo-search, verification, buyer tools, and fraud prevention.

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Property listing CRUD (land, residential, commercial, off-plan) | ✅ | Agent-owned; admin override; full audit trail |
| Multi-file photo/video uploads | ✅ | Up to 20 media files per property; stub URL until S3 wired |
| Location storage + geo-radius search | ✅ | PostGIS `ST_DWithin` for radius; city text fallback |
| Property search with filters | ✅ | 12 filter params; type, price, bedrooms, location, features, sort |
| Property verification workflow | ✅ | Agent submits → admin review → verified/flagged badge |
| Verification badges | ✅ | `verification_status` field on property |
| Agent dashboard API | ✅ | Stats: listings by status, new inquiries (7d), verification summary |
| Buyer portal features | ✅ | Save/unsave, inquiries (viewing/offer/question), respond |
| Fraud reporting system | ✅ | Report types, admin review, auto-flag property |
| Property audit trail | ✅ | `property.audit_logs` with immutable trigger |
| PostGIS Docker image | ✅ | `docker-compose.yml` updated to `postgis/postgis:15-alpine` |

---

## 2. Architecture Decisions

### 2.1 Module Location
All property code lives under `apps/api/src/property/`. Registered in `AppModule` as `PropertyModule`. Follows same bounded-context pattern as `IdentityModule`.

### 2.2 Separate Controllers by Domain Concern
| Controller | Routes | Roles |
|-----------|--------|-------|
| `PropertyController` | `POST/GET/PATCH/DELETE /api/v1/properties` | agent, admin |
| `AgentDashboardController` | `GET /api/v1/agent/dashboard` | agent, admin |
| `VerificationController` | `POST /api/v1/properties/:id/verification-request` | agent, admin |
| `AdminVerificationController` | `GET/POST /api/v1/admin/properties/...` | admin |
| `BuyerController` | `POST/DELETE /api/v1/properties/:id/save`, inquiries | authenticated |
| `InquiryResponseController` | `PATCH /api/v1/inquiries/:id/respond` | agent, admin |
| `SavedPropertiesController` | `GET /api/v1/users/me/saved-properties` | authenticated |
| `FraudController` | `POST /api/v1/properties/:id/fraud-reports` | authenticated |
| `AdminFraudController` | `GET/PATCH /api/v1/admin/fraud-reports` | admin |

### 2.3 Geo-Search
Uses PostGIS `ST_DWithin` with geography type for accurate distance calculation in meters. Fallback to text-based `LOWER(city)` match when no coordinates provided.

```sql
ST_DWithin(
  loc.geom,
  ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography,
  $radius_meters
)
```

### 2.4 Property Audit Service
Sprint 03 introduces `PropertyAuditService` that writes to `property.audit_logs` (not `identity.audit_logs`). This follows PDR-006 schema isolation. The table has an immutable trigger identical to the identity audit trigger.

### 2.5 Media Upload
`MediaStorageService` handles photo/video uploads (up to 50MB, max 20 per listing). Real MinIO/S3 upload is deferred (D1) — currently returns stub signed URLs.

---

## 3. Database Schema — `property.*`

Migration file: `apps/api/prisma/migrations/202602210002_sprint03_property_marketplace/migration.sql`

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `property.properties` | `id UUID`, `title`, `property_type`, `status`, `price`, `currency`, `verification_status`, `agent_id`, `owner_id` | Core listing record |
| `property.property_locations` | `property_id UUID UNIQUE`, `latitude`, `longitude`, `geom GEOMETRY(Point, 4326)` | One-to-one with property; GIST index |
| `property.property_media` | `property_id`, `media_type`, `url`, `is_primary`, `display_order` | Up to 20 per property |
| `property.ownership_history` | `property_id`, `owner_id`, `transfer_date`, `title_deed_url` | Pre-platform records supported via `owner_name` text field |
| `property.verifications` | `property_id`, `title_deed_url`, `deed_number`, `registry_reference`, `status`, `reviewer_id` | One pending per property at a time |
| `property.inquiries` | `property_id`, `buyer_id`, `inquiry_type`, `status`, `response` | Viewing, offer, question |
| `property.saved_properties` | `(user_id, property_id)` PK | Composite PK prevents duplicates |
| `property.fraud_reports` | `property_id`, `reporter_id`, `report_type`, `evidence_urls JSONB`, `status` | Auto-flags property on submit |
| `property.audit_logs` | `event_id`, `actor_id`, `action`, `resource_type`, `resource_id`, `payload JSONB` | Append-only trigger enforced |

### Cross-Schema References
Per PDR-006, no FK constraints cross schemas. `agent_id`, `owner_id`, `buyer_id`, `reporter_id` are stored as `UUID` with application-layer resolution.

---

## 4. API Endpoints Delivered

### Properties (`/api/v1/properties`)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/properties` | Agent, Admin | Creates listing; optional location in body |
| GET | `/properties` | Public | 12 filter params; geo-radius; pagination |
| GET | `/properties/:id` | Public | Returns location + media |
| PATCH | `/properties/:id` | Agent (own), Admin | Partial updates; location upsert |
| DELETE | `/properties/:id` | Agent (own), Admin | Hard delete with cascade |
| POST | `/properties/:id/media` | Agent (own), Admin | Multipart file upload |
| DELETE | `/properties/:id/media/:mediaId` | Agent (own), Admin | — |

### Verification
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/properties/:id/verification-request` | Agent | Multipart: titleDeed field |
| GET | `/admin/properties/pending-verification` | Admin | Paginated |
| POST | `/admin/properties/:id/verify` | Admin | Sets `verification_status = 'verified'` |
| POST | `/admin/properties/:id/reject` | Admin | Sets `verification_status = 'flagged'` |

### Buyer Actions
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/properties/:id/save` | JWT | Idempotent (ON CONFLICT DO NOTHING) |
| DELETE | `/properties/:id/save` | JWT | — |
| GET | `/users/me/saved-properties` | JWT | Paginated |
| POST | `/properties/:id/inquiries` | JWT | viewing, offer, question |
| GET | `/properties/:id/inquiries` | Agent (own), Admin | Paginated |
| PATCH | `/inquiries/:id/respond` | Agent, Admin | Marks status = responded |

### Fraud Reports
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/properties/:id/fraud-reports` | JWT | Auto-flags property |
| GET | `/admin/fraud-reports` | Admin | Filter by status |
| PATCH | `/admin/fraud-reports/:id/resolve` | Admin | resolved \| dismissed |

### Agent Dashboard
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/agent/dashboard` | Agent, Admin | Listing stats, inquiry count, verification summary |

---

## 5. Services — Quick Reference

| Class | File | Purpose |
|-------|------|---------|
| `PropertyService` | `property.service.ts` | CRUD, search, media, agent dashboard |
| `VerificationService` | `verification.service.ts` | Verification state machine |
| `InquiryService` | `inquiry.service.ts` | Create, list, respond to inquiries |
| `FraudService` | `fraud.service.ts` | Submit, list, resolve fraud reports |
| `SavedPropertiesService` | `saved-properties.service.ts` | Save/unsave/list |
| `MediaStorageService` | `media-storage.service.ts` | Validates + uploads media (stub URLs) |
| `PropertyAuditService` | `property-audit.service.ts` | Writes to `property.audit_logs` |

---

## 6. Search Query Parameters

```
GET /api/v1/properties
  ?type=residential|land|commercial|off_plan
  &min_price=50000
  &max_price=500000
  &currency=USD
  &bedrooms=3
  &bathrooms=2
  &city=Harare
  &lat=-17.8252&lng=31.0335&radiusKm=10
  &verificationStatus=verified
  &features=pool,garden
  &sort=price_asc|price_desc|newest|relevance
  &page=1&limit=20
```

---

## 7. Test Coverage

| File | Tests | Coverage Areas |
|------|-------|----------------|
| `property.service.spec.ts` | 16 | create, findById, update, delete, search, addMedia, getAgentDashboard |
| `verification.service.spec.ts` | 8 | submit (5 cases), approve, reject, getPending |
| `inquiry.service.spec.ts` | 6 | create, respond, findByProperty |
| `fraud.service.spec.ts` | 6 | create, resolve, findAll |
| `identity/*` (Sprint 02) | 152 | All Sprint 02 tests continue passing |
| **Total** | **192/192** | All passing |

---

## 8. Deferred Items (Pre-Sprint 04)

| # | Item | Risk | When |
|---|------|------|------|
| D1 | Real MinIO/S3 signed URLs in `MediaStorageService` | High — no real file storage | Before user testing |
| D2 | Elasticsearch indexing for property search (currently DB query) | Medium — performance at scale | Sprint 07+ |
| D3 | `property.listed` RabbitMQ event for async notifications | Low | Sprint 07+ |
| D4 | S3 title deed upload in `VerificationService` | High — deeds not actually stored | Before admin review |

---

## 9. Sprint 04 Integration Points

### 9.1 Property Reference Pattern
Sprint 04 (Sales Progression) needs `property_id` to create transactions. Use:
```typescript
// Application-layer check: property exists and is 'active'
SELECT id FROM property.properties WHERE id = $propertyId::uuid AND status = 'active'
```

### 9.2 Property Status Transitions for Sales
When a sale begins, update property status to `under_offer`:
```sql
UPDATE property.properties SET status = 'under_offer' WHERE id = $id::uuid
```
Sprint 04 should call `PropertyService` or directly update `property.properties.status`.

### 9.3 Exporting PropertyService
`PropertyService` and `PropertyAuditService` are exported from `PropertyModule`. Import `PropertyModule` in `SalesModule` if direct access is needed.

### 9.4 Roles Needed for Sprint 04
All relevant roles (`buyer_seller`, `agent`, `admin`, `conveyancer`) are already seeded. No new roles required.

---

## 10. Files Created / Modified

### New Files
```
apps/api/src/property/
  property.constants.ts
  property.dto.ts
  property-audit.service.ts
  media-storage.service.ts
  property.service.ts
  property.service.spec.ts
  verification.service.ts
  verification.service.spec.ts
  inquiry.service.ts
  inquiry.service.spec.ts
  fraud.service.ts
  fraud.service.spec.ts
  saved-properties.service.ts
  property.controller.ts
  verification.controller.ts
  buyer.controller.ts
  fraud.controller.ts
  property.module.ts

apps/api/prisma/migrations/202602210002_sprint03_property_marketplace/
  migration.sql
```

### Modified Files
```
apps/api/prisma/schema.prisma           — Added 8 property Prisma models
apps/api/src/app.module.ts             — Added PropertyModule import
docker/docker-compose.yml              — Updated Postgres to postgis/postgis:15-alpine
```
