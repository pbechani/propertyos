# Sprint 14 — Mortgage & Financing Module
**Phase 3B | Weeks 18–23 (runs in parallel with Sprint 05)**

## Goal
Build the mortgage / bond application module: pre-qualification calculator, multi-bank application submission, loan status tracking, bank coordination with conveyancer, and integration with the 16-stage sales pipeline. This is a critical piece of the SA property market — most residential purchases use bond financing.

---

## Deliverables Checklist
- [ ] Mortgage affordability / pre-qualification calculator
- [ ] Mortgage broker profile and registration
- [ ] Bond application form with document uploader
- [ ] Multi-bank concurrent submission engine
- [ ] Loan status tracking dashboard (buyer + broker view)
- [ ] Bank-appointed valuation coordination
- [ ] Grant certificate generation and distribution
- [ ] Automated notifications at each status change
- [ ] Interest rate comparison across lenders
- [ ] Integration with `sales.bond_applications` (Sprint 04 Enhanced)
- [ ] OTP suspensive condition auto-resolution on bond approval

---

## Context: Where Bond Fits in the Transaction

```
OTP Signed (Stage 5) → Bond Application Submitted (Stage 7) 
→ Bank Valuation (within Stage 9) → Bond Approved (Stage 10) 
→ Transfer proceeds...
```

The bond application is a **suspensive condition** on the OTP. If declined (and bond was a condition), the deal dissolves. If approved, Stage 10 is marked complete and the process continues.

---

## Roles

| Role | Functionality |
|------|--------------|
| `buyer` | Submit application, track status, upload docs |
| `mortgage_broker` | Create application, submit to banks, track on behalf of buyer |
| `bank_officer` | Review applications within their bank's portal |
| `conveyancer` | Receive bond grant certificate, coordinate with bond attorney |
| `agent` | View bond status for the sale they manage |

---

## Data Models

### `financial.mortgage_profiles`
```sql
CREATE TABLE financial.mortgage_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  
  -- Employment
  employment_type VARCHAR(30),          -- salaried, self_employed, contract, retired, unemployed
  employer_name VARCHAR(255),
  employment_start_date DATE,
  gross_monthly_income NUMERIC(12,2),
  net_monthly_income NUMERIC(12,2),
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  
  -- Existing obligations
  existing_bond_repayments NUMERIC(10,2) DEFAULT 0,
  car_repayments NUMERIC(10,2) DEFAULT 0,
  credit_card_limits NUMERIC(10,2) DEFAULT 0,
  store_card_limits NUMERIC(10,2) DEFAULT 0,
  other_debt_repayments NUMERIC(10,2) DEFAULT 0,
  
  -- Credit
  credit_score INTEGER,                 -- Transunion/Experian score
  credit_bureau VARCHAR(50),            -- "transunion", "experian"
  credit_checked_at TIMESTAMPTZ,
  
  -- Dependants
  number_of_dependants SMALLINT DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `financial.pre_qualifications`
```sql
CREATE TABLE financial.pre_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  broker_id UUID REFERENCES identity.users(id),   -- NULL if self-done via calculator
  
  -- Inputs
  gross_income NUMERIC(12,2) NOT NULL,
  existing_obligations NUMERIC(10,2) DEFAULT 0,
  deposit_available NUMERIC(12,2) DEFAULT 0,
  interest_rate_assumption NUMERIC(6,4),          -- current prime + spread
  term_years SMALLINT DEFAULT 20,
  
  -- Outputs
  max_loan_amount NUMERIC(18,2),
  max_property_value NUMERIC(18,2),              -- loan + deposit
  estimated_repayment NUMERIC(10,2),             -- monthly bond repayment
  ltv_ratio NUMERIC(5,4),                        -- loan-to-value
  debt_service_ratio NUMERIC(5,4),               -- total obligations / gross income
  
  -- Certificate
  certificate_url TEXT,
  valid_until DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `financial.mortgage_brokers`
```sql
CREATE TABLE financial.mortgage_brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  business_name VARCHAR(255),
  fsp_number VARCHAR(100),                  -- Financial Service Provider number (SA requirement)
  originator_name VARCHAR(100),             -- e.g. "ooba", "BetterBond", "SA Home Loans"
  banks_accredited JSONB DEFAULT '[]',      -- which banks they can submit to
  service_areas JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  approval_rate NUMERIC(5,4),              -- % of applications approved
  avg_approval_days NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `financial.bond_applications`
```sql
CREATE TABLE financial.bond_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_reference VARCHAR(50) UNIQUE NOT NULL,
  
  -- Links
  sale_id UUID REFERENCES sales.property_sales(id),
  buyer_id UUID REFERENCES identity.users(id),
  broker_id UUID REFERENCES identity.users(id),   -- NULL if no broker
  property_id UUID REFERENCES property.properties(id),
  
  -- Application details
  loan_amount_requested NUMERIC(18,2) NOT NULL,
  deposit_amount NUMERIC(18,2) DEFAULT 0,
  property_purchase_price NUMERIC(18,2) NOT NULL,
  ltv_pct NUMERIC(5,2),                           -- loan-to-value %
  term_years SMALLINT,
  repayment_type VARCHAR(20) DEFAULT 'annuity',   -- annuity, interest_only
  
  -- Outcomes
  status VARCHAR(30) DEFAULT 'in_progress',       -- in_progress, approved, declined, withdrawn
  approved_amount NUMERIC(18,2),
  approved_interest_rate NUMERIC(6,4),
  approved_term_years SMALLINT,
  monthly_repayment NUMERIC(10,2),
  conditions_text TEXT,
  declined_reasons JSONB DEFAULT '[]',
  
  -- Timeline
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  -- Documents
  grant_certificate_url TEXT,                     -- bank's formal bond grant
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `financial.bank_submissions`
```sql
-- Each row = one bank's application within a bond_application batch
CREATE TABLE financial.bank_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_application_id UUID REFERENCES financial.bond_applications(id),
  bank_name VARCHAR(100) NOT NULL,               -- "Standard Bank", "ABSA", "FNB", "Nedbank"
  bank_reference VARCHAR(255),                   -- bank's internal reference number
  submitted_at TIMESTAMPTZ NOT NULL,
  
  -- Status per bank
  status VARCHAR(20) DEFAULT 'submitted',        -- submitted, under_review, info_requested, approved, declined
  status_updated_at TIMESTAMPTZ,
  
  -- Bank-appointed valuation
  bank_valuation_required BOOLEAN DEFAULT FALSE,
  bank_valuer_name VARCHAR(255),
  bank_valuation_value NUMERIC(18,2),
  bank_valuation_date DATE,
  
  -- Outcome
  approved_amount NUMERIC(18,2),
  interest_rate_offered NUMERIC(6,4),
  conditions JSONB DEFAULT '[]',
  declined_reason TEXT,
  
  -- Documents
  offer_letter_url TEXT,                         -- bank's offer letter
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON financial.bank_submissions (bond_application_id, status);
```

### `financial.bond_application_documents`
```sql
CREATE TABLE financial.bond_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_application_id UUID REFERENCES financial.bond_applications(id),
  document_type VARCHAR(100) NOT NULL,   -- payslip, bank_statement, id_document, tax_return, employment_letter, proof_of_address
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  period VARCHAR(20),                    -- e.g. "2024-01" for January 2024 payslip
  uploaded_by UUID REFERENCES identity.users(id),
  ai_extracted_data JSONB,              -- AI-extracted key fields from document
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `financial.interest_rate_index`
```sql
-- Track prime rate movements for affordability calculations
CREATE TABLE financial.interest_rate_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country CHAR(2) NOT NULL,
  rate_type VARCHAR(30) NOT NULL,       -- prime, repo, base
  rate_pct NUMERIC(6,4) NOT NULL,
  effective_date DATE NOT NULL,
  source VARCHAR(100),                  -- "South African Reserve Bank"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country, rate_type, effective_date)
);
```

---

## Affordability Calculator

### Formula (South Africa standard):
```typescript
interface AffordabilityInput {
  grossMonthlyIncome: number;
  existingDebtRepayments: number;    // car, credit cards, etc.
  depositAvailable: number;
  interestRatePA: number;            // e.g. 11.75
  termYears: number;                 // e.g. 20
}

interface AffordabilityResult {
  maxLoanAmount: number;
  maxPropertyValue: number;
  estimatedMonthlyRepayment: number;
  debtServiceRatio: number;           // total debt / income (should be < 0.30 for most banks)
  ltv: number;
}

function calculateAffordability(input: AffordabilityInput): AffordabilityResult {
  // Banks use 28-30% of gross income as max debt service ratio
  const maxMonthlyBondRepayment = input.grossMonthlyIncome * 0.28 - input.existingDebtRepayments;
  
  // Present value of annuity: PV = PMT × [(1 - (1+r)^-n) / r]
  const r = input.interestRatePA / 100 / 12;
  const n = input.termYears * 12;
  const maxLoan = maxMonthlyBondRepayment * ((1 - Math.pow(1 + r, -n)) / r);
  
  return {
    maxLoanAmount: Math.round(maxLoan),
    maxPropertyValue: Math.round(maxLoan + input.depositAvailable),
    estimatedMonthlyRepayment: Math.round(maxMonthlyBondRepayment),
    debtServiceRatio: (input.existingDebtRepayments + maxMonthlyBondRepayment) / input.grossMonthlyIncome,
    ltv: maxLoan / (maxLoan + input.depositAvailable)
  };
}
```

---

## Multi-Bank Submission Engine

```typescript
// When broker submits a bond application to multiple banks:
async function submitToMultipleBanks(
  bondApplicationId: string,
  banks: string[],   // ["Standard Bank", "ABSA", "FNB"]
): Promise<void> {
  const submissions = banks.map(bank => ({
    bond_application_id: bondApplicationId,
    bank_name: bank,
    submitted_at: new Date().toISOString(),
    status: 'submitted'
  }));
  
  await db.batchInsert('financial.bank_submissions', submissions);
  
  // Emit event for each bank (eventually triggers bank API integration where available)
  for (const bank of banks) {
    await messageBroker.publish('bond.submitted', { bondApplicationId, bank });
  }
}
```

### Phase 1 (MVP): Manual tracking — broker updates status for each bank manually
### Phase 2: API integrations with Standard Bank, ABSA, FNB, Nedbank direct APIs

---

## Interest Rate Comparison

```
GET /api/v1/mortgage/interest-rates?country=ZA
```

Returns current prime rate + typical spreads per bank (manually maintained until bank APIs available):
```json
{
  "prime_rate": 11.75,
  "effective_date": "2024-11-21",
  "bank_offers": [
    { "bank": "Standard Bank", "rate": "prime + 0%", "effective_rate": 11.75 },
    { "bank": "ABSA", "rate": "prime + 0.25%", "effective_rate": 12.00 },
    { "bank": "FNB", "rate": "prime - 0.25%", "effective_rate": 11.50 }
  ]
}
```

---

## Sales Pipeline Integration

When a bond application is approved:
1. `financial.bond_applications.status` → `approved`
2. Emit `bond.approved` event
3. Sales module listener:
   - Updates `sales.bond_applications.status` → `approved`
   - Marks sale Stage 10 (Bond Approval) as `completed`
   - Resolves OTP suspensive condition on bond
   - Notifies: buyer, seller, agent, conveyancer

When declined (and bond was OTP condition):
1. `financial.bond_applications.status` → `declined`
2. Emit `bond.declined` event
3. Sales module listener:
   - Suspensive condition failed → OTP status `void`
   - Sale status → `cancelled` (unless buyer withdraws bond condition)
   - Deposit released back to buyer (escrow condition not met)

---

## API Endpoints

### Affordability
```
POST /api/v1/mortgage/affordability-calculator       [public — no auth required]
POST /api/v1/mortgage/pre-qualification              [authenticated buyer]
GET  /api/v1/mortgage/pre-qualifications/me          [buyer]
```

### Mortgage Brokers
```
POST /api/v1/mortgage/brokers/profile                [user with 'mortgage_broker' role]
GET  /api/v1/mortgage/brokers?country=ZA             [public]
GET  /api/v1/mortgage/brokers/:id
POST /api/v1/admin/mortgage/brokers/:id/verify       [admin]
```

### Bond Applications
```
POST  /api/v1/mortgage/applications                  [buyer, mortgage_broker]
GET   /api/v1/mortgage/applications/me               [buyer] — own applications
GET   /api/v1/mortgage/applications/:id              [buyer, broker, agent(linked sale)]
PATCH /api/v1/mortgage/applications/:id/status       [broker, admin]
POST  /api/v1/mortgage/applications/:id/documents    [buyer, broker]
DELETE /api/v1/mortgage/applications/:id/documents/:docId [uploader]
```

### Bank Submissions
```
POST  /api/v1/mortgage/applications/:id/submit-to-banks  [broker]
GET   /api/v1/mortgage/applications/:id/submissions      [buyer, broker, agent]
PATCH /api/v1/mortgage/applications/:id/submissions/:subId/update [broker]
```

### Interest Rates
```
GET /api/v1/mortgage/interest-rates?country=ZA       [public]
GET /api/v1/mortgage/interest-rates/history          [authenticated]
```

---

## Notification Triggers

| Event | Recipients |
|-------|----------|
| Bond application created | Buyer, Broker |
| Submitted to bank(s) | Buyer, Agent, Conveyancer |
| Bank requests additional documents | Buyer, Broker |
| Bank valuation scheduled | Buyer, Agent |
| Bond approved | Buyer, Agent, Conveyancer, Seller |
| Bond declined | Buyer, Agent |
| Grant certificate uploaded | Conveyancer, Buyer |
| Suspensive condition resolved | All sale parties |

---

## Acceptance Criteria

- [ ] Affordability calculator returns correct max loan (within 1% of manual calculation)
- [ ] Pre-qualification certificate generated as downloadable PDF with valuation date
- [ ] Bond application submittable by both buyer directly and on behalf by broker
- [ ] Multiple banks selectable in single submission step
- [ ] Bond approval event triggers Stage 10 completion in sales pipeline
- [ ] Bond declined event with bond condition on OTP triggers sale cancellation workflow
- [ ] Grant certificate upload distributes to conveyancer automatically
- [ ] Interest rates page shows current prime rate and per-bank effective rates
- [ ] Mortgage broker FSP number verified before profile activation

---

## Dependencies
- Sprint 02 Enhanced (mortgage_broker role, org accounts)
- Sprint 03 + Sprint 04 (property and sales models)
- Sprint 05 (escrow — deposit release on bond decline)
- Sprint 13 (formal valuation linked to bond application)

## Blocks
- Sprint 04 Enhanced (bond application status feeds into StageD completion)
