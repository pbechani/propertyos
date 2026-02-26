# Sprint 07 — Contractor & Supplier Marketplaces
**Phase 6 | Weeks 31–38**

## Goal
Build verified contractor and supplier marketplaces with RFQ systems, two-way ratings, and material price intelligence. This creates the network effects that make the platform defensible.

---

## Deliverables Checklist
- [ ] Contractor profiles (KYC, skills, portfolio, service areas)
- [ ] Contractor RFQ + bidding + quote comparison
- [ ] Contract generation on quote acceptance
- [ ] Contractor performance metrics
- [ ] Supplier profiles (catalog, pricing, stock, delivery areas)
- [ ] Supplier RFQ + quote comparison + order placement
- [ ] Order lifecycle tracking (placed → delivered)
- [ ] Delivery confirmation (geo-tagged proof)
- [ ] Invoice generation
- [ ] Two-way ratings & reviews system
- [ ] Material price intelligence dashboard (MPI)

---

## Data Models

### `marketplace.contractor_profiles`
```sql
CREATE TABLE marketplace.contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  business_name VARCHAR(255),
  registration_number VARCHAR(100),
  specializations JSONB DEFAULT '[]', -- ["foundation","roofing","electrical","plumbing"]
  experience_years SMALLINT,
  max_project_value NUMERIC(18,2),
  service_areas JSONB DEFAULT '[]', -- [{country, region, city}]
  certifications JSONB DEFAULT '[]', -- [{name, issuer, expiry_date, url}]
  insurance_certificate_url TEXT,
  insurance_expiry DATE,
  bio TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  reputation_score NUMERIC(4,2) DEFAULT 0, -- 0-100
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace.contractor_portfolio`
```sql
CREATE TABLE marketplace.contractor_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_profile_id UUID REFERENCES marketplace.contractor_profiles(id),
  project_title VARCHAR(255) NOT NULL,
  project_type VARCHAR(50),
  project_value NUMERIC(18,2),
  completion_date DATE,
  description TEXT,
  media_urls JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE, -- verified via platform if done on platform
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace.rfqs` (Request for Quotation)
```sql
CREATE TABLE marketplace.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_reference VARCHAR(50) UNIQUE NOT NULL,
  rfq_type VARCHAR(20) NOT NULL, -- contractor, supplier
  project_id UUID REFERENCES construction.projects(id),
  requester_id UUID REFERENCES identity.users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scope_of_work TEXT,
  required_skills JSONB DEFAULT '[]',
  site_location JSONB,      -- {lat, lng, address}
  start_date DATE,
  end_date DATE,
  budget_estimate NUMERIC(18,2),
  currency CHAR(3) DEFAULT 'USD',
  deadline_for_quotes DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, closed, awarded, cancelled
  awarded_to UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace.quotes`
```sql
CREATE TABLE marketplace.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES marketplace.rfqs(id),
  quoter_id UUID REFERENCES identity.users(id),   -- contractor or supplier
  total_amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  labor_amount NUMERIC(18,2),
  materials_amount NUMERIC(18,2),
  overhead_amount NUMERIC(18,2),
  line_items JSONB DEFAULT '[]',  -- [{description, qty, unit, unit_price, total}]
  timeline_days INTEGER,
  validity_days SMALLINT DEFAULT 30,
  terms_and_conditions TEXT,
  notes TEXT,
  documents JSONB DEFAULT '[]',    -- attached PDFs
  status VARCHAR(20) DEFAULT 'submitted', -- submitted, viewed, accepted, rejected, expired
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### `marketplace.contracts`
```sql
CREATE TABLE marketplace.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_reference VARCHAR(50) UNIQUE NOT NULL,
  quote_id UUID REFERENCES marketplace.quotes(id),
  project_id UUID REFERENCES construction.projects(id),
  client_id UUID REFERENCES identity.users(id),
  contractor_id UUID REFERENCES identity.users(id),
  contract_value NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  start_date DATE,
  end_date DATE,
  payment_terms TEXT,
  contract_document_url TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft, signed_contractor, signed_client, active, completed, disputed, terminated
  client_signed_at TIMESTAMPTZ,
  contractor_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace.supplier_profiles`
```sql
CREATE TABLE marketplace.supplier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  business_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  business_type VARCHAR(50), -- manufacturer, distributor, retailer, importer
  delivery_areas JSONB DEFAULT '[]', -- [{country, region, city, max_km}]
  minimum_order_value NUMERIC(18,2),
  payment_terms TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  reputation_score NUMERIC(4,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace.supplier_products`
```sql
CREATE TABLE marketplace.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES marketplace.supplier_profiles(id),
  sku VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- cement, bricks, steel, timber, roofing, electrical, plumbing, etc.
  subcategory VARCHAR(100),
  description TEXT,
  unit VARCHAR(30) NOT NULL, -- bag, m2, m3, piece, kg, litre, roll
  unit_price NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  stock_quantity NUMERIC(10,2),
  min_order_qty NUMERIC(10,2) DEFAULT 1,
  lead_time_days SMALLINT,
  is_available BOOLEAN DEFAULT TRUE,
  media_urls JSONB DEFAULT '[]',
  specifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON marketplace.supplier_products (category, is_available);
```

### `marketplace.orders`
```sql
CREATE TABLE marketplace.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference VARCHAR(50) UNIQUE NOT NULL,
  quote_id UUID REFERENCES marketplace.quotes(id),
  project_id UUID REFERENCES construction.projects(id),
  buyer_id UUID REFERENCES identity.users(id),
  supplier_id UUID REFERENCES identity.users(id),
  total_amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  delivery_address TEXT,
  delivery_lat NUMERIC(9,6),
  delivery_lng NUMERIC(9,6),
  requested_delivery_date DATE,
  status VARCHAR(30) DEFAULT 'placed', -- placed, confirmed, preparing, shipped, delivered, cancelled
  escrow_account_id UUID REFERENCES financial.accounts(id),
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
```

### `marketplace.delivery_confirmations`
```sql
CREATE TABLE marketplace.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES marketplace.orders(id),
  confirmed_by UUID REFERENCES identity.users(id),
  proof_photo_url TEXT,
  proof_photo_lat NUMERIC(9,6),
  proof_photo_lng NUMERIC(9,6),
  condition VARCHAR(20), -- intact, damaged, partial
  damage_notes TEXT,
  recipient_signature_url TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace.ratings`
```sql
CREATE TABLE marketplace.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES identity.users(id),
  rated_entity_id UUID REFERENCES identity.users(id),
  entity_type VARCHAR(20) NOT NULL, -- contractor, supplier, buyer
  reference_id UUID,     -- project_id or order_id
  overall_score SMALLINT NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
  dimension_scores JSONB, -- {"quality": 5, "timeliness": 4, "communication": 5}
  review_text TEXT,
  is_verified BOOLEAN DEFAULT FALSE, -- verified if linked to completed platform transaction
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `marketplace.material_prices` (Price Intelligence)
```sql
CREATE TABLE marketplace.material_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_category VARCHAR(100) NOT NULL,
  material_name VARCHAR(255) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  region VARCHAR(100) NOT NULL,
  country CHAR(2) NOT NULL,
  price NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  price_tier VARCHAR(20) NOT NULL, -- budget, standard, premium
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON marketplace.material_prices (material_category, country, recorded_at);
```

---

## API Endpoints

### Service Provider Marketplace (Contractors)
```
POST  /api/v1/contractors/profile
GET   /api/v1/contractors?skills=&region=&rating_min=
GET   /api/v1/contractors/:id
PATCH /api/v1/contractors/profile    [own profile]
POST  /api/v1/contractors/portfolio
```

### Supplier Marketplace
```
POST  /api/v1/suppliers/profile
GET   /api/v1/suppliers?category=&region=
GET   /api/v1/suppliers/:id
POST  /api/v1/suppliers/products
PATCH /api/v1/suppliers/products/:id
GET   /api/v1/products?category=&supplier=&region=&min_price=&max_price=
```

### RFQ System
```
POST /api/v1/rfqs                               [buyer/project_owner]
GET  /api/v1/rfqs                               [auth] — relevant RFQs for role
GET  /api/v1/rfqs/:id
POST /api/v1/rfqs/:id/quotes                    [contractor/supplier]
GET  /api/v1/rfqs/:id/quotes                    [RFQ owner]
POST /api/v1/rfqs/:id/quotes/:quoteId/accept    [RFQ owner]
POST /api/v1/rfqs/:id/quotes/:quoteId/reject    [RFQ owner]
```

### Orders
```
GET  /api/v1/orders                             [own orders]
GET  /api/v1/orders/:id
PATCH /api/v1/orders/:id/confirm                [supplier]
PATCH /api/v1/orders/:id/ship                   [supplier]
POST /api/v1/orders/:id/delivery-confirmation   [buyer — with photo upload]
POST /api/v1/orders/:id/invoice                 [supplier]
```

### Ratings
```
POST /api/v1/ratings
GET  /api/v1/contractors/:id/ratings
GET  /api/v1/suppliers/:id/ratings
```

### Price Intelligence
```
GET /api/v1/market/material-prices?category=cement&country=ZW&region=Harare
GET /api/v1/market/price-trends?material=cement&country=ZW&months=12
```

---

## Reputation Score Algorithm
Computed score (0–100) for contractors and suppliers:
```
reputation_score = (
  avg_rating * 0.40 +           -- avg of all verified ratings (max 5 → normalized to 100)
  completion_rate * 0.25 +      -- % projects/orders completed
  on_time_rate * 0.20 +         -- % delivered on schedule
  (1 - dispute_rate) * 0.15     -- inverse of dispute frequency
) * 100
```
Recalculated nightly via scheduled job.

---

## Acceptance Criteria
- [ ] Contractor can create profile, add portfolio, set service areas
- [ ] Buyer can browse and filter contractors by skill and region
- [ ] RFQ sent, contractor submits quote, buyer accepts → contract generated
- [ ] Supplier catalog visible with pricing and availability
- [ ] Material RFQ triggers quotes from relevant suppliers
- [ ] Order lifecycle tracked through all statuses
- [ ] Geo-tagged delivery confirmation photo required for escrow release
- [ ] Two-way rating created after project/order completion
- [ ] Reputation scores updated within 24 hours of new rating
- [ ] Material price trend chart shows historical data per category/region

---

## Dependencies
- Sprint 01-b (company management layer — `identity.companies`, `identity.company_members`; company `verified` status gates marketplace profile creation)
- Sprint 02 (contractor/supplier roles + KYC)
- Sprint 05 (escrow for order payments)
- Sprint 06 (projects to attach RFQs to)

## Sprint 01-b Schema Adjustments Required at Sprint 07 Start

`marketplace.contractor_profiles` and `marketplace.supplier_profiles` were designed with `user_id UUID UNIQUE`. Now that companies exist, update both tables to support company-owned profiles:

```sql
-- Add to marketplace.contractor_profiles
ALTER TABLE marketplace.contractor_profiles
  DROP CONSTRAINT contractor_profiles_user_id_key,          -- remove individual unique constraint
  ADD COLUMN company_id UUID REFERENCES identity.companies(id),
  ADD CONSTRAINT chk_contractor_profile_owner
    CHECK (
      (company_id IS NOT NULL AND user_id IS NULL) OR
      (company_id IS NULL     AND user_id IS NOT NULL)
    );
CREATE UNIQUE INDEX ON marketplace.contractor_profiles (company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX ON marketplace.contractor_profiles (user_id)    WHERE user_id    IS NOT NULL;

-- Apply the same pattern to marketplace.supplier_profiles
```

Also add `company_id UUID REFERENCES identity.companies(id)` to `marketplace.quotes` and `marketplace.contracts` so all transactional records carry the acting company context alongside the acting user.

## Blocks
- Sprint 08 (BOQ needs supplier pricing data)
