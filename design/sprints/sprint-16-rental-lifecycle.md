# Sprint 16 — Rental Lifecycle & AI-Powered Tenancy Management
**Phase 3D | Weeks 22–30 (after Sprint 05 Escrow is stable)**

## Goal
Build a full rental lifecycle module covering landlord property management, tenant onboarding and screening, digital lease generation, rent collection, maintenance workflows, and inspections — enhanced with AI-driven dynamic pricing, lease abstraction, and predictive maintenance sourced from the AI Real Estate PM Blueprint.

---

## Deliverables Checklist
- [ ] Landlord property portfolio management
- [ ] Rental listing creation (differs from sale listing)
- [ ] Tenant application form + credit/background check workflow
- [ ] Multi-applicant comparison (landlord dashboard)
- [ ] Digital lease generation with AI clause library
- [ ] Lease signature workflow (DocuSign-style e-signature)
- [ ] Rent collection via escrow wallet (recurring billing)
- [ ] Rent receipts and payment history ledger
- [ ] Late payment escalation (notices, blacklisting)
- [ ] Maintenance request system with contractor dispatch
- [ ] Entry / exit inspection reports with photos
- [ ] Lease renewal workflow with auto-negotiation
- [ ] Lease termination and deposit reconciliation
- [ ] AI dynamic pricing (ML-driven rent optimisation)
- [ ] AI lease abstraction (NLP extraction of key terms)
- [ ] Predictive maintenance based on property age + IoT data
- [ ] Tenant portal (mobile + web)
- [ ] Bulk portfolio view for managing agents / landlords with multiple units

---

## Roles

| Role | Functionality |
|------|--------------|
| `landlord` | Create rental listings, screen tenants, manage leases and maintenance |
| `tenant` | Apply, sign lease, pay rent, log maintenance |
| `agent` | Manage rental on behalf of landlord (property management mandate) |
| `inspector` | Conduct entry/exit inspections |
| `contractor` | Receive and complete maintenance jobs |

---

## Data Models

### `rental.rental_listings`
```sql
CREATE TABLE rental.rental_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  landlord_id UUID REFERENCES identity.users(id),
  managing_agent_id UUID REFERENCES identity.users(id),  -- NULL if self-managed
  
  -- Listing details
  listing_type VARCHAR(20) DEFAULT 'residential',    -- residential, commercial, industrial
  monthly_rent NUMERIC(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'ZAR',
  deposit_months SMALLINT DEFAULT 2,                 -- typical SA: 1-2 months
  deposit_amount NUMERIC(10,2),
  advance_rent_required SMALLINT DEFAULT 1,          -- months paid upfront
  
  -- Availability
  available_from DATE NOT NULL,
  minimum_lease_months SMALLINT DEFAULT 12,
  pets_allowed BOOLEAN DEFAULT FALSE,
  smokers_allowed BOOLEAN DEFAULT FALSE,
  
  -- Included utilities
  water_included BOOLEAN DEFAULT FALSE,
  electricity_included BOOLEAN DEFAULT FALSE,
  internet_included BOOLEAN DEFAULT FALSE,
  
  -- AI pricing
  ai_suggested_rent NUMERIC(10,2),
  ai_pricing_basis TEXT,                             -- e.g. "comparable listings, vacancy rates"
  ai_pricing_updated_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',                -- draft, active, let, withdrawn
  
  view_count INTEGER DEFAULT 0,
  enquiry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `rental.tenant_applications`
```sql
CREATE TABLE rental.tenant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES rental.rental_listings(id),
  applicant_id UUID REFERENCES identity.users(id),
  
  -- Personal
  full_name VARCHAR(255) NOT NULL,
  id_number VARCHAR(50),
  nationality VARCHAR(50),
  
  -- Current situation
  current_address TEXT,
  current_landlord_name VARCHAR(255),
  current_landlord_contact VARCHAR(100),
  current_rent NUMERIC(10,2),
  reason_for_moving TEXT,
  
  -- Employment
  employment_status VARCHAR(30),
  employer_name VARCHAR(255),
  monthly_income NUMERIC(12,2),
  
  -- Additional occupants (also fill application fields)
  co_applicants JSONB DEFAULT '[]',      -- [{name, id_number, relationship, income}]
  pets JSONB DEFAULT '[]',               -- [{type, breed, weight_kg}]
  
  -- Screening
  credit_check_consented BOOLEAN DEFAULT FALSE,
  credit_check_status VARCHAR(20),       -- pending, passed, failed, not_run
  credit_score INTEGER,
  background_check_status VARCHAR(20),
  rental_blacklist_checked BOOLEAN DEFAULT FALSE,
  rental_blacklist_clear BOOLEAN,
  
  -- Landlord decision
  status VARCHAR(20) DEFAULT 'submitted',  -- submitted, reviewing, approved, declined, withdrawn
  landlord_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `rental.leases`
```sql
CREATE TABLE rental.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_reference VARCHAR(50) UNIQUE NOT NULL,
  
  listing_id UUID REFERENCES rental.rental_listings(id),
  application_id UUID REFERENCES rental.tenant_applications(id),
  property_id UUID REFERENCES property.properties(id),
  landlord_id UUID REFERENCES identity.users(id),
  managing_agent_id UUID REFERENCES identity.users(id),
  
  -- Parties
  tenant_ids JSONB NOT NULL,             -- primary + co-tenants (user IDs)
  
  -- Terms
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  monthly_rent NUMERIC(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'ZAR',
  deposit_amount NUMERIC(10,2) NOT NULL,
  deposit_account_id UUID REFERENCES financial.escrow_accounts(id),  -- held in escrow
  annual_escalation_pct NUMERIC(5,2),    -- e.g. 10%
  
  -- Generated lease document
  lease_document_url TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model_used VARCHAR(50),
  
  -- Signature tracking
  landlord_signed_at TIMESTAMPTZ,
  tenant_signed_at TIMESTAMPTZ,
  agent_witnessed_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',    -- draft, pending_signatures, active, expired, terminated, renewed
  
  renewed_from_id UUID REFERENCES rental.leases(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON rental.leases (property_id, status);
CREATE INDEX ON rental.leases (landlord_id, status);
```

### `rental.lease_clauses`
```sql
-- AI clause library — reusable, jurisdiction-specific clauses
CREATE TABLE rental.lease_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_type VARCHAR(50) NOT NULL,         -- pet_policy, smoking, maintenance, parking, utilities
  country CHAR(2) NOT NULL,
  jurisdiction VARCHAR(100),                -- "Western Cape", "Gauteng"
  clause_text TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT FALSE,       -- mandatory per local law
  is_tenant_friendly BOOLEAN,
  version SMALLINT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `rental.lease_abstractions`
```sql
-- AI-extracted key terms from uploaded lease documents (for portfolio imports)
CREATE TABLE rental.lease_abstractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rental.leases(id),
  source_document_url TEXT NOT NULL,
  
  extracted_data JSONB NOT NULL,            -- {start_date, end_date, rent, parties, clauses, obligations}
  ai_model VARCHAR(50),
  confidence_score NUMERIC(4,3),
  flagged_clauses JSONB DEFAULT '[]',       -- non-standard or risky clauses found
  
  reviewed_by UUID REFERENCES identity.users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `rental.rent_payments`
```sql
CREATE TABLE rental.rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rental.leases(id),
  tenant_id UUID REFERENCES identity.users(id),
  
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2),
  currency CHAR(3) DEFAULT 'ZAR',
  
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(30),              -- eft, debit_order, cash, platform_wallet
  payment_reference VARCHAR(100),
  
  status VARCHAR(20) DEFAULT 'pending',    -- pending, partial, paid, late, defaulted
  days_late INTEGER,
  late_fee_charged NUMERIC(8,2) DEFAULT 0,
  
  receipt_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON rental.rent_payments (lease_id, status, due_date);
```

### `rental.maintenance_requests`
```sql
CREATE TABLE rental.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rental.leases(id),
  property_id UUID REFERENCES property.properties(id),
  submitted_by UUID REFERENCES identity.users(id),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),                    -- plumbing, electrical, structural, appliance, pest_control, security
  priority VARCHAR(20) DEFAULT 'medium',   -- low, medium, high, emergency
  
  photo_urls JSONB DEFAULT '[]',
  
  -- Dispatch
  assigned_contractor_id UUID REFERENCES identity.users(id),
  scheduled_at TIMESTAMPTZ,
  
  -- Completion
  status VARCHAR(20) DEFAULT 'open',       -- open, assigned, in_progress, completed, cancelled, disputed
  completed_at TIMESTAMPTZ,
  completion_photos JSONB DEFAULT '[]',
  tenant_satisfaction SMALLINT,            -- 1–5
  
  -- Cost
  quoted_amount NUMERIC(10,2),
  actual_amount NUMERIC(10,2),
  paid_by VARCHAR(20),                     -- landlord, tenant (if tenant damage)
  invoice_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON rental.maintenance_requests (property_id, status);
```

### `rental.property_inspections`
```sql
CREATE TABLE rental.property_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES rental.leases(id),
  property_id UUID REFERENCES property.properties(id),
  inspection_type VARCHAR(30) NOT NULL,    -- entry, exit, periodic, owner_visit
  
  scheduled_for TIMESTAMPTZ,
  conducted_by UUID REFERENCES identity.users(id),
  
  condition_summary JSONB DEFAULT '{}',    -- per-room condition ratings  
  photos JSONB DEFAULT '[]',               -- [{room, description, url, timestamp}]
  notes TEXT,
  
  tenant_signature_url TEXT,
  landlord_signature_url TEXT,
  
  status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, in_progress, completed, disputed
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `rental.deposit_reconciliations`
```sql
-- At lease end — resolved against inspection findings
CREATE TABLE rental.deposit_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID UNIQUE REFERENCES rental.leases(id),
  exit_inspection_id UUID REFERENCES rental.property_inspections(id),
  
  total_deposit NUMERIC(10,2) NOT NULL,
  
  -- Deductions
  unpaid_rent NUMERIC(10,2) DEFAULT 0,
  cleaning_charges NUMERIC(8,2) DEFAULT 0,
  damage_charges NUMERIC(8,2) DEFAULT 0,
  early_termination_penalty NUMERIC(10,2) DEFAULT 0,
  
  -- Refund
  amount_refunded NUMERIC(10,2),
  refund_initiated_at TIMESTAMPTZ,
  refund_completed_at TIMESTAMPTZ,
  
  -- SA law: must refund within 14 days of lease end
  refund_deadline DATE,
  
  status VARCHAR(20) DEFAULT 'pending',   -- pending, disputed, completed
  dispute_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## AI Dynamic Pricing Engine

From AI Blueprint Module 4:

### `rental.pricing_models`
```sql
CREATE TABLE rental.pricing_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  model_version VARCHAR(20),
  
  -- Feature inputs used in the model
  features_snapshot JSONB,               -- {sqm, bedrooms, suburb, vacancy_rate, comparable_rents, cpi}
  
  -- Model output
  current_suggested_rent NUMERIC(10,2),
  min_acceptable_rent NUMERIC(10,2),     -- floor defined by landlord
  max_tested_rent NUMERIC(10,2),         -- anchored to market ceiling
  confidence_interval JSONB,             -- {p10, p50, p90}
  
  -- Adjustment triggers
  days_on_market INTEGER,
  vacancy_pressure_score NUMERIC(4,3),   -- 0 = surplus, 1 = tight market
  
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

```typescript
// Dynamic pricing logic (conceptual; calls ML microservice in Phase 4)
interface RentPricingInput {
  propertyId: string;
  suburb: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  daysOnMarket: number;
  amenities: string[];
}

interface RentPricingOutput {
  suggestedRent: number;
  confidenceRange: { low: number; high: number };
  basis: string;               // human-readable explanation
  comparables: Comparable[];   // nearby listings used as reference
}
// Phase 1: Rule-based (median comparables + market adjustment %)
// Phase 2: XGBoost regression model trained on historical rental data
// Phase 3: RL agent adjusting based on days-to-let feedback
```

---

## AI Lease Abstraction

```typescript
// For landlords uploading existing leases for portfolio management
interface LeaseAbstractorInput {
  documentUrl: string;
  documentType: 'pdf' | 'docx';
}

interface LeaseAbstractorOutput {
  startDate: string;
  endDate: string;
  monthlyRent: number;
  currency: string;
  tenantNames: string[];
  landlordName: string;
  propertyAddress: string;
  depositAmount: number;
  escalationPct?: number;
  clauses: { type: string; summary: string; riskLevel: 'low' | 'medium' | 'high' }[];
  flaggedIssues: string[];
  confidenceScore: number;
}
// Implemented via LLM Gateway (Sprint 11) with prompt-chained OCR + extraction
```

---

## Predictive Maintenance (IoT Integration Path)

From AI Blueprint Module 5:

### Phase 1 (Rule-based):
- Flag properties where maintenance category has > 3 repeated issues in 12 months
- Alert when property > 15 years old + no electrical inspection in last 5 years

### Phase 2 (ML):
```sql
-- TimescaleDB hypertable for IoT readings (Phase 4+)
-- CREATE TABLE rental.iot_sensor_readings (
--   property_id UUID NOT NULL,
--   sensor_id VARCHAR(100) NOT NULL,
--   sensor_type VARCHAR(50),   -- temperature, humidity, water_pressure, power_consumption
--   value NUMERIC(12,4),
--   recorded_at TIMESTAMPTZ NOT NULL
-- );
-- SELECT create_hypertable('rental.iot_sensor_readings', 'recorded_at');
```

### Anomaly triggers (Prophet model output → maintenance_requests):
- Water pressure drop → potential pipe leak
- Power consumption spike → electrical fault
- Humidity sustained > 80% → mould risk

---

## API Endpoints

### Listings
```
POST /api/v1/rental/listings                        [landlord, agent]
GET  /api/v1/rental/listings?city=&bedrooms=&rent=  [public]
GET  /api/v1/rental/listings/:id                    [public]
PATCH /api/v1/rental/listings/:id                   [landlord, agent(mandate)]
GET  /api/v1/rental/listings/:id/pricing-suggestion [landlord, agent] — AI pricing
```

### Applications
```
POST  /api/v1/rental/listings/:id/applications      [authenticated user]
GET   /api/v1/rental/listings/:id/applications      [landlord, agent]
GET   /api/v1/rental/applications/me                [tenant (own)]
PATCH /api/v1/rental/applications/:id/decision      [landlord, agent]
```

### Leases
```
POST  /api/v1/rental/leases/generate                [landlord, agent] — AI-generated draft
GET   /api/v1/rental/leases/:id                     [landlord, tenant, agent, admin]
POST  /api/v1/rental/leases/:id/sign                [landlord | tenant — scoped by role]
POST  /api/v1/rental/leases/:id/renew               [landlord]
POST  /api/v1/rental/leases/:id/terminate           [landlord, tenant]
POST  /api/v1/rental/leases/abstract                [landlord, agent] — AI abstraction
```

### Rent Collection
```
GET  /api/v1/rental/leases/:id/payments             [landlord, tenant, agent]
POST /api/v1/rental/leases/:id/payments/record      [landlord, agent]  — manual record
POST /api/v1/rental/leases/:id/payments/debit-order  [tenant] — set up recurring
GET  /api/v1/rental/payments/overdue                [landlord (own), admin]
```

### Maintenance
```
POST /api/v1/rental/maintenance-requests            [tenant, landlord]
GET  /api/v1/rental/maintenance-requests?propertyId=[landlord, agent, admin]
GET  /api/v1/rental/maintenance-requests/me         [tenant]
PATCH /api/v1/rental/maintenance-requests/:id       [landlord, contractor]
POST /api/v1/rental/maintenance-requests/:id/complete [contractor]
```

### Inspections & Deposit
```
POST  /api/v1/rental/leases/:id/inspections         [landlord, agent, inspector]
GET   /api/v1/rental/leases/:id/inspections         [landlord, tenant, agent]
PATCH /api/v1/rental/leases/:id/inspections/:iId    [inspector]

POST  /api/v1/rental/leases/:id/deposit/reconcile   [landlord, agent]
GET   /api/v1/rental/leases/:id/deposit/reconcile   [landlord, tenant]
POST  /api/v1/rental/leases/:id/deposit/dispute     [tenant]
```

---

## Acceptance Criteria

- [ ] Rental listing clearly differentiated from sale listing in search
- [ ] Tenant application includes credit check consent and background check workflow
- [ ] Lease generated by AI using jurisdiction-appropriate clause library
- [ ] Both parties can e-sign lease digitally; unsigned lease cannot go `active`
- [ ] Deposit held in escrow until lease terminates
- [ ] AI rent pricing suggestion generated and visible to landlord on listing
- [ ] Maintenance requests receive status updates via notification
- [ ] Entry inspection photo report linked to lease and stored immutably
- [ ] Deposit reconciliation guided by exit inspection findings
- [ ] Deposit refund deadline computed per SA law (14 days); alert fires at day 10
- [ ] AI lease abstraction returns > 80% field extraction accuracy on standard SA leases

---

## Dependencies
- Sprint 02 Enhanced (landlord, tenant roles; org accounts for property management companies)
- Sprint 03 (property.properties — listings reference it)
- Sprint 05 (escrow — deposit held in escrow_accounts)
- Sprint 07 (contractor marketplace — maintenance dispatch)
- Sprint 09 (inspections — entry/exit linked to inspection module)
- Sprint 11 (AI/LLM gateway — powers lease generation + abstraction + pricing)

## Blocks
- Sprint 17 (Market Intelligence uses rental listing data for price index)
