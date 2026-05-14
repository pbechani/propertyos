# Sprint 04 Enhanced — Sales Progression & Legal Workflow
**Addendum to sprint-04-sales-progression.md**
**Added: March 2026 — Based on real-estate-platform-guide.md**
**Status: ✅ Implemented 2026-03-10 | Updated 2026-03-10 (parties junction + capital gains stage)**

**Implemented migrations:**
- `20260310000001_sale_parties_junction` — `sales.sale_buyers` + `sales.sale_sellers` M:N junction tables (multi-buyer/co-purchaser & multi-seller/co-owner support); backfills from legacy `buyer_id`/`seller_id` FK columns
- `202603100020_add_capital_gains_stage` — ZA Stage 13 "Capital Gains / Income Tax Clearance" (SARS, `conveyancer`-responsible, `is_blocker=TRUE`); existing stages 13→14 and 14→15 renumbered; `TOTAL_STAGES` = 15 for ZA  
- `20260310000001`–`202603100021` — OTP, Deal Room, Bond, Compliance, Disbursement, Seller Disclosure, Post-Sale Checklist Prisma models (via `prisma db push` + manual migrations)

**Implemented endpoints (added to `sales.controller.ts`):**
- `PATCH /api/v1/sales/:id/assign-buyer` — add a co-buyer
- `DELETE /api/v1/sales/:id/buyers/:userId` — remove a buyer
- `PATCH /api/v1/sales/:id/assign-seller` — add a co-seller
- `DELETE /api/v1/sales/:id/sellers/:userId` — remove a seller
- `GET /api/v1/users/search?q=&role=` (identity module) — party lookup for the workspace UI

---

## What This File Adds

Sprint 04 covers the 14-stage pipeline, conveyancer dashboard, and buyer portal. This enhancement adds:

1. **16-stage pipeline** — the guide identifies 16 stages (seller preparation + valuation precede the pipeline)
2. **Digital OTP generation** — auto-populated Offer to Purchase with suspensive conditions
3. **Negotiation workflow with version tracking** — counter-offer chain with full audit
4. **Multi-offer management** — seller views competing offers side-by-side
5. **Deal room** — private per-offer communication between buyer, seller, agents
6. **Bond/mortgage coordination** — link bond application events to sale progression
7. **Compliance certificate tracking** — which certs required per property type and municipality
8. **Financial disbursement workflow** — net proceeds calculation at completion
9. **Post-sale workflow** — archival, commission payout, ownership registry update
10. **Voetstoots clause & seller's disclosure** — legal requirement for SA market

---

## Extended 16-Stage Pipeline

The platform guide identifies pre-listing phases that should be tracked:

| Stage | Name | Responsible | Blocker? | Added vs Sprint 04 |
|-------|------|-------------|----------|---------------------|
| 0 | Seller Preparation | Seller | No | **NEW** |
| 1 | Property Valuation | Valuer / Agent | No | **NEW** |
| 2 | Mandate Signed | Agent / Seller | No | **NEW** |
| 3 | Listing Active | Agent | No | **NEW** |
| 4 | Offer Submitted | Agent/Buyer | No | Was Stage 1 |
| 5 | Offer Accepted (OTP Signed) | Agent/Seller | Yes | Was Stage 4 |
| 6 | Deposit to Escrow | Buyer | Yes | Was Stage 5 |
| 7 | Bond / Mortgage Application | Buyer | No | **NEW** (was in phase 8) |
| 8 | Title Deed Search | Conveyancer | No | Was Stage 6 |
| 9 | Property Survey / Valuation | Inspector | No | Was Stage 7 |
| 10 | Bond Approval | Bank | No | **NEW** |
| 11 | Compliance Certificates | Conveyancer / Seller | Yes | Was Stage 9 |
| 12 | Rates Clearance | Conveyancer (Municipality) | Yes | Was Stage 10 |
| 13 | Deeds Office Submission | Conveyancer | No | Was Stage 11 |
| 14 | Transfer Duty Payment | Buyer (SARS) | Yes | Was Stage 12 |
| 15 | Deeds Office Registration | Deeds Office | Yes | Was Stage 13 |
| 16 | Final Payment & Handover | Parties | — | Was Stage 14 |

**Config note:** The `sales.stage_configs` table in Sprint 04 is country-configurable. Stages 0–3 can be pre-loaded as "pre-transaction" stages that track listing preparation before the offer is placed.

---

## Digital OTP (Offer to Purchase) Generation

### `sales.offer_to_purchase`
```sql
CREATE TABLE sales.offer_to_purchase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  otp_reference VARCHAR(50) UNIQUE NOT NULL,
  version SMALLINT NOT NULL DEFAULT 1,
  is_counter_offer BOOLEAN DEFAULT FALSE,
  parent_otp_id UUID REFERENCES sales.offer_to_purchase(id),  -- null for original offer
  
  -- Offer terms
  offered_price NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  deposit_amount NUMERIC(18,2),
  deposit_due_days SMALLINT DEFAULT 7,          -- days from acceptance to pay deposit
  
  -- Occupational date
  occupational_date DATE,
  occupational_rental_per_day NUMERIC(10,2),    -- if buyer occupies before transfer
  
  -- Suspensive conditions
  bond_condition BOOLEAN DEFAULT TRUE,          -- voided if buyer can't get bond
  bond_amount NUMERIC(18,2),
  bond_institution VARCHAR(100),                -- specific bank or "any"
  bond_deadline_days SMALLINT DEFAULT 30,
  
  inspection_condition BOOLEAN DEFAULT FALSE,
  inspection_deadline_days SMALLINT,
  
  subject_to_sale BOOLEAN DEFAULT FALSE,        -- buyer must sell own property first
  subject_to_sale_deadline_date DATE,
  
  -- Voetstoots & disclosure
  voetstoots_accepted BOOLEAN DEFAULT FALSE,
  seller_disclosure_url TEXT,                   -- signed disclosure document
  
  -- Validity
  offer_valid_until TIMESTAMPTZ NOT NULL,       -- auto-expires after this time
  
  -- Signatures
  buyer_id UUID REFERENCES identity.users(id),
  seller_id UUID REFERENCES identity.users(id),
  buyer_signed_at TIMESTAMPTZ,
  seller_signed_at TIMESTAMPTZ,
  buyer_signature_url TEXT,
  seller_signature_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',         -- pending, accepted, rejected, countered, expired, withdrawn
  rejected_reason TEXT,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Document
  otp_document_url TEXT,                        -- generated PDF
  hash VARCHAR(64),                             -- SHA-256 of final signed document
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON sales.offer_to_purchase (sale_id, version);
```

### OTP Generation Flow
```
1. Agent initiates: POST /api/v1/sales/:id/otp
2. System auto-populates: property, buyer, seller, agent data
3. Agent completes: price, deposit, conditions, occupational date
4. System generates: PDF document (HTML template → Puppeteer → PDF)
5. Buyer e-signs via DocuSign / HelloSign integration
6. Sent to seller: listing agent presents to seller
7. Seller options: accept (sign), reject, or counter-offer
8. On full signature: sale moves to Stage 5 (blocker)
```

---

## Negotiation Workflow

### `sales.otp_negotiations`
```sql
CREATE TABLE sales.otp_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  round_number SMALLINT NOT NULL,     -- 1=original offer, 2=first counter, 3=second counter...
  otp_id UUID REFERENCES sales.offer_to_purchase(id),
  submitted_by_id UUID REFERENCES identity.users(id),
  submitted_by_role VARCHAR(20),      -- buyer, seller
  summary TEXT,                       -- human-readable change summary
  changes_from_previous JSONB,        -- {price: {from: 500000, to: 490000}, ...}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Multi-Offer View

When multiple buyers have submitted offers on the same property:

```
GET /api/v1/sales/:id/offers/compare   [seller, agent]
```

Returns all active OTPs side-by-side with:
- Offered price
- Deposit amount  
- Bond condition (and whether buyer is pre-approved)
- Occupational date
- Key suspensive conditions
- Buyer KYC status

---

## Deal Room

A private, isolated communication space per sale/offer.

### `sales.deal_room_messages`
```sql
CREATE TABLE sales.deal_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  otp_id UUID REFERENCES sales.offer_to_purchase(id),   -- null for general sale messages
  thread_type VARCHAR(20) NOT NULL,  -- offer_negotiation, general, conveyancer_only, agent_only
  sender_id UUID REFERENCES identity.users(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  visible_to JSONB NOT NULL,         -- ["buyer", "seller", "agent"] — role-based visibility
  read_by JSONB DEFAULT '{}',        -- {user_id: read_at_timestamp}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Deal Room Threads

| Thread Type | Visible To |
|-------------|-----------|
| `offer_negotiation` | Buyer, Seller, both Agents |
| `general` | All sale parties |
| `conveyancer_only` | Buyer conveyancer, Seller conveyancer |
| `agent_only` | Buyer agent, Seller agent |
| `compliance` | Agent, Conveyancer |

---

## Bond / Mortgage Application Coordination

Link the bond application events from Sprint 14 (Mortgage Module) into the sale:

### `sales.bond_applications`
```sql
CREATE TABLE sales.bond_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  buyer_id UUID REFERENCES identity.users(id),
  mortgage_broker_id UUID REFERENCES identity.users(id),
  banks_applied_to JSONB DEFAULT '[]',     -- [{bank_name, reference, submitted_at}]
  originator VARCHAR(100),                  -- "betterbond", "ooba", etc.
  loan_amount NUMERIC(18,2),
  property_value_used NUMERIC(18,2),
  ltv_pct NUMERIC(5,2),                    -- loan-to-value %
  status VARCHAR(30) DEFAULT 'in_progress', -- in_progress, approved, approved_with_conditions, declined
  approved_amount NUMERIC(18,2),
  interest_rate_pct NUMERIC(6,4),
  loan_term_years SMALLINT,
  conditions JSONB DEFAULT '[]',            -- [{condition, deadline, status}]
  grant_certificate_url TEXT,
  approved_at TIMESTAMPTZ,
  declined_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Bond approval events trigger:
- Sale Stage 10 (Bond Approval) completion
- Notification to conveyancer and agent
- Suspensive condition on OTP resolved

---

## Compliance Certificate Tracking per Sale

### `sales.compliance_requirements`
```sql
CREATE TABLE sales.compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  cert_type VARCHAR(50) NOT NULL,     -- electrical, plumbing, gas, electric_fence, beetle, rates_clearance
  is_required BOOLEAN DEFAULT TRUE,   -- may not apply (e.g. no gas = no gas cert)
  required_by VARCHAR(20),            -- seller, conveyancer
  due_by_stage SMALLINT,              -- must be complete before this stage
  status VARCHAR(20) DEFAULT 'pending', -- pending, booked, received, verified, waived
  certificate_id UUID REFERENCES inspection.compliance_certificates(id),
  deadline_date DATE,
  waiver_reason TEXT,                 -- if is_required = false
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sale_id, cert_type)
);
```

---

## Financial Disbursement at Completion

### `sales.disbursement_instructions`
```sql
CREATE TABLE sales.disbursement_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  conveyancer_id UUID REFERENCES identity.users(id),
  
  -- Source
  total_proceeds NUMERIC(18,2) NOT NULL,       -- final purchase price
  
  -- Deductions
  existing_bond_settlement NUMERIC(18,2) DEFAULT 0,
  transfer_duty_paid NUMERIC(18,2) DEFAULT 0,
  conveyancer_fees NUMERIC(18,2) DEFAULT 0,
  agent_commission NUMERIC(18,2) DEFAULT 0,
  rates_clearance_payment NUMERIC(18,2) DEFAULT 0,
  other_deductions JSONB DEFAULT '[]',          -- [{description, amount}]
  
  -- Net to seller
  net_proceeds_to_seller NUMERIC(18,2),         -- calculated field
  
  status VARCHAR(20) DEFAULT 'draft',            -- draft, approved_by_conveyancer, disbursed
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  disbursement_reference VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Transfer duty calculation (South Africa 2024/25):
```typescript
function calculateTransferDuty(purchasePrice: number): number {
  if (purchasePrice <= 1_100_000) return 0;
  if (purchasePrice <= 1_512_500) return (purchasePrice - 1_100_000) * 0.03;
  if (purchasePrice <= 2_117_500) return 12_375 + (purchasePrice - 1_512_500) * 0.06;
  if (purchasePrice <= 2_722_500) return 48_675 + (purchasePrice - 2_117_500) * 0.08;
  if (purchasePrice <= 12_100_000) return 97_075 + (purchasePrice - 2_722_500) * 0.11;
  return 1_128_600 + (purchasePrice - 12_100_000) * 0.13;
}
// Note: configurable per country — this is South Africa's SARS schedule
```

---

## Post-Sale Workflow

### Events triggered on Stage 16 (Final Payment & Handover) completion:

1. **Ownership registry update**: `property.ownership_history` gets new entry
2. **Commission payout**: Trigger ledger entry releasing agent commission from escrow
3. **Listing archival**: Property status → `sold` → `archived` (after 30 days)
4. **Review prompts**: Email to buyer and seller requesting AgentRating review
5. **Market intelligence feed**: Sale data feeds into `property.comparable_sales`
6. **Title deed archive**: Deed document stored permanently in document vault
7. **Post-sale notification**: Buyer receives keys handover confirmation, seller receives net proceeds confirmation

### `sales.post_sale_checklist`
```sql
CREATE TABLE sales.post_sale_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  keys_handover_confirmed BOOLEAN DEFAULT FALSE,
  keys_handover_at TIMESTAMPTZ,
  title_deed_received_by_buyer BOOLEAN DEFAULT FALSE,
  title_deed_received_at TIMESTAMPTZ,
  new_bond_registered BOOLEAN DEFAULT FALSE,
  seller_proceeds_paid BOOLEAN DEFAULT FALSE,
  agent_commission_paid BOOLEAN DEFAULT FALSE,
  listing_archived BOOLEAN DEFAULT FALSE,
  ownership_registry_updated BOOLEAN DEFAULT FALSE,
  buyer_review_submitted BOOLEAN DEFAULT FALSE,
  seller_review_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Seller Disclosure Form

Required in SA (Consumer Protection Act & common law):

### `sales.seller_disclosures`
```sql
CREATE TABLE sales.seller_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  seller_id UUID REFERENCES identity.users(id),
  
  -- Known defects
  structural_defects_known BOOLEAN,
  structural_defects_description TEXT,
  water_leak_history BOOLEAN,
  water_leak_description TEXT,
  pest_infestation_history BOOLEAN,
  pest_description TEXT,
  boundary_disputes BOOLEAN,
  neighbour_relations_notes TEXT,
  body_corporate_disputes BOOLEAN,                -- for sectional title
  outstanding_levies NUMERIC(10,2),
  
  -- Legal
  interdicts_or_court_orders BOOLEAN DEFAULT FALSE,
  pending_litigation BOOLEAN DEFAULT FALSE,
  
  -- General
  approved_building_plans BOOLEAN,
  unauthorised_structures BOOLEAN,
  unauthorised_structures_description TEXT,
  
  -- Signature
  signed_by_seller_at TIMESTAMPTZ,
  disclosure_document_url TEXT,
  hash VARCHAR(64),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Additional API Endpoints

### OTP / Offer Management
```
POST  /api/v1/sales/:id/otp                           [agent] — generate OTP
GET   /api/v1/sales/:id/otp/versions                  [sale parties]
POST  /api/v1/sales/:id/otp/:otpId/sign               [buyer or seller]
POST  /api/v1/sales/:id/otp/:otpId/counter-offer      [seller via agent]
POST  /api/v1/sales/:id/otp/:otpId/withdraw           [buyer]
GET   /api/v1/sales/:id/offers/compare                [seller, agent]
```

### Deal Room
```
POST /api/v1/sales/:id/deal-room/messages             [sale parties]
GET  /api/v1/sales/:id/deal-room/messages             [sale parties, filtered by role]
PATCH /api/v1/sales/:id/deal-room/messages/:id/read   [recipient]
```

### Compliance
```
POST  /api/v1/sales/:id/compliance-requirements       [conveyancer] — setup per sale
PATCH /api/v1/sales/:id/compliance/:certType/status   [conveyancer]
GET   /api/v1/sales/:id/compliance-status             [sale parties]
```

### Disbursement
```
POST  /api/v1/sales/:id/disbursement-instructions     [conveyancer]
GET   /api/v1/sales/:id/disbursement-instructions     [seller, conveyancer, admin]
PATCH /api/v1/sales/:id/disbursement-instructions/:id/approve [conveyancer]
```

### Bond Applications
```
POST /api/v1/sales/:id/bond-application               [buyer, mortgage_broker]
PATCH /api/v1/sales/:id/bond-application/:id/update   [buyer, mortgage_broker]
GET  /api/v1/sales/:id/bond-application               [buyer, agent, conveyancer]
```

---

## Additional Acceptance Criteria

- [x] OTP auto-populated from property and buyer/seller data
- [x] Suspensive conditions configurable per offer (bond, inspection, subject-to-sale)
- [x] Counter-offer creates new OTP version linked to parent
- [x] Seller can view all competing offers side-by-side
- [x] Deal room threads visible only to role-appropriate parties
- [ ] Bond approval event automatically marks Stage 7 + Stage 10 as complete
- [x] Transfer duty calculation configurable per country (SA defaults loaded)
- [x] Disbursement instruction breakdown correct (all deductions itemised)
- [x] Post-sale checklist triggers commission release only when all items confirmed
- [ ] Listing status updates to sold/archived automatically
- [ ] Comparable sale entry created in `property.comparable_sales` after registration

---

## Dependencies
- Sprint 04 base
- Sprint 03 Enhanced (mandate, viewing history, valuation)
- Sprint 05 (escrow — deposit and disbursement)

## Blocks
- Sprint 14 (Mortgage Module — bond application events feed back here)
