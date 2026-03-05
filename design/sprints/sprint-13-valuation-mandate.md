# Sprint 13 — Property Valuation & Mandate System
**Phase 2B | Weeks 13–17 (runs in parallel with Sprint 04)**

## Goal
Build the formal property valuation workflow, agent mandate management system, and pre-listing preparation tools. These features exist between listing creation (Sprint 03) and sales progression (Sprint 04) — they represent the professional workflow a property goes through **before** an offer is submitted.

---

## Deliverables Checklist
- [ ] Licensed valuer profile and registration
- [ ] Formal valuation request workflow
- [ ] Valuation report upload, storage, and linkage to listing
- [ ] Automated comparable sales pulling (within configurable radius)
- [ ] CMA (Comparative Market Analysis) tool for agents
- [ ] Agent mandate creation (Sole / Open) with digital e-signature
- [ ] Mandate enforcement rules (duplicate sole mandate prevention)
- [ ] Mandate expiry tracking and renewal alerts
- [ ] Seller preparation checklist (documents before listing)
- [ ] Property listing approval workflow (seller signs off on listing content)
- [ ] Commission split configuration at brokerage level
- [ ] Agent CRM integration (mandate linked to lead → listing → sale)

---

## Context: Pre-Listing Workflow

```
Seller Intent → Seller Onboarding → Document Prep → Valuation → Mandate → Listing → Marketing
```

All of these steps happen before an offer is placed. This sprint builds the tooling for these pre-listing stages.

---

## Data Models

### `property.valuer_profiles`
```sql
CREATE TABLE property.valuer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  registration_number VARCHAR(100) NOT NULL,     -- SACPVP registration (SA) or equivalent
  issuing_body VARCHAR(255) NOT NULL,            -- e.g. "South African Council for the Property Valuers Profession"
  specializations JSONB DEFAULT '[]',            -- ["residential", "commercial", "agricultural", "industrial"]
  service_areas JSONB DEFAULT '[]',              -- [{country, region, city}]
  experience_years SMALLINT,
  qualifications JSONB DEFAULT '[]',             -- [{name, institution, year}]
  professional_indemnity_url TEXT,               -- PI insurance certificate
  professional_indemnity_expiry DATE,
  bank_panels JSONB DEFAULT '[]',                -- which banks accept this valuer ["absa","fnb","standard_bank"]
  licence_document_url TEXT,
  licence_expiry DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0,
  total_valuations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.valuation_requests`
```sql
CREATE TABLE property.valuation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference VARCHAR(50) UNIQUE NOT NULL,
  property_id UUID REFERENCES property.properties(id),
  requester_id UUID REFERENCES identity.users(id),   -- seller or agent
  purpose VARCHAR(30) NOT NULL,                      -- listing_price, bond_application, insurance, legal, estate
  valuation_type VARCHAR(20) NOT NULL,               -- formal, cma
  preferred_valuer_id UUID REFERENCES identity.users(id),
  assigned_valuer_id UUID REFERENCES identity.users(id),
  preferred_dates JSONB DEFAULT '[]',
  scheduled_date TIMESTAMPTZ,
  access_instructions TEXT,
  budget_estimate NUMERIC(10,2),                     -- how much they expect to pay for valuation
  status VARCHAR(20) DEFAULT 'requested',            -- requested, assigned, scheduled, site_visited, report_submitted, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.valuations`
```sql
CREATE TABLE property.valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES property.valuation_requests(id),
  property_id UUID REFERENCES property.properties(id),
  valuer_id UUID REFERENCES identity.users(id),
  valuation_type VARCHAR(20) NOT NULL,               -- formal, cma
  
  -- Value
  market_value NUMERIC(18,2) NOT NULL,
  market_value_low NUMERIC(18,2),
  market_value_high NUMERIC(18,2),
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  price_per_sqm NUMERIC(10,2),
  
  -- Comparables
  comparables JSONB DEFAULT '[]',  -- [{address, sale_price, sale_date, area_sqm, similarity_pct}]
  
  -- Assessment
  property_condition VARCHAR(20),   -- excellent, good, fair, poor
  methodology VARCHAR(50),          -- direct_comparison, income_capitalisation, cost
  adjustments JSONB DEFAULT '[]',   -- [{factor, adjustment_pct, reason}]
  
  -- Context
  valuation_date DATE NOT NULL,
  site_visit_at TIMESTAMPTZ,
  valuer_lat NUMERIC(9,6),
  valuer_lng NUMERIC(9,6),
  
  -- Document
  report_document_url TEXT,
  is_bank_accepted BOOLEAN DEFAULT FALSE,
  bank_reference VARCHAR(100),        -- bank's own reference if submitted with bond application
  
  -- Certification
  hash VARCHAR(64),                   -- SHA-256 of report for immutability
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON property.valuations (property_id, valuation_type, valuation_date);
```

### `property.mandates`
*(Defined in Sprint 03 Enhanced — reproduced here for completeness)*
```sql
-- See sprint-03-property-marketplace_enhanced.md for full schema
-- Key additions to enforce:
-- 1. Sole mandate: UNIQUE(property_id, status) where status = 'active'
-- 2. Mandate type: sole mandates enforce commission even on direct sale
-- 3. Commission structure: % rate + VAT handling + split with brokerage
```

### `property.mandate_commissions`
```sql
CREATE TABLE property.mandate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES property.mandates(id),
  agent_commission_pct NUMERIC(5,2) NOT NULL,     -- agent's personal cut (if part of brokerage)
  brokerage_commission_pct NUMERIC(5,2),          -- brokerage's cut (0 if sole trader)
  platform_commission_pct NUMERIC(5,2) DEFAULT 1.5,  -- platform fee
  referral_agent_id UUID REFERENCES identity.users(id),  -- if introduced by another agent
  referral_split_pct NUMERIC(5,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 15.0,             -- % — varies by country
  total_commission_pct GENERATED ALWAYS AS (
    agent_commission_pct + COALESCE(brokerage_commission_pct, 0) + platform_commission_pct + referral_split_pct
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `property.seller_checklists`
```sql
CREATE TABLE property.seller_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  seller_id UUID REFERENCES identity.users(id),
  item_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(50),          -- document, action, decision
  is_required BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed, not_applicable
  document_url TEXT,
  due_date DATE,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Seed items: title_deed, survey_diagram, rates_clearance, approved_building_plans, 
--             compliance_certificates, bond_cancellation_consent, seller_disclosure_form
```

### `property.listing_approvals`
```sql
CREATE TABLE property.listing_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  seller_id UUID REFERENCES identity.users(id),
  submitted_by_agent UUID REFERENCES identity.users(id),
  content_snapshot JSONB NOT NULL,     -- full listing content at time of submission for approval
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected_with_changes
  seller_feedback TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## CMA Tool for Agents

The Comparative Market Analysis (CMA) is an informal pricing guide agents prepare for sellers.

### Auto-CMA Generation
When an agent requests a CMA:
1. Pull all `property.comparable_sales` within 2km (configurable) of the property
2. Filter by: same property type, similar size (±20%), sold in last 12 months
3. Adjust for differences: bedrooms, bathrooms, pool, garage, condition
4. Calculate adjusted price per sqm for each comp
5. Generate estimate: median adjusted price × subject property area

### `property.cma_reports`
```sql
CREATE TABLE property.cma_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  agent_id UUID REFERENCES identity.users(id),
  comparables_used JSONB NOT NULL,            -- selected comparables with adjustments
  suggested_list_price NUMERIC(18,2) NOT NULL,
  suggested_price_low NUMERIC(18,2),
  suggested_price_high NUMERIC(18,2),
  market_commentary TEXT,
  days_on_market_estimate SMALLINT,
  methodology_notes TEXT,
  report_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Mandate Enforcement Engine

### Rules Enforced at Application Layer

```typescript
// Sole mandate conflict prevention
async function canCreateMandate(propertyId: string, type: 'sole' | 'open'): Promise<boolean> {
  if (type === 'open') return true;

  const activeMandate = await db.query(`
    SELECT id FROM property.mandates 
    WHERE property_id = $1 
    AND mandate_type = 'sole' 
    AND status = 'active'
    AND end_date >= NOW()
  `, [propertyId]);

  return activeMandate.rows.length === 0;  // false if active sole mandate exists
}
```

### Mandate Expiry Workflow
- **7 days before expiry**: Email to agent and seller — "Your mandate expires in 7 days. Renew or let expire?"
- **1 day before expiry**: Final reminder
- **On expiry**: `status` → `expired`; system event `mandate.expired` emitted
- **If sole mandate expires**: Block removed — property can be listed by other agents

---

## API Endpoints

### Valuers
```
POST /api/v1/valuers/profile                           [user with 'valuer' role]
GET  /api/v1/valuers?country=ZA&bank_panel=absa        [public]
GET  /api/v1/valuers/:id
POST /api/v1/admin/valuers/:id/verify                  [admin]
```

### Valuation Requests
```
POST /api/v1/properties/:id/valuation-request          [seller, agent]
GET  /api/v1/properties/:id/valuations                 [seller, agent, conveyancer, bank_officer]
POST /api/v1/valuation-requests/:id/assign             [admin]
PATCH /api/v1/valuation-requests/:id/schedule          [valuer]
POST /api/v1/valuation-requests/:id/submit-report      [valuer]
GET  /api/v1/valuers/me/requests                       [valuer] — own assignments
```

### CMA
```
POST /api/v1/properties/:id/cma                        [agent]
GET  /api/v1/properties/:id/cma                        [agent, seller]
GET  /api/v1/properties/:id/comparable-sales           [agent, valuer, admin]
```

### Mandates
```
POST  /api/v1/properties/:id/mandate                   [agent]
GET   /api/v1/properties/:id/mandate                   [agent (own), seller, admin]
POST  /api/v1/mandates/:id/sign                        [seller or agent depending on role]
PATCH /api/v1/mandates/:id/cancel                      [agent, seller, admin]
PATCH /api/v1/mandates/:id/renew                       [agent]
GET   /api/v1/agent/mandates                           [agent] — own active mandates
GET   /api/v1/agent/mandates/expiring                  [agent] — mandates expiring in 14 days
```

### Seller Checklist
```
GET   /api/v1/properties/:id/seller-checklist          [seller, agent]
PATCH /api/v1/properties/:id/seller-checklist/:itemId  [seller]
```

### Listing Approval
```
POST  /api/v1/properties/:id/listing-approval          [agent] — submit for seller review
POST  /api/v1/properties/:id/listing-approval/:id/approve   [seller]
POST  /api/v1/properties/:id/listing-approval/:id/reject    [seller]
```

---

## Notification Triggers

| Event | Recipients |
|-------|----------|
| Valuation request submitted | Assigned valuer + platform admin |
| Valuation report uploaded | Seller, requesting agent |
| Mandate created (pending signature) | Seller — sign request |
| Mandate activated (signed) | Agent + brokerage admin |
| Mandate expiring in 7 days | Agent + seller |
| Mandate expired | Agent + seller + platform |
| Listing submitted for seller approval | Seller |
| Seller approved listing | Agent |
| Seller rejected listing with changes | Agent + comments |

---

## Acceptance Criteria

- [ ] Valuer profile requires licence number and PI insurance — admin verifies before activation
- [ ] Valuation request assigned to valuer within 24 hours (or auto-matched by service area)
- [ ] Formal valuation report cannot be uploaded without completed site visit geo-tag
- [ ] CMA auto-generates with at least 3 comparable sales (error if insufficient data)
- [ ] Sole mandate creation blocked if active sole mandate exists for same property
- [ ] Mandate e-signature flow completes within one session (DocuSign/HelloSign)
- [ ] Mandate expiry alerts fire reliably at 7, 1 day(s) before
- [ ] Seller checklist auto-seeded for standard property types on listing creation
- [ ] Listing approval workflow requires seller signature before status moves to `active`

---

## Dependencies
- Sprint 02 + Sprint 02 Enhanced (valuer role, org accounts, professional licences)
- Sprint 03 + Sprint 03 Enhanced (property listing models, viewing scheduler)

## Blocks
- Sprint 04 Enhanced (formal valuation linked to bond application in sales pipeline)
- Sprint 14 (Mortgage module uses formal valuations for bond submission)
