# Sprint 15 — Property Development Module
**Phase 3C | Weeks 20–26 (parallel with Sprint 07)**

## Goal
Build the property development module covering off-plan sales, developer unit mix management, staged construction payments, pre-launch marketing, snagging and defects management, and all municipality approvals tracking. Targets property developers selling off-plan residential and commercial units.

---

## Deliverables Checklist
- [ ] Developer company registration and verification
- [ ] Development project creation (site, planning, phasing)
- [ ] Unit mix configuration (types, pricing, layout plans)
- [ ] Planning permission & municipality approval tracker
- [ ] Pre-launch marketing (register interest, priority list)
- [ ] Off-plan sales workflow (reservation, OTP, completion)
- [ ] Staged construction milestones linked to buyer payment schedule
- [ ] Practical completion and snagging list management
- [ ] Defects liability period with issue tracker
- [ ] Occupation certificate workflow
- [ ] Hand-over process with digital sign-off
- [ ] Sectional scheme registration workflow (South Africa — Sectional Titles Act)

---

## Context: Off-Plan vs Existing Property

Off-plan transactions differ from existing property sales in key ways:

| Aspect | Existing Property | Off-Plan |
|--------|------------------|----------|
| Payment trigger | Transfer registration | Construction milestones |
| Risk | Title exists | Developer delivery risk |
| Inspection | Pre-purchase | At occupation certificate |
| Transfer | After OTP | After occupation certificate |
| Time | 2–4 months | 6–36 months |
| Protection (SA) | Standard | NHBRCregistration mandatory |

---

## Roles

| Role | Functionality |
|------|--------------|
| `developer` | Create and manage development projects and units |
| `buyer` | Register interest, reserve unit, manage off-plan sale |
| `agent` | Market units on behalf of developer |
| `conveyancer` | Handle transfer at project completion |
| `inspector` | Perform NHBRC-related stage inspections |
| `quantity_surveyor` | Certify construction milestones for payment release |
| `admin` | Verify developer, approve development launch |

---

## Data Models

### `construction.development_projects`
```sql
CREATE TABLE construction.development_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES identity.users(id) NOT NULL,
  developer_org_id UUID REFERENCES identity.organisations(id),
  
  -- Identity
  project_name VARCHAR(255) NOT NULL,
  project_code VARCHAR(50) UNIQUE,
  project_type VARCHAR(30) NOT NULL,   -- residential, commercial, mixed_use, retirement
  development_type VARCHAR(30),         -- sectional_title, freehold, share_block, cluster
  
  -- Location
  site_address TEXT NOT NULL,
  city VARCHAR(100),
  suburb VARCHAR(100),
  province VARCHAR(50),
  country CHAR(2) DEFAULT 'ZA',
  erf_numbers JSONB DEFAULT '[]',       -- erf/stand numbers for the development site
  coordinates JSONB,                    -- GeoJSON polygon of the site
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft',   -- draft, planning, approved, pre_launch, selling, under_construction, practical_completion, complete, cancelled
  
  -- Planning & approvals
  zoning VARCHAR(50),
  zoningApproved BOOLEAN DEFAULT FALSE,
  building_plan_approved BOOLEAN DEFAULT FALSE,
  building_plan_reference VARCHAR(100),
  environmental_approval BOOLEAN DEFAULT FALSE,
  nhbrc_project_ref VARCHAR(100),
  nhbrc_enrolled_at TIMESTAMPTZ,
  
  -- Project figures
  total_units INTEGER NOT NULL,
  units_available INTEGER,
  units_reserved INTEGER DEFAULT 0,
  units_sold INTEGER DEFAULT 0,
  
  -- Timeline
  construction_start_date DATE,
  estimated_completion_date DATE,
  actual_completion_date DATE,
  occupation_certificate_date DATE,
  
  -- Financials
  development_cost_estimate NUMERIC(18,2),
  selling_price_from NUMERIC(18,2),
  selling_price_to NUMERIC(18,2),
  currency CHAR(3) DEFAULT 'ZAR',
  
  -- Marketing
  marketing_tagline TEXT,
  description TEXT,
  brochure_url TEXT,
  site_plan_url TEXT,
  show_flat_address TEXT,
  virtual_tour_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON construction.development_projects (status, developer_id);
```

### `construction.development_phases`
```sql
CREATE TABLE construction.development_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.development_projects(id),
  phase_number SMALLINT NOT NULL,
  phase_name VARCHAR(100),
  units_in_phase INTEGER NOT NULL,
  launch_date DATE,
  completion_date DATE,
  status VARCHAR(20) DEFAULT 'planned',   -- planned, active, complete
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.development_units`
```sql
CREATE TABLE construction.development_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.development_projects(id),
  phase_id UUID REFERENCES construction.development_phases(id),
  
  -- Identity
  unit_number VARCHAR(20) NOT NULL,
  unit_type VARCHAR(50),                 -- e.g. "2 bed 2 bath", "penthouse"
  block_tower VARCHAR(20),
  floor_number SMALLINT,
  
  -- Specs
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  parking_bays SMALLINT DEFAULT 0,
  garage_count SMALLINT DEFAULT 0,
  gross_floor_area_sqm NUMERIC(8,2),
  covered_patio_sqm NUMERIC(7,2),
  
  -- Pricing
  base_price NUMERIC(18,2) NOT NULL,
  current_price NUMERIC(18,2),           -- may increase by launch date
  currency CHAR(3) DEFAULT 'ZAR',
  levies_estimate NUMERIC(8,2),
  rates_estimate NUMERIC(8,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'available', -- available, reserved, sold, not_for_sale
  
  -- Documents
  floor_plan_url TEXT,
  unit_specification_url TEXT,
  
  -- Completion
  section_number VARCHAR(20),            -- allocated on sectional plan
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON construction.development_units (project_id, status);
```

### `construction.unit_interest_registrations`
```sql
-- Pre-launch "register interest" list
CREATE TABLE construction.unit_interest_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.development_projects(id),
  user_id UUID REFERENCES identity.users(id),   -- NULL if guest
  
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  preferred_unit_types JSONB DEFAULT '[]',       -- e.g. ["2 bed", "3 bed"]
  max_budget NUMERIC(18,2),
  financing_type VARCHAR(30),                    -- cash, bond
  
  priority_rank INTEGER,                        -- assigned for priority selection window
  invited_to_pre_launch BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.unit_reservations`
```sql
CREATE TABLE construction.unit_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID UNIQUE REFERENCES construction.development_units(id),
  buyer_id UUID REFERENCES identity.users(id),
  agent_id UUID REFERENCES identity.users(id),
  
  reservation_fee NUMERIC(10,2) NOT NULL,
  reservation_fee_paid BOOLEAN DEFAULT FALSE,
  reservation_expires_at TIMESTAMPTZ NOT NULL,  -- typically 48–72 hours
  
  status VARCHAR(20) DEFAULT 'pending',   -- pending, confirmed, lapsed, converted_to_sale, cancelled
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.development_sales`
```sql
-- Extends `sales.property_sales` with off-plan-specific fields
CREATE TABLE construction.development_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID UNIQUE REFERENCES sales.property_sales(id),
  unit_id UUID UNIQUE REFERENCES construction.development_units(id),
  project_id UUID REFERENCES construction.development_projects(id),
  developer_id UUID REFERENCES identity.users(id),
  
  -- Payment schedule (off-plan OTP typically has milestone payments)
  deposit_pct NUMERIC(5,2),              -- % paid at signing (typically 10%)
  deposit_amount NUMERIC(18,2),
  milestone_payments JSONB DEFAULT '[]', -- [{stage: "foundation", pct: 10, due_date: "2025-03-01"}]
  
  -- Occupation target
  estimated_occupation_date DATE,
  actual_occupation_date DATE,
  
  -- Occupation certificate
  occupation_certificate_url TEXT,
  occupation_certificate_number VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.municipality_approvals`
```sql
CREATE TABLE construction.municipality_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.development_projects(id),
  
  approval_type VARCHAR(100) NOT NULL,
  -- Examples: zoning_approval, building_plan_approval, environmental_impact, 
  --           fire_clearance, water_services_agreement, electricity_agreement,
  --           roads_approval, township_establishment, occupation_certificate

  reference_number VARCHAR(100),
  submitted_at DATE,
  approved_at DATE,
  expires_at DATE,
  
  status VARCHAR(20) DEFAULT 'not_submitted', -- not_submitted, submitted, under_review, approved, rejected, expired
  
  documents JSONB DEFAULT '[]',       -- [{name, url, uploaded_at}]
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.snagging_lists`
```sql
CREATE TABLE construction.snagging_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES construction.development_units(id),
  buyer_id UUID REFERENCES identity.users(id),
  developer_id UUID REFERENCES identity.users(id),
  
  inspection_date DATE,
  status VARCHAR(20) DEFAULT 'open',    -- open, in_progress, resolved, accepted
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.snagging_items`
```sql
CREATE TABLE construction.snagging_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snag_list_id UUID REFERENCES construction.snagging_lists(id),
  
  location_description VARCHAR(255),     -- e.g. "master bedroom - north wall"
  defect_description TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'minor',  -- minor, major, critical
  
  photo_urls JSONB DEFAULT '[]',
  
  status VARCHAR(20) DEFAULT 'open',     -- open, disputed, resolved, verified
  assigned_to VARCHAR(255),              -- contractor/subcontractor name
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.defects_liability_claims`
```sql
-- SA NHBRC and Defects Liability Period (typically 3–5 years)
CREATE TABLE construction.defects_liability_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES construction.development_units(id),
  project_id UUID REFERENCES construction.development_projects(id),
  claimed_by UUID REFERENCES identity.users(id),
  
  claim_number VARCHAR(50) UNIQUE,
  defect_type VARCHAR(50),    -- structural, waterproofing, latent, patent
  description TEXT NOT NULL,
  discovery_date DATE,
  
  photo_urls JSONB DEFAULT '[]',
  
  -- Escalation
  routed_to VARCHAR(50),       -- developer, nhbrc, insurance
  nhbrc_case_number VARCHAR(100),
  
  status VARCHAR(20) DEFAULT 'submitted', -- submitted, investigating, approved, rejected, remediated
  resolution_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Development Milestone → Payment Schedule

```typescript
interface DevelopmentMilestone {
  stage: string;
  pct: number;          // % of purchase price due
  dueWhen: string;      // trigger: "on_slab", "on_roof"
  amount: number;       // calculated amount
  paidAt?: string;
}

// Typical SA off-plan payment schedule:
const TYPICAL_MILESTONE_SCHEDULE = [
  { stage: 'otp_signed',       pct: 10, dueWhen: 'on_signing' },
  { stage: 'mortgage_granted', pct: 0,  dueWhen: 'bond_approval' },   // no extra payment, confirms financing
  { stage: 'occupation',       pct: 90, dueWhen: 'occupation_certificate' },
];
```

---

## API Endpoints

### Development Projects
```
POST /api/v1/developments                           [developer]
GET  /api/v1/developments?city=&type=&status=       [public]
GET  /api/v1/developments/:id                       [public]
PATCH /api/v1/developments/:id                      [developer(owner)]
POST /api/v1/admin/developments/:id/approve         [admin]
POST /api/v1/admin/developments/:id/launch          [admin]
```

### Units
```
POST /api/v1/developments/:id/units                 [developer]
GET  /api/v1/developments/:id/units?status=         [public — available only; all for dev]
GET  /api/v1/developments/:id/units/:unitId         [public]
PATCH /api/v1/developments/:id/units/:unitId        [developer]
```

### Interest & Reservations
```
POST /api/v1/developments/:id/register-interest     [public]
POST /api/v1/developments/:id/units/:unitId/reserve [authenticated buyer, agent]
POST /api/v1/developments/:id/units/:unitId/reservation/extend [developer]
POST /api/v1/developments/:id/units/:unitId/reservation/cancel [buyer, developer]
```

### Municipality Approvals
```
POST  /api/v1/developments/:id/approvals            [developer]
GET   /api/v1/developments/:id/approvals            [developer, admin, conveyancer]
PATCH /api/v1/developments/:id/approvals/:aId       [developer]
```

### Snagging
```
POST  /api/v1/developments/:id/units/:unitId/snag-list       [buyer]
GET   /api/v1/developments/:id/units/:unitId/snag-list       [buyer, developer]
POST  /api/v1/snag-lists/:listId/items                       [buyer]
PATCH /api/v1/snag-lists/:listId/items/:itemId               [developer]
POST  /api/v1/snag-lists/:listId/items/:itemId/resolve       [developer]
POST  /api/v1/snag-lists/:listId/items/:itemId/verify        [buyer] — buyer confirms fix
POST  /api/v1/snag-lists/:listId/accept                      [buyer] — accepts unit
```

### Defects Claims
```
POST /api/v1/defects-claims                         [buyer]
GET  /api/v1/defects-claims?projectId=              [developer, admin, nhbrc_liaison]
PATCH /api/v1/defects-claims/:id                    [developer, admin]
```

---

## Sectional Scheme Registration (South Africa)

```
Property sold off-plan → Occupation certificate issued
→ Surveyor prepares sectional plan
→ Sectional plan lodged at Deeds Office
→ Section numbers allocated to units
→ Individual title deeds (sectional title) registered per unit
```

These steps are tracked via `municipality_approvals` with approval_type values:
- `sectional_plan_preparation`  
- `sectional_plan_lodged`  
- `sectional_plan_approved`  
- `title_deed_per_unit`  

---

## Acceptance Criteria

- [ ] Developer can create a development project, add phases, and populate units
- [ ] Units appear in main property search with `off_plan` badge
- [ ] Interest registration list with priority rank management works for pre-launch
- [ ] Unit reservation enforces expiry window (48h default) with auto-release on lapse
- [ ] Development sale links to `sales.property_sales` using off-plan sale type
- [ ] Milestone payment schedule generated from unit price at OTP signing
- [ ] Snagging list created by buyer after receiving keys; each item tracked to resolution
- [ ] NHBRC defects claim routable to developer or escalated to NHBRC
- [ ] Municipality approval tracker sends alerts for approaching expiry dates
- [ ] Sectional title milestones trackable through `municipality_approvals` table

---

## Dependencies
- Sprint 02 (developer role, org accounts)
- Sprint 03 (property listings — dev units appear as a listing type)
- Sprint 04 / Sprint 04 Enhanced (sales pipeline — development_sales extends it)
- Sprint 06 (construction project milestones)
- Sprint 13 (mandate exempt for off-plan — developer sells direct)

## Blocks
- Sprint 09 Enhanced (NHBRC inspection requirements per development stage)
