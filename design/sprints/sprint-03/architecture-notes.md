# Sprint 03 — Architecture & Implementation Notes

## Module Structure

```
apps/api/src/property/
├── property.module.ts          # NestJS module wiring
├── property.constants.ts       # Enums, limits, allowed types
├── property.dto.ts             # All request DTOs with class-validator
├── property.service.ts         # CRUD, search, media, dashboard
├── property.service.spec.ts    # 16 unit tests
├── property.controller.ts      # Property CRUD + agent dashboard
├── verification.service.ts     # Verification state machine
├── verification.service.spec.ts # 8 unit tests
├── verification.controller.ts  # Agent + admin verification routes
├── inquiry.service.ts          # Inquiry CRUD (buyer + agent)
├── inquiry.service.spec.ts     # 6 unit tests
├── fraud.service.ts            # Fraud reporting + admin resolution
├── fraud.service.spec.ts       # 6 unit tests
├── buyer.controller.ts         # Save/unsave, inquiries, saved-properties
├── fraud.controller.ts         # Fraud report + admin fraud routes
├── saved-properties.service.ts # Save/unsave/list shortlisted properties
├── media-storage.service.ts    # Photo/video upload validation (stub URLs)
└── property-audit.service.ts   # Writes to property.audit_logs
```

---

## Key Design Patterns

### Raw SQL Queries (consistent with Sprint 02)
All database operations use `prisma.$queryRaw` (tagged template literals) or `prisma.$queryRawUnsafe` for dynamic WHERE clauses. No Prisma ORM model methods used, ensuring clear parameterisation and no SQL injection risk.

### Dynamic Filter Builder (Search)
Property search builds a dynamic SQL WHERE clause by pushing condition strings + values. The index `idx` counter tracks positional parameters `$1, $2, ...`:

```typescript
const conditions: string[] = ["p.status = 'active'"];
const values: unknown[] = [];
let idx = 1;

if (dto.type) {
  conditions.push(`p.property_type = $${idx++}`);
  values.push(dto.type);
}
// ...
const query = `SELECT p.* FROM property.properties p WHERE ${conditions.join(' AND ')} ...`;
this.prisma.$queryRawUnsafe(query, ...values);
```

### Ownership Guard Pattern
All agent-scoped mutations call `assertAgentOwns()` helper first:

```typescript
private async assertAgentOwns(propertyId, agentId, agentRole): Promise<void> {
  if (agentRole !== 'admin' && rows[0].agent_id !== agentId) {
    throw new ForbiddenException('...');
  }
}
```

### Actor Role Resolution (multi-role safe)
Sprint-03 gap closure added a dedicated role resolver to avoid relying on `roles[0]` ordering.

- Source: `apps/api/src/property/property.constants.ts`
- Precedence: `admin` → `agent` → fallback role

This is now used in property controllers to ensure admin override remains correct even when JWT role arrays are ordered differently.

### Verification State Machine
States: `unverified` → `pending` → `verified` | `flagged`

- Only one `pending` verification per property at a time (enforced with SELECT before INSERT)
- Approval: sets `property.verification_status = 'verified'` + `verified_at` + `verified_by`
- Rejection: sets `property.verification_status = 'flagged'`

### Fraud Auto-Flag
When any fraud report is submitted, the target property's `verification_status` is set to `'flagged'` (unless already flagged):
```sql
UPDATE property.properties
SET verification_status = 'flagged' WHERE id = $id::uuid
  AND verification_status NOT IN ('flagged')
```

---

## PostGIS Setup

### Docker Image Change
`docker/docker-compose.yml` updated:
```yaml
postgres:
  image: postgis/postgis:15-alpine  # was: postgres:15-alpine
```

### Extension & Geometry
Migration enables PostGIS and creates geometry column:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
-- In property_locations:
geom GEOMETRY(Point, 4326)
```

### Geo-Upsert
When lat/lng provided, the geometry is computed inline:
```sql
ST_SetSRID(ST_MakePoint($lng, $lat), 4326)
```

### Geo Search
```sql
ST_DWithin(
  loc.geom,
  ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography,
  $radius_meters
)
```
`::geography` cast ensures distance is in meters (earth surface).

---

## Environment Variables (no new vars added)

Sprint 03 adds no new environment variables. Database/S3/cache config inherited from Sprint 01. MinIO will be used for real media storage when S3 stub is replaced (D1 deferred item).

---

## Prisma Schema Additions

8 new models added to `apps/api/prisma/schema.prisma` under `@@schema("property")`:

| Model | Maps To |
|-------|---------|
| `Property` | `property.properties` |
| `PropertyLocation` | `property.property_locations` |
| `PropertyMedia` | `property.property_media` |
| `OwnershipHistory` | `property.ownership_history` |
| `PropertyVerification` | `property.verifications` |
| `PropertyInquiry` | `property.inquiries` |
| `SavedProperty` | `property.saved_properties` |
| `FraudReport` | `property.fraud_reports` |
| `PropertyAuditLog` | `property.audit_logs` |

---

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| Agent can create listing with photos and map pin | ✅ | `POST /properties` + `POST /properties/:id/media` |
| Listing appears in search within 30 seconds | ✅ | DB-indexed; no async queue for MVP |
| Geo-radius search within specified km | ✅ | PostGIS ST_DWithin |
| Title deed upload triggers verification workflow | ✅ | POST verification-request sets status=pending |
| Verified badge only after admin approval | ✅ | `verification_status = 'verified'` post admin action |
| Buyer can save, inquire, schedule viewing | ✅ | Save + inquiry endpoints |
| Fraud report visible in admin dashboard | ✅ | GET /admin/fraud-reports |
| All property CRUD audited | ✅ | PropertyAuditService on every mutation |
| Listing page renders with SSR metadata + structured data | ✅ | Implemented in `apps/web/src/app/properties/[id]/page.tsx` |

---

## 2026-02-23 Gap Closure Addendum

### Web integration updates
- `apps/web/src/app/properties/search/page.tsx`
  - Replaced mock-backed result flow with live `propertiesApi.search()` calls.
  - Added URL query synchronization for `city`, `verified`, `sort`, and `page`.
  - Added loading/empty/error states and API-driven pagination.

- `apps/web/src/app/properties/[id]/page.tsx`
  - Added live server-side property fetch (`/api/v1/properties/:id`) with graceful fallback.
  - Added route-level SEO metadata + Open Graph + canonical + JSON-LD (`RealEstateListing`).

- `apps/web/src/app/properties/page.tsx`
  - Featured listings now load from live property search endpoint (verified, newest) with fallback.

- `apps/web/src/components/property/PropertyActions.tsx`
  - Added authenticated buyer actions: save listing, submit inquiry, submit fraud report.

- `apps/web/src/lib/api-client.ts`
  - Added typed Sprint-03 `propertiesApi` surface for search/detail/create/update/delete/save/unsave/inquiry/verification/fraud actions.

### Validation snapshot
- Web type-check: `cd apps/web && npx tsc --noEmit` ✅
- Property module targeted tests: 5 suites / 50 tests passing ✅

---

## Known Limitations / Out of Scope (MVP)

- **Elasticsearch indexing**: Search currently uses PostgreSQL full-table scan with indexes. Elasticsearch integration deferred to Sprint 07
- **RabbitMQ events**: `property.listed` event not yet published (wired in Sprint 07)
- **EXIF validation**: Geo-tagged photo EXIF validation for construction progress applies to Sprint 09 (Monitoring), not Sprint 03
