# Sprint 03 — Property Marketplace
**Phase 2 | Weeks 8–12**

## Goal
Build the property listing, discovery, and verification system — the first user-facing value of the platform. Includes agent tools, buyer portal, fraud reporting, and SEO-optimized listing pages.

---

## Deliverables Checklist
- [ ] Property listing CRUD (4 types: land, residential, commercial, off-plan)
- [ ] Multi-file photo/video uploads per listing
- [ ] Location mapping (Google Maps / Mapbox integration)
- [ ] Property search with geo-radius and filters
- [ ] SEO-optimized listing pages (Next.js SSR)
- [ ] Property verification workflow (title deed upload → admin review)
- [ ] Verification badges on listings
- [ ] Agent dashboard (listings, leads, analytics)
- [ ] Buyer portal (browse, save, schedule viewings, inquire)
- [ ] Fraud reporting system

---

## Data Models

### `property.properties`
```sql
CREATE TABLE property.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  property_type VARCHAR(30) NOT NULL, -- land, residential, commercial, off_plan
  status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, active, under_offer, sold, withdrawn
  price NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  area_sqm NUMERIC(10,2),
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  parking_spaces SMALLINT,
  features JSONB DEFAULT '[]', -- ["garden", "pool", "security"]
  agent_id UUID REFERENCES identity.users(id),
  owner_id UUID REFERENCES identity.users(id),
  verification_status VARCHAR(30) DEFAULT 'unverified', -- unverified, pending, verified, flagged
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.property_locations`
```sql
CREATE TABLE property.property_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  country CHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
  postal_code VARCHAR(20),
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  geom GEOMETRY(Point, 4326) -- PostGIS point
);
CREATE INDEX ON property.property_locations USING GIST(geom);
```

### `property.property_media`
```sql
CREATE TABLE property.property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  media_type VARCHAR(10) NOT NULL, -- image, video
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  display_order SMALLINT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.ownership_history`
```sql
CREATE TABLE property.ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  owner_id UUID REFERENCES identity.users(id),
  owner_name VARCHAR(255),         -- for historical records pre-platform
  transfer_date DATE,
  transfer_price NUMERIC(18,2),
  transfer_currency CHAR(3),
  title_deed_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.verifications`
```sql
CREATE TABLE property.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  title_deed_url TEXT,
  deed_number VARCHAR(100),
  registry_reference VARCHAR(100),
  status VARCHAR(30) DEFAULT 'pending',
  reviewer_id UUID REFERENCES identity.users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.inquiries`
```sql
CREATE TABLE property.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  buyer_id UUID REFERENCES identity.users(id),
  inquiry_type VARCHAR(20) NOT NULL, -- viewing, offer, question
  message TEXT,
  preferred_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- pending, responded, closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.saved_properties`
```sql
CREATE TABLE property.saved_properties (
  user_id UUID REFERENCES identity.users(id),
  property_id UUID REFERENCES property.properties(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);
```

### `property.fraud_reports`
```sql
CREATE TABLE property.fraud_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  reporter_id UUID REFERENCES identity.users(id),
  report_type VARCHAR(50) NOT NULL, -- double_sale, fake_title, non_existent, misrepresentation, other
  description TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]',
  status VARCHAR(30) DEFAULT 'submitted', -- submitted, under_investigation, resolved, dismissed
  resolver_id UUID REFERENCES identity.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Properties
```
POST   /api/v1/properties                          [agent, admin]
GET    /api/v1/properties                          [public] — search + filter
GET    /api/v1/properties/:id                      [public]
PATCH  /api/v1/properties/:id                      [agent (own), admin]
DELETE /api/v1/properties/:id                      [agent (own), admin]
POST   /api/v1/properties/:id/media                [agent (own)]
DELETE /api/v1/properties/:id/media/:mediaId       [agent (own)]
```

### Verification
```
POST /api/v1/properties/:id/verification-request   [agent]
GET  /api/v1/admin/properties/pending-verification [admin]
POST /api/v1/admin/properties/:id/verify           [admin]
POST /api/v1/admin/properties/:id/reject           [admin]
```

### Buyer Actions
```
POST   /api/v1/properties/:id/save
DELETE /api/v1/properties/:id/save
GET    /api/v1/users/me/saved-properties
POST   /api/v1/properties/:id/inquiries
GET    /api/v1/properties/:id/inquiries            [agent (own property)]
PATCH  /api/v1/inquiries/:id/respond               [agent]
```

### Fraud Reporting
```
POST /api/v1/properties/:id/fraud-reports
GET  /api/v1/admin/fraud-reports                   [admin]
PATCH /api/v1/admin/fraud-reports/:id/resolve      [admin]
```

---

## Search & Filtering
Query parameters for `GET /api/v1/properties`:
```
?type=residential
&min_price=50000
&max_price=500000
&currency=USD
&bedrooms=3
&bathrooms=2
&city=Harare
&lat=-17.8252&lng=31.0335&radius_km=10
&verification_status=verified
&features=pool,garden
&sort=price_asc|price_desc|newest|relevance
&page=1&limit=20
```

---

## Agent Dashboard Features
- Total listings count + breakdown by status
- New inquiries (last 7 days)
- Listing views trend (chart)
- Inquiry response rate
- Verification status of each listing

---

## SEO Requirements (Next.js SSR)
Each property listing page must have:
- `<title>`: `{bedrooms}BR {type} in {city} | Platform Name`
- `<meta description>`: First 160 chars of description
- Open Graph tags for social sharing
- Structured data (schema.org `RealEstateListing`)
- Canonical URL

---

## Acceptance Criteria
- [ ] Agent can create a listing with photos and map pin
- [ ] Listing appears in search results within 30 seconds
- [ ] Geo-radius search returns properties within specified km
- [ ] Title deed upload triggers admin verification workflow
- [ ] Verified badge shows only after admin approval
- [ ] Buyer can save, inquire, and schedule a viewing
- [ ] Fraud report submitted and visible in admin dashboard
- [ ] Listing page renders with correct meta tags (SSR confirmed)
- [ ] All property CRUD actions logged in audit table

---

## Dependencies
- Sprint 01 (infrastructure, S3, search engine)
- Sprint 02 (auth, RBAC — agent/buyer/admin roles)

## Blocks
- Sprint 04 (sales progression needs properties to transact)
- Sprint 07 (BOQ needs property linkage)
