# Sprint 03 Enhanced — Property Marketplace
**Addendum to sprint-03-property-marketplace.md**
**Added: March 2026 — Based on real-estate-platform-guide.md & AI_RealEstate_PM_Blueprint.md**

> **Status: ✅ Implemented — 2026-03-06**
> Migration `202603050014_sprint03_enhanced` applied to `pribec_dev`. All 12 features delivered.
> Tests: 25/25 passing (`mandate.service.spec`, `valuation.service.spec`, `viewing.service.spec`). TypeScript: clean build (`tsc --noEmit`).

---

## What This File Adds

Sprint 03 covers basic listing CRUD, search, verification workflow, agent dashboard, buyer portal, and fraud reporting. This enhancement adds:

1. **Mandate management** — Sole Mandate vs Open Mandate with enforcement rules
2. **Property valuation integration** — CMA vs formal valuer report distinction
3. **Complete listing lifecycle state machine** — all 7 states with transition rules
4. **Listing syndication engine** — sync to external portals (Property24, etc.)
5. **Viewing & appointment scheduler** — calendar, reminders, open houses, feedback capture
6. **Seller dashboard** — property documents, valuation requests, viewing history
7. **Neighbourhood insights** — crime stats, schools, transport, comparable sales
8. **Property comparison tool** — side-by-side view for buyers
9. **Agent brokerage management** — agents linked to brokerages
10. **Property types extended** — sectional title, estate, cluster, agricultural
11. **Additional property attributes** — levy, body corporate, zoning, title type
12. **SEO & listing syndication** — meta tags, structured data, multi-portal push

---

## Extended Property Types & Attributes

### Extend `property.properties`
```sql
ALTER TABLE property.properties
  ADD COLUMN property_subtype VARCHAR(50),      -- freehold, sectional_title, estate, cluster, lifestyle, agricultural
  ADD COLUMN erf_size_sqm NUMERIC(10,2),        -- land size (separate from floor area)
  ADD COLUMN floor_area_sqm NUMERIC(10,2),      -- GLA (Gross Leasable Area)
  ADD COLUMN garages SMALLINT DEFAULT 0,
  ADD COLUMN carports SMALLINT DEFAULT 0,
  ADD COLUMN monthly_levy NUMERIC(10,2),        -- for sectional title / estate
  ADD COLUMN monthly_rates NUMERIC(10,2),
  ADD COLUMN monthly_utilities NUMERIC(10,2),
  ADD COLUMN title_type VARCHAR(30),            -- freehold, leasehold, sectional
  ADD COLUMN zoning VARCHAR(50),                -- residential, commercial, agricultural, mixed
  ADD COLUMN body_corporate_name VARCHAR(255),
  ADD COLUMN pet_policy VARCHAR(20),            -- allowed, not_allowed, on_approval
  ADD COLUMN occupational_date DATE,            -- when buyer takes occupation
  ADD COLUMN seller_approved_at TIMESTAMPTZ,    -- seller approves listing content
  ADD COLUMN listing_reference VARCHAR(30) UNIQUE; -- human-readable ref (e.g. "PRB-0001234")
```

### Listing Lifecycle State Machine

```sql
-- All valid state transitions
CREATE TABLE property.listing_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_state VARCHAR(30) NOT NULL,
  to_state VARCHAR(30) NOT NULL,
  allowed_roles JSONB DEFAULT '[]',   -- which roles can trigger this transition
  requires_event VARCHAR(100),        -- e.g. "offer_accepted", "verification_approved"
  UNIQUE(from_state, to_state)
);

-- Seed: valid transitions
-- draft → pending_verification [agent]
-- pending_verification → active [admin]
-- pending_verification → draft [admin — rejection]
-- active → offer_received [system — when first offer submitted]
-- offer_received → under_contract [agent — on OTP signing]
-- offer_received → active [agent — offer withdrawn]
-- under_contract → sold [system — on Stage 14 completion]
-- under_contract → active [admin — sale fell through]
-- active → withdrawn [agent, seller]
-- sold → archived [system — 30 days post-registration]
```

---

## Agent Mandate System

### `property.mandates`
```sql
CREATE TABLE property.mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  agent_id UUID REFERENCES identity.users(id),
  brokerage_id UUID REFERENCES identity.organisations(id),
  mandate_type VARCHAR(20) NOT NULL,    -- sole, open
  commission_rate NUMERIC(5,2) NOT NULL, -- % of sale price (e.g. 5.50)
  commission_vat_inclusive BOOLEAN DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,              -- typically 90 days for sole mandate
  auto_renewal BOOLEAN DEFAULT FALSE,
  terms_document_url TEXT,
  signed_by_seller_at TIMESTAMPTZ,
  signed_by_agent_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending_signature', -- pending_signature, active, expired, cancelled
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, agent_id, status)  -- prevent duplicate active mandates
);
CREATE INDEX ON property.mandates (property_id, status);
CREATE INDEX ON property.mandates (agent_id, status);
```

### Mandate Enforcement Rules

**Sole Mandate:**
- Only one agent can have active sole mandate per property at any time
- If sole mandate is active, system blocks other agents from creating listings for the same property
- Commission owed even if seller finds buyer directly (enforced contractually)

**Open Mandate:**
- Multiple agents can market simultaneously
- Platform tracks which agent introduced each buyer inquiry
- Commission awarded only to agent that introduced the successful buyer

```sql
-- Sole mandate conflict check (enforce in application layer):
-- Before creating mandate: check if another ACTIVE sole mandate exists for property_id
-- If yes: reject with clear error "Property already has an active sole mandate"
```

### API endpoints:
```
POST  /api/v1/properties/:id/mandate              [agent] — create mandate draft
GET   /api/v1/properties/:id/mandate              [agent (own), seller, admin]
POST  /api/v1/properties/:id/mandate/:mId/sign    [seller, agent] — e-sign mandate
PATCH /api/v1/properties/:id/mandate/:mId/cancel  [agent, seller, admin]
GET   /api/v1/agent/mandates                      [agent] — own active mandates
```

---

## Property Valuation Module

### `property.valuations`
```sql
CREATE TABLE property.valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  valuation_type VARCHAR(20) NOT NULL,   -- formal (licensed valuer), cma (agent estimate)
  valuer_id UUID REFERENCES identity.users(id),  -- must have 'valuer' role for formal
  estimated_value NUMERIC(18,2) NOT NULL,
  market_low NUMERIC(18,2),
  market_high NUMERIC(18,2),
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  valuation_date DATE NOT NULL,
  methodology TEXT,                      -- comparable sales, income approach, cost approach
  comparables JSONB DEFAULT '[]',        -- [{address, sale_price, sale_date, similarity_score}]
  report_document_url TEXT,
  is_bank_accepted BOOLEAN DEFAULT FALSE, -- formal valuations may be submitted to banks
  requesting_purpose VARCHAR(50),         -- listing, bond_application, insurance, legal
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON property.valuations (property_id, valuation_type);
```

### Comparable Sales Database
```sql
CREATE TABLE property.comparable_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city VARCHAR(100),
  region VARCHAR(100),
  country CHAR(2) NOT NULL,
  property_type VARCHAR(30),
  property_subtype VARCHAR(50),
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  floor_area_sqm NUMERIC(10,2),
  erf_size_sqm NUMERIC(10,2),
  sale_price NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  sale_date DATE NOT NULL,
  days_on_market SMALLINT,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  data_source VARCHAR(50),  -- platform_sale, deeds_office_feed, manual
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON property.comparable_sales (country, region, sale_date);
CREATE INDEX ON property.comparable_sales USING GIST(
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);
```

### API:
```
POST /api/v1/properties/:id/valuation-request    [seller, agent] — request formal valuer
GET  /api/v1/properties/:id/valuations           [seller, agent, conveyancer]
POST /api/v1/valuations/:id/submit-report        [valuer] — upload report
GET  /api/v1/valuers?country=ZA&specialization=residential  — find valuer
GET  /api/v1/properties/:id/comparable-sales     [agent, valuer, admin] — auto-pulled comps
```

---

## Viewing & Appointment Scheduler

### `property.viewings`
```sql
CREATE TABLE property.viewings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  agent_id UUID REFERENCES identity.users(id),
  buyer_id UUID REFERENCES identity.users(id),
  viewing_type VARCHAR(20) NOT NULL,   -- physical, virtual, open_house
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT DEFAULT 30,
  status VARCHAR(20) DEFAULT 'requested', -- requested, confirmed, completed, no_show, cancelled
  virtual_link TEXT,                     -- Zoom/Meet link for virtual viewings
  agent_notes TEXT,
  buyer_feedback JSONB,   -- {rating: 4, interested: true, notes: "loved the kitchen"}
  no_show_reason TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON property.viewings (property_id, scheduled_at);
CREATE INDEX ON property.viewings (agent_id, scheduled_at);
```

### `property.open_houses`
```sql
CREATE TABLE property.open_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  agent_id UUID REFERENCES identity.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  max_attendees SMALLINT,
  description TEXT,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, active, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE property.open_house_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  open_house_id UUID REFERENCES property.open_houses(id),
  buyer_id UUID REFERENCES identity.users(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN,
  feedback JSONB
);
```

### API:
```
POST  /api/v1/properties/:id/viewings                 [buyer] — request viewing
GET   /api/v1/properties/:id/viewings                 [agent (own property)]
PATCH /api/v1/viewings/:id/confirm                    [agent]
PATCH /api/v1/viewings/:id/complete                   [agent]
POST  /api/v1/viewings/:id/feedback                   [buyer]
GET   /api/v1/agent/viewings?from=&to=                [agent] — calendar view
POST  /api/v1/properties/:id/open-houses              [agent]
POST  /api/v1/open-houses/:id/register                [buyer]
```

### Reminder Notifications
- 48h before viewing: Buyer + Seller SMS/email
- 2h before viewing: Buyer push notification
- After viewing: Buyer prompted for feedback (30 min post-viewing)
- No-show: Agent notified immediately; rebooking flow triggered

---

## Neighbourhood Insights

### `property.neighbourhood_stats`
```sql
CREATE TABLE property.neighbourhood_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suburb VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  country CHAR(2) NOT NULL,
  avg_price_per_sqm NUMERIC(10,2),
  median_sale_price NUMERIC(18,2),
  avg_days_on_market SMALLINT,
  yoy_price_change_pct NUMERIC(5,2),     -- year-over-year % change
  demand_score SMALLINT,                  -- 1-100 (how fast properties sell)
  school_rating SMALLINT,                 -- avg rating of schools in area
  infrastructure_score SMALLINT,          -- roads, water, electricity reliability
  crime_index SMALLINT,                   -- lower = safer (scale may vary by data source)
  walkability_score SMALLINT,
  last_calculated_at TIMESTAMPTZ,
  data_sources JSONB DEFAULT '[]',
  UNIQUE(suburb, city, country)
);
```

---

## Listing Syndication Engine

### `property.syndication_configs`
```sql
CREATE TABLE property.syndication_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_name VARCHAR(100) NOT NULL,   -- property24, private_property, zillow, rightmove
  portal_api_endpoint TEXT,
  auth_type VARCHAR(20),               -- api_key, oauth, basic
  credentials_secret_ref TEXT,         -- Reference to Vault secret path
  supported_countries JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ
);

CREATE TABLE property.syndication_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  portal_id UUID REFERENCES property.syndication_configs(id),
  external_listing_id VARCHAR(255),     -- the property's ID on that portal
  external_url TEXT,
  sync_status VARCHAR(20) DEFAULT 'pending', -- pending, synced, failed, paused
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API:
```
POST  /api/v1/properties/:id/syndicate        [agent] — push to all active portals
PATCH /api/v1/properties/:id/syndicate/:portalId/pause  [agent]
GET   /api/v1/properties/:id/syndication-status         [agent]
```

---

## Property Comparison Tool

```
GET /api/v1/properties/compare?ids=uuid1,uuid2,uuid3   [public, max 4 properties]
```

Returns a structured comparison object:
```typescript
interface PropertyComparison {
  properties: PropertyDetail[];
  comparison: {
    price: { values: number[]; winner: string };
    pricePerSqm: { values: number[]; winner: string };
    size: { values: number[]; winner: string };
    bedrooms: { values: number[] };
    monthlyLevy: { values: number[] };
    verificationStatus: { values: string[] };
    daysOnMarket: { values: number[]; winner: string };
  }
}
```

---

## Extended Agent Dashboard APIs

```
GET /api/v1/agent/dashboard/summary        — listings count, active mandates, pending offers, total pipeline value
GET /api/v1/agent/listings/performance     — per-listing views, saves, enquiries, days on market
GET /api/v1/agent/listings/activity-feed   — recent activity across all listings
GET /api/v1/agent/commission-pipeline      — expected commission from active deals
```

---

## Seller Dashboard APIs

```
GET  /api/v1/seller/properties             — seller's properties with status
GET  /api/v1/seller/properties/:id/activity — views, saves, enquiries for seller's listing
GET  /api/v1/seller/properties/:id/viewings — scheduled and completed viewings
GET  /api/v1/seller/properties/:id/offers  — active offers (read-only — agent manages)
```

---

## Additional Acceptance Criteria

- [ ] Sole mandate creation blocked if another active sole mandate exists for same property
- [ ] Open mandate allows multiple agents to list same property
- [ ] Mandate expiry notification fires 7 days before end date
- [ ] Formal valuation report linked to listing and visible to conveyancer
- [ ] CMA (agent estimate) clearly distinguished from formal valuation in UI
- [ ] Viewing confirmed by agent sends automated SMS/email to buyer
- [ ] Post-viewing feedback captured within 30 minutes of viewing time
- [ ] Listing state transitions logged in audit table with actor and reason
- [ ] Listing synced to configured portals within 60 seconds of going active
- [ ] Property comparison returns correct winner for price/sqm
- [ ] Neighbourhood insights displayed on listing detail page
- [ ] Comparable sales auto-pulled within 2km radius on valuation request

---

## Dependencies
- Sprint 02 (auth) + Sprint 02 Enhanced (org accounts, valuer role)
- Sprint 03 base

## Blocks
- Sprint 04 Enhanced (OTP references viewing history and mandate)
- Sprint 13 (Valuation & Mandate sprint builds on these models)
