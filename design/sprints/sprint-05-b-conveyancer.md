# Sprint 05-b — Conveyancing Case Management Platform
**Phase 4b | Weeks 22–28**
**Status: ✅ Implemented — Sprint 05-B complete (2026-03-11)**

### Implementation Notes

**Files created:**
- `apps/api/prisma/migrations/202603110024_sprint05b_conveyancing/migration.sql` — 14 tables, append-only triggers, LSSA fee seed, 20 ZA task templates
- `apps/api/src/conveyancing/conveyancing.constants.ts`
- `apps/api/src/conveyancing/conveyancing-audit.service.ts`
- `apps/api/src/conveyancing/conveyancing.dto.ts`
- `apps/api/src/conveyancing/fee-calculator.service.ts`
- `apps/api/src/conveyancing/conveyancing.service.ts`
- `apps/api/src/conveyancing/case-tasks.service.ts`
- `apps/api/src/conveyancing/trust-account.service.ts`
- `apps/api/src/conveyancing/invoice.service.ts`
- `apps/api/src/conveyancing/document-workflow.service.ts`
- `apps/api/src/conveyancing/client-portal.service.ts`
- `apps/api/src/conveyancing/conveyancing.controller.ts` (4 controllers)
- `apps/api/src/conveyancing/conveyancing.module.ts`

**Files modified:**
- `apps/api/prisma/schema.prisma` — added `"conveyancing"` to schemas array + 13 Prisma models
- `apps/api/src/app.module.ts` — registered `ConveyancingModule`

**Tests:** 27 unit tests in 4 spec files, all passing. `tsc --noEmit` exits 0.

---

## Goal

Build the dedicated **Conveyancing Case Management** layer on top of the sales progression infrastructure already delivered in Sprints 04 and 04-enhanced. This sprint elevates the platform from _tracking a sale_ to running a **full legal conveyancing practice**: firm management, trust account ledgers, legal fee invoicing, transfer document generation, multi-party e-signatures, automated task/deadline management, and a client portal.

The existing `sales` schema provides the 16-stage pipeline and document uploads. Sprint 05-b introduces a new `conveyancing` schema with firm-level operations, trust accounting, templated workflows, and AI-ready case intelligence hooks.

---

## What Is Already Implemented (Do Not Rebuild)

These features exist in `apps/api/src/sales/` and the `sales.*` schema — **reference only, do not duplicate**:

| Feature | Location | Endpoint(s) |
|---------|----------|-------------|
| Conveyancer case list | `dashboard.controller.ts` | `GET /api/v1/conveyancer/cases` |
| Assign conveyancer to sale | `sales.controller.ts` | `PATCH /api/v1/sales/:id/assign-conveyancer` |
| Stage management | `stage.service.ts` | `POST /api/v1/sales/:id/stages/:n/start\|complete\|flag` |
| Stage document upload / status | `stage-document.service.ts` | `POST /api/v1/sales/:id/stages/:n/documents` |
| Government interaction tracking | `government-interaction.service.ts` | `POST /api/v1/sales/:id/government-interactions` |
| OTP generation + negotiation | `otp.service.ts` | `POST /api/v1/sales/:saleId/otp` |
| Deal room (conveyancer_only thread) | `deal-room.service.ts` | `POST /api/v1/sales/:saleId/deal-room/messages` |
| Compliance certificate tracking | `compliance.service.ts` | `GET /api/v1/sales/:saleId/compliance-status` |
| Disbursement instructions | `disbursement.service.ts` | `POST /api/v1/sales/:saleId/disbursement-instructions` |
| Seller disclosure | `seller-disclosure.service.ts` | `POST /api/v1/sales/:saleId/seller-disclosure` |
| Post-sale checklist | `post-sale-checklist.service.ts` | `PATCH /api/v1/sales/:saleId/post-sale-checklist` |
| Firm registration (identity layer) | `identity.organisations` (Sprint 02 enhanced) | `POST /api/v1/companies` |

---

## Deliverables Checklist

### Firm & Attorney Management
- [ ] Conveyancing firm profile (law firm sub-type of `identity.organisations`)
- [ ] Attorney (conveyancer) professional licence verification
- [ ] Staff / paralegal management within a firm
- [ ] Firm-level case workload dashboard

### Case Management
- [ ] `conveyancing.cases` table (links to `sales.property_sales`, adds firm ownership)
- [ ] Case task templates per stage (auto-populated on case open)
- [ ] Manual task creation per case
- [ ] Deadline tracking (calculated + manual deadlines)
- [ ] Escalation rules (overdue task → notify senior staff)
- [ ] Internal case notes (firm-private, not visible to clients)
- [ ] Case search and filtering for firm

### Trust Account Management
- [ ] `conveyancing.trust_accounts` table per firm
- [ ] `conveyancing.trust_ledger_entries` (append-only, links to case)
- [ ] Fund receipt recording per case (deposits, transfer duty funds, bond proceeds)
- [ ] Disbursement recording on completion
- [ ] Monthly trust account reconciliation report

### Legal Fee Invoicing
- [ ] Configurable fee schedules per country (SA LSSA guideline scales)
- [ ] Auto-calculate conveyancer fees based on purchase price
- [ ] Invoice generation per case (PDF)
- [ ] Invoice line items: transfer fees, bond registration, deeds costs, disbursements, VAT
- [ ] Invoice payment tracking
- [ ] Fee statement per client

### Transfer Document Workflow
- [ ] Document template registry (Power of Attorney, Transfer Deed, Bond Cancellation, etc.)
- [ ] Auto-generate case documents from templates (pre-populated with sale data)
- [ ] Multi-party e-signature workflow (DocuSign / HelloSign integration)
- [ ] Document version control
- [ ] Signed document hash verification (SHA-256, immutable record)
- [ ] Document vault per case (immutable archive after signing)

### Client Portal
- [ ] Conveyancer spawns a portal access link per case (buyer / seller)
- [ ] Case progress view for client (stage-mapped, no internal notes)
- [ ] Document request list + client upload capability
- [ ] Invoice viewing and download
- [ ] E-signature requests delivered via portal
- [ ] SMS/email notification triggers

### Government Department Tracking
- [x] Structured government task per department (Deeds Office, SARS, Municipality, Land Registry)
- [x] Reference number tracking per submission
- [x] Expected turnaround dates per department (configurable per country)
- [x] Status history per department interaction

### Reporting
- [x] Case turnaround time per stage (firm-level)
- [x] Outstanding tasks report (all active cases × overdue tasks)
- [x] Monthly fee collection report
- [x] Active vs completed cases dashboard (caseload report)
- [x] Attorney workload report (cases per attorney — caseload endpoint)
- [ ] CSV / PDF export for all reports *(deferred — sprint-05-c gap, Phase 2)*

---

## Architecture

### New Schema
```
conveyancing.*     # All conveyancing-specific tables (this sprint)
```

All existing sales-linked data stays in `sales.*`. Cross-schema references are by UUID only (no FK constraints across schemas — see PDR-006).

### Module Location
```
apps/api/src/conveyancing/
├── conveyancing.module.ts
├── conveyancing.controller.ts         # firm dashboard, case management
├── case-tasks.controller.ts           # task/deadline management
├── trust-account.controller.ts        # trust ledger
├── invoice.controller.ts              # fee invoicing
├── document-workflow.controller.ts    # template generation + e-sign
├── client-portal.controller.ts        # portal access + client views
├── reports.controller.ts              # all reporting endpoints
├── conveyancing.service.ts
├── case-tasks.service.ts
├── trust-account.service.ts
├── invoice.service.ts
├── document-workflow.service.ts
├── client-portal.service.ts
├── reports.service.ts
├── fee-calculator.service.ts          # SA tariff scales
├── conveyancing.dto.ts
└── conveyancing.constants.ts
```

---

## Data Models

### `conveyancing.cases`
Wraps a `sales.property_sales` record with firm ownership and conveyancer-specific metadata.

```sql
CREATE TABLE conveyancing.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference VARCHAR(50) UNIQUE NOT NULL,   -- e.g. CV-2026-001234
  sale_id UUID NOT NULL,                         -- references sales.property_sales(id) — no FK across schemas
  firm_id UUID NOT NULL,                         -- references identity.companies(id)
  lead_conveyancer_id UUID NOT NULL,             -- references identity.users(id)
  support_staff_ids JSONB DEFAULT '[]',          -- [{user_id, role: "paralegal"|"secretary"}]
  case_type VARCHAR(30) DEFAULT 'transfer',      -- transfer, bond_registration, bond_cancellation, subdivision
  priority VARCHAR(20) DEFAULT 'normal',         -- normal, urgent, escalated
  status VARCHAR(30) DEFAULT 'open',             -- open, pending_signatures, pending_deeds, completed, cancelled, suspended
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  target_registration_date DATE,                 -- deadline agreed with parties
  actual_registration_date DATE,
  country CHAR(2) NOT NULL DEFAULT 'ZA',
  notes TEXT,                                    -- internal firm notes (not visible to clients)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON conveyancing.cases (firm_id, status);
CREATE INDEX ON conveyancing.cases (lead_conveyancer_id);
CREATE INDEX ON conveyancing.cases (sale_id);
```

### `conveyancing.case_tasks`
Granular task checklist within a case. May be auto-generated from templates or created manually.

```sql
CREATE TABLE conveyancing.case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES conveyancing.cases(id),
  template_task_id UUID REFERENCES conveyancing.task_templates(id),  -- null if manually created
  title VARCHAR(255) NOT NULL,
  description TEXT,
  stage_number SMALLINT,             -- which sale stage this task belongs to
  responsible_id UUID,               -- references identity.users(id) — assigned attorney/paralegal
  responsible_role VARCHAR(50),      -- conveyancer, paralegal, secretary, government, client
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, blocked, waived
  completed_at TIMESTAMPTZ,
  completed_by UUID,                 -- references identity.users(id)
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  is_blocker BOOLEAN DEFAULT FALSE,  -- prevents stage advance if not completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON conveyancing.case_tasks (case_id, status);
CREATE INDEX ON conveyancing.case_tasks (responsible_id, due_date);
```

### `conveyancing.task_templates`
Pre-defined task lists auto-created when a case stage opens.

```sql
CREATE TABLE conveyancing.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID,                        -- null = platform default, non-null = firm custom
  country CHAR(2) NOT NULL DEFAULT 'ZA',
  case_type VARCHAR(30) NOT NULL DEFAULT 'transfer',
  stage_number SMALLINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  default_due_days_from_stage_open SMALLINT,  -- auto-calculate due_date
  responsible_role VARCHAR(50),
  is_blocker BOOLEAN DEFAULT FALSE,
  sort_order SMALLINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON conveyancing.task_templates (country, case_type, stage_number);
```

### `conveyancing.case_notes`
Internal firm notes — never visible to clients or external parties.

```sql
CREATE TABLE conveyancing.case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES conveyancing.cases(id),
  author_id UUID NOT NULL,             -- references identity.users(id)
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',      -- [{url, filename, size}]
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `conveyancing.deadlines`
Structured deadline registry with escalation state.

```sql
CREATE TABLE conveyancing.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES conveyancing.cases(id),
  task_id UUID REFERENCES conveyancing.case_tasks(id),  -- optional link
  deadline_type VARCHAR(50) NOT NULL,    -- registration_target, transfer_duty_payment, bond_approval, otp_expiry, document_due, government_submission
  description VARCHAR(255),
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',   -- active, met, missed, extended
  extension_reason TEXT,
  extended_due_date DATE,
  reminder_sent_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON conveyancing.deadlines (case_id, due_date);
```

---

### Trust Account Tables

### `conveyancing.trust_accounts`
One trust account per firm per currency (governed by Attorneys Act in SA).

```sql
CREATE TABLE conveyancing.trust_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,               -- references identity.companies(id)
  account_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50),          -- actual bank account number (encrypted at rest)
  bank_name VARCHAR(100),
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX ON conveyancing.trust_accounts (firm_id, currency);
```

### `conveyancing.trust_ledger_entries` (Append-Only — NEVER UPDATE/DELETE)
Case-level trust accounting. Each entry links to a conveyancing case.

```sql
CREATE TABLE conveyancing.trust_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID REFERENCES conveyancing.trust_accounts(id),
  case_id UUID REFERENCES conveyancing.cases(id),
  entry_type VARCHAR(50) NOT NULL,     -- receipt, disbursement, transfer_duty_payment, bond_proceeds, agent_commission_payout, conveyancer_fee, reversal
  description TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  direction VARCHAR(10) NOT NULL,      -- credit (funds in), debit (funds out)
  reference VARCHAR(100),              -- bank reference / payment reference
  received_from VARCHAR(255),          -- payer name
  paid_to VARCHAR(255),                -- payee name
  payment_date DATE NOT NULL,
  recorded_by UUID NOT NULL,           -- references identity.users(id)
  approved_by UUID,                    -- references identity.users(id) — for disbursements
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON conveyancing.trust_ledger_entries (trust_account_id, payment_date);
CREATE INDEX ON conveyancing.trust_ledger_entries (case_id);
```

---

### Fee & Invoice Tables

### `conveyancing.fee_schedules`
Guideline fee scales per country. South Africa uses LSSA tariff (based on purchase price bands).

```sql
CREATE TABLE conveyancing.fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country CHAR(2) NOT NULL,
  schedule_name VARCHAR(100) NOT NULL,   -- e.g. "LSSA Transfer Fee Scale 2024"
  fee_type VARCHAR(30) NOT NULL,         -- transfer, bond_registration, bond_cancellation
  effective_from DATE NOT NULL,
  effective_to DATE,
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  bands JSONB NOT NULL,                  -- [{from, to, base_fee, pct_over_from}]
  vat_rate NUMERIC(5,4) DEFAULT 0.15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON conveyancing.fee_schedules (country, fee_type, effective_from);
```

SA LSSA Transfer Fee Scale (2024) example — as seed data:
```json
{
  "schedule_name": "LSSA Transfer Fee Scale 2024",
  "fee_type": "transfer",
  "bands": [
    {"from": 0,         "to": 100000,    "base_fee": 1053,  "pct_over_from": 0},
    {"from": 100001,    "to": 200000,    "base_fee": 1580,  "pct_over_from": 0},
    {"from": 200001,    "to": 300000,    "base_fee": 2213,  "pct_over_from": 0},
    {"from": 300001,    "to": 400000,    "base_fee": 2741,  "pct_over_from": 0},
    {"from": 400001,    "to": 500000,    "base_fee": 3532,  "pct_over_from": 0},
    {"from": 500001,    "to": 750000,    "base_fee": 4512,  "pct_over_from": 0},
    {"from": 750001,    "to": 1000000,   "base_fee": 6076,  "pct_over_from": 0},
    {"from": 1000001,   "to": 1500000,   "base_fee": 8185,  "pct_over_from": 0},
    {"from": 1500001,   "to": 2000000,   "base_fee": 10821, "pct_over_from": 0},
    {"from": 2000001,   "to": 2500000,   "base_fee": 13457, "pct_over_from": 0},
    {"from": 2500001,   "to": 3000000,   "base_fee": 15566, "pct_over_from": 0},
    {"from": 3000001,   "to": null,      "base_fee": 17149, "pct_over_from": 0.003}
  ]
}
```

### `conveyancing.invoices`
Generated per case. May be multiple invoices per case (transfer fees, bond registration, etc.).

```sql
CREATE TABLE conveyancing.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,   -- e.g. INV-CV-2026-001234
  case_id UUID REFERENCES conveyancing.cases(id),
  firm_id UUID NOT NULL,                         -- references identity.companies(id)
  billed_to_id UUID NOT NULL,                    -- references identity.users(id) — buyer or seller
  invoice_type VARCHAR(30) NOT NULL,             -- transfer_fees, bond_registration, bond_cancellation, disbursements
  subtotal NUMERIC(18,2) NOT NULL,
  vat_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'ZAR',
  status VARCHAR(20) DEFAULT 'draft',            -- draft, issued, paid, partially_paid, overdue, cancelled
  issue_date DATE,
  due_date DATE,
  paid_amount NUMERIC(18,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  document_url TEXT,                             -- generated PDF
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `conveyancing.invoice_line_items`

```sql
CREATE TABLE conveyancing.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES conveyancing.invoices(id),
  description VARCHAR(255) NOT NULL,
  line_type VARCHAR(50) NOT NULL,                -- conveyancer_fee, deeds_office_fee, transfer_duty, rates_clearance_fee, postage, sundry, vat
  quantity NUMERIC(8,2) DEFAULT 1,
  unit_price NUMERIC(18,2) NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Transfer Document Workflow Tables

### `conveyancing.document_templates`
Master templates used to generate case-specific documents.

```sql
CREATE TABLE conveyancing.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID,                                  -- null = platform default
  country CHAR(2) NOT NULL DEFAULT 'ZA',
  case_type VARCHAR(30) NOT NULL DEFAULT 'transfer',
  template_name VARCHAR(100) NOT NULL,
  document_type VARCHAR(50) NOT NULL,            -- power_of_attorney, transfer_deed, bond_registration_docs, rates_clearance_application, deeds_lodgement_cover, bond_cancellation_letter
  template_url TEXT NOT NULL,                    -- S3 path of the HTML/DOCX template
  required_fields JSONB DEFAULT '[]',            -- field names that must be pre-populated
  requires_buyer_signature BOOLEAN DEFAULT FALSE,
  requires_seller_signature BOOLEAN DEFAULT FALSE,
  requires_conveyancer_signature BOOLEAN DEFAULT FALSE,
  version SMALLINT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `conveyancing.generated_documents`
A specific instance of a template, pre-populated for a case.

```sql
CREATE TABLE conveyancing.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES conveyancing.cases(id),
  template_id UUID REFERENCES conveyancing.document_templates(id),
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  generated_by UUID NOT NULL,                    -- references identity.users(id)
  document_url TEXT,                             -- S3 path of the generated PDF
  status VARCHAR(20) DEFAULT 'draft',            -- draft, ready_for_signing, partially_signed, fully_signed, archived
  field_values JSONB DEFAULT '{}',               -- pre-populated fields at generation time
  -- Signature tracking
  signatures JSONB DEFAULT '[]',                 -- [{party_role, user_id, signed_at, signature_url, ip_address}]
  fully_signed_at TIMESTAMPTZ,
  hash VARCHAR(64),                              -- SHA-256 of final signed PDF (immutable record)
  esign_provider VARCHAR(30),                    -- docusign, hellosign, internal
  esign_envelope_id VARCHAR(255),               -- provider-side envelope/packet ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON conveyancing.generated_documents (case_id, document_type);
```

---

### Client Portal Tables

### `conveyancing.client_portal_access`
Time-limited access tokens generated per case-party combination.

```sql
CREATE TABLE conveyancing.client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES conveyancing.cases(id),
  user_id UUID NOT NULL,                         -- references identity.users(id)
  party_role VARCHAR(20) NOT NULL,               -- buyer, seller
  access_token VARCHAR(100) UNIQUE NOT NULL,     -- hashed before storage
  token_expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,                      -- conveyancer who generated the link
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Firm & Case Management
```
POST /api/v1/conveyancer/cases                          — open a conveyancing case [conveyancer, admin]
GET  /api/v1/conveyancer/cases                          — firm's case list with filters [conveyancer, admin]
GET  /api/v1/conveyancer/cases/:caseId                  — full case detail [conveyancer]
PATCH /api/v1/conveyancer/cases/:caseId                 — update case metadata [conveyancer]
PATCH /api/v1/conveyancer/cases/:caseId/assign-staff    — assign paralegal/support [conveyancer, admin]
GET  /api/v1/conveyancer/dashboard                      — firm workload overview [conveyancer, admin]
```

### Case Tasks
```
GET  /api/v1/conveyancer/cases/:caseId/tasks            — list tasks (filterable by status/stage)
POST /api/v1/conveyancer/cases/:caseId/tasks            — create manual task [conveyancer]
PATCH /api/v1/conveyancer/cases/:caseId/tasks/:taskId/complete  [conveyancer, paralegal]
PATCH /api/v1/conveyancer/cases/:caseId/tasks/:taskId/block     [conveyancer]
PATCH /api/v1/conveyancer/cases/:caseId/tasks/:taskId/assign    [conveyancer, admin]
GET  /api/v1/conveyancer/tasks/overdue                  — all overdue tasks across firm [conveyancer, admin]
```

### Task Templates (Firm Admin)
```
GET  /api/v1/conveyancer/task-templates                 — platform defaults + firm overrides
POST /api/v1/conveyancer/task-templates                 — create firm-specific template [admin]
PATCH /api/v1/conveyancer/task-templates/:id            — update template [admin]
```

### Case Notes
```
POST /api/v1/conveyancer/cases/:caseId/notes            — add internal note [conveyancer, paralegal]
GET  /api/v1/conveyancer/cases/:caseId/notes            — list notes [firm staff only]
PATCH /api/v1/conveyancer/cases/:caseId/notes/:noteId/pin  [conveyancer]
```

### Trust Account
```
POST /api/v1/conveyancer/trust/receipt                  — record fund receipt [conveyancer, admin]
POST /api/v1/conveyancer/trust/disburse                 — record disbursement (requires approval) [conveyancer]
POST /api/v1/conveyancer/trust/disburse/:id/approve     — approve disbursement [firm_admin, admin]
GET  /api/v1/conveyancer/trust/:trustAccountId/ledger   — full ledger [firm_admin, admin]
GET  /api/v1/conveyancer/trust/:trustAccountId/balance  — current balance per currency [conveyancer, admin]
GET  /api/v1/conveyancer/cases/:caseId/trust-summary    — trust balance for a specific case
```

### Fee Invoicing
```
POST /api/v1/conveyancer/cases/:caseId/invoices         — generate invoice [conveyancer]
GET  /api/v1/conveyancer/cases/:caseId/invoices         — list invoices for case
GET  /api/v1/conveyancer/invoices/:invoiceId            — invoice detail + line items
GET  /api/v1/conveyancer/invoices/:invoiceId/pdf        — download generated PDF
PATCH /api/v1/conveyancer/invoices/:invoiceId/issue     — mark as issued, send to client [conveyancer]
PATCH /api/v1/conveyancer/invoices/:invoiceId/record-payment  — record payment received
GET  /api/v1/conveyancer/fee-calculator                 — estimate fees by purchase price + type [conveyancer]
```

### Transfer Documents
```
GET  /api/v1/conveyancer/document-templates             — list available templates
POST /api/v1/conveyancer/cases/:caseId/documents/generate  — generate from template [conveyancer]
GET  /api/v1/conveyancer/cases/:caseId/documents        — list all case documents
GET  /api/v1/conveyancer/cases/:caseId/documents/:docId — document detail + signature status
POST /api/v1/conveyancer/cases/:caseId/documents/:docId/send-for-signing  — send to signatories
PATCH /api/v1/conveyancer/cases/:caseId/documents/:docId/sign  — internal e-sign by conveyancer
GET  /api/v1/conveyancer/cases/:caseId/documents/:docId/download  — download PDF
```

### Client Portal
```
POST /api/v1/conveyancer/cases/:caseId/portal/access    — generate portal link for buyer/seller [conveyancer]
GET  /api/v1/client-portal/:token/case                  — client case progress view (public, token-gated)
GET  /api/v1/client-portal/:token/documents             — client's document requests
POST /api/v1/client-portal/:token/documents/:docId/upload  — client uploads document
GET  /api/v1/client-portal/:token/invoices              — client's invoices
POST /api/v1/client-portal/:token/documents/:docId/sign — client e-signs document
```

### Reporting
```
GET /api/v1/conveyancer/reports/turnaround              — case stage turnaround times [conveyancer, admin]
GET /api/v1/conveyancer/reports/outstanding-tasks       — overdue tasks across firm
GET /api/v1/conveyancer/reports/fee-collection          — monthly fee collection [admin]
GET /api/v1/conveyancer/reports/caseload                — active vs complete cases per attorney
GET /api/v1/conveyancer/reports/export                  — CSV/PDF export [admin]
```

---

## Fee Calculator Logic

Conveyancer fees are computed at the time of invoice generation using the active fee schedule for the country and date.

```typescript
// apps/api/src/conveyancing/fee-calculator.service.ts
async calculateTransferFee(purchasePrice: number, country: string): Promise<FeeBreakdown> {
  const schedule = await this.getActiveFeeSchedule(country, 'transfer');
  const band = schedule.bands.find(b => purchasePrice >= b.from && (b.to === null || purchasePrice <= b.to));
  const baseFee = band.base_fee + (purchasePrice - band.from) * band.pct_over_from;
  const vatAmount = baseFee * schedule.vat_rate;
  return {
    baseFee: round2(baseFee),
    vatAmount: round2(vatAmount),
    totalFee: round2(baseFee + vatAmount),
    scheduleId: schedule.id,
    scheduleVersion: schedule.schedule_name,
  };
}
```

Stores `scheduleId` at invoice creation time so historical invoices remain accurate even if bands change.

---

## Transfer Duty Integration

Sprint 04 enhanced defined `calculateTransferDuty()` as a standalone function. This sprint **reuses** it when generating the disbursement instruction and can include transfer duty as an invoice line item:

- Transfer duty is payable by the buyer directly to SARS via eFiling
- The conveyancer's invoice records this as a **pass-through disbursement line** (zero margin)
- The trust ledger records receipt of transfer duty funds from buyer and payment to SARS

---

## E-Signature Workflow

```
1. Conveyancer generates document: POST /api/v1/conveyancer/cases/:id/documents/generate
2. System pre-populates HTML template with sale/case data
3. Puppeteer renders to PDF (same pipeline as OTP generation in Sprint 04)
4. Conveyancer reviews draft: GET /api/v1/conveyancer/cases/:id/documents/:docId
5. Conveyancer sends for signing: POST .../send-for-signing
   a. DocuSign envelope created (or HelloSign packet)
   b. Notification sent to each signatory (email + portal)
6. Signatories sign via provider UI (embedded iframe or redirect)
7. Webhook received: POST /api/v1/webhooks/esign/:provider
   a. Verify webhook signature
   b. Update signatures[] JSONB on generated_documents
   c. On all signatures complete:
      - Set status = 'fully_signed'
      - Compute SHA-256 hash of final PDF
      - Set fully_signed_at
      - Archive in document vault
8. Notify conveyancer: all signatures complete
```

Webhook handler must be idempotent (same envelope ID → skip if already processed).

---

## Default Task Templates (ZA Transfer — Seed Data)

The following tasks are auto-created when a case opens in South Africa for a transfer. These map to the 16-stage pipeline:

| Stage | Task | Responsible Role | Default Due (days from stage open) | Blocker? |
|-------|------|------------------|------------------------------------|----------|
| 5 | Confirm deposit receipt in trust account | conveyancer | 3 | Yes |
| 6 | Submit title deed search to Land Registry | conveyancer | 2 | No |
| 6 | Obtain Deeds Office search result | conveyancer | 14 | No |
| 6 | Check for existing bonds / endorsements | conveyancer | 14 | No |
| 9 | Instruct seller to obtain electrical certificate | conveyancer | 3 | No |
| 9 | Confirm compliance certificates received | conveyancer | 21 | Yes |
| 10 | Apply for rates clearance certificate | conveyancer | 3 | No |
| 10 | Confirm rates clearance received | conveyancer | 30 | Yes |
| 11 | Prepare transfer deed draft | conveyancer | 5 | No |
| 11 | Prepare Power of Attorney documents | conveyancer | 5 | No |
| 11 | Send POA to buyer for signature | conveyancer | 7 | Yes |
| 11 | Send transfer documents to Deeds Office | conveyancer | 14 | No |
| 12 | Confirm transfer duty payment received from buyer | conveyancer | 3 | Yes |
| 12 | Submit transfer duty via SARS eFiling | conveyancer | 5 | Yes |
| 13 | Track Deeds Office registration queue | paralegal | 1 (daily check) | No |
| 13 | Receive registered title deed from Deeds Office | conveyancer | 30 | Yes |
| 14 | Release net proceeds to seller | conveyancer | 1 | No |
| 14 | Confirm keys handover | conveyancer | 1 | No |
| 14 | Send title deed to buyer/bank | conveyancer | 3 | No |
| 14 | Close trust ledger for case | conveyancer | 5 | Yes |

---

## Client Portal — What Clients See vs Hide

| Data | Buyer | Seller | Hidden From Clients |
|------|-------|--------|---------------------|
| Current stage name + status | ✅ | ✅ | — |
| Stage completion dates | ✅ | ✅ | — |
| Document requests (own) | ✅ | ✅ | — |
| Their own signed documents | ✅ | ✅ | — |
| Their invoice | ✅ | ✅ | — |
| Other party's invoice | ❌ | ❌ | ✅ |
| Government interaction details | ✅ | ✅ | — |
| Internal case notes | ❌ | ❌ | ✅ |
| Trust account ledger | ❌ | ❌ | ✅ |
| Disbursement breakdown | ❌ Buyer | ✅ Seller's net proceeds | ✅ Detail |
| Overdue task alerts | Own tasks only | Own tasks only | Firm workload |

---

## Notification Triggers

| Event | Recipients |
|-------|-----------|
| Case opened | Lead conveyancer + firm admin |
| Task overdue (1 day) | Assigned staff + lead conveyancer |
| Task overdue (3 days) | Lead conveyancer + senior partner |
| Document ready for signing | Signatory via email + portal notification |
| Document fully signed | Lead conveyancer |
| Trust receipt recorded | Lead conveyancer + firm admin |
| Disbursement approved | Lead conveyancer |
| Invoice issued | Billed party |
| Invoice overdue | Billed party (daily reminder) |
| Case completed | All parties + firm admin |

---

## Security Requirements

- Only firm members (`firm_id` match) can access their firm's cases, trust ledger, and invoices
- Client portal access is token-only; tokens are hashed before storage (SHA-256) and expire after 30 days (configurable)
- Disbursements from trust account require a second approver (different from requester) for any amount
- E-signature webhook endpoints must verify the provider's HMAC signature before processing
- Trust ledger entries are append-only — no UPDATE or DELETE allowed (enforced via row-level security or application layer)
- All financial actions (trust receipts, disbursements, invoice payments) are written to `audit.logs`
- Never return trust account bank account number in API responses (firm portal only, masked)

---

## Acceptance Criteria

### Case Management
- [ ] Conveyancer can open a case linked to an existing `sales.property_sales` record
- [ ] Auto-created task templates populate on case creation for the correct country + stage
- [ ] Conveyancer can mark tasks complete, blocked, or waived
- [ ] Overdue tasks appear in the firm dashboard with days overdue
- [ ] Internal notes are never returned by the client portal endpoints

### Trust Account
- [ ] Trust receipt is recorded and reflected in balance immediately
- [ ] Disbursement requires a different approver from the requester
- [ ] Trust balance per case is computed from ledger entries (never stored directly)
- [ ] Trust ledger entries have unique `idempotency_key` — duplicate submissions rejected

### Fee Invoicing
- [ ] Fee calculator returns correct fee for ZA transfer at R1,500,000 (R 10,821 + VAT)
- [ ] Invoice PDF generated with all line items visible
- [ ] Invoice status transitions: draft → issued → paid
- [ ] Payment recording reduces outstanding balance

### Transfer Documents
- [ ] Document generation pre-populates buyer name, seller name, property address, purchase price from sale data
- [ ] E-sign webhook updates signature status on receipt
- [ ] Fully signed document has SHA-256 hash computed and stored
- [ ] Duplicate webhook for same envelope ID does not create duplicate signatures

### Client Portal
- [ ] Portal access token is hashed before storage, never stored raw
- [ ] Client can view their document requests and upload documents
- [ ] Client cannot view internal case notes or trust ledger
- [ ] Portal token expires at the configured time and access is denied thereafter

### Reporting
- [x] Turnaround report includes average days per stage for closed cases
- [x] Outstanding tasks report groups by attorney with SLA breach flag
- [ ] CSV export of fee collection report includes invoice number, case reference, amount, status *(deferred — Phase 2)*

---

## Testing Requirements

### Unit Tests
- `FeeCalculatorService.calculateTransferFee()` — test all SA tariff bands (especially boundary values)
- `FeeCalculatorService.calculateTransferFee()` — test bond registration and cancellation fee types
- `TrustAccountService.getBalance()` — verify balance is sum of credits minus debits from ledger
- `TrustAccountService.recordDisbursement()` — verify it throws when requester === approver
- `DocumentWorkflowService.handleEsignWebhook()` — verify idempotency on duplicate envelope ID
- `ClientPortalService.validateToken()` — verify expired token returns 401
- `ClientPortalService.getCaseView()` — verify internal notes are stripped from response

### Integration Tests
- `POST /api/v1/conveyancer/cases` — 201 created, 400 on missing `sale_id`, 404 on non-existent sale, 403 if not conveyancer role
- `POST /api/v1/conveyancer/trust/receipt` — 201 created, reflected in balance endpoint
- `POST /api/v1/conveyancer/trust/disburse/:id/approve` — 403 if approver === requester
- `POST /api/v1/conveyancer/cases/:id/invoices` — correct fee calculator used, VAT included
- `GET /api/v1/client-portal/:token/case` — internal notes absent from response
- `GET /api/v1/client-portal/:expiredToken/case` — 401 on expired token
- Webhook `POST /api/v1/webhooks/esign/docusign` — idempotent on duplicate envelope ID, rejects invalid HMAC

---

## Dependencies

- Sprint 02 enhanced — `identity.organisations` with `org_type = 'law_firm'` (firm table)
- Sprint 02 enhanced — Professional licence verification (`identity.professional_licences`)
- Sprint 04 — `sales.property_sales` (cases link to sale records)
- Sprint 04 enhanced — OTP + Disbursement workflow (reused, not rebuilt)
- Sprint 05 — `financial.escrow` (trust account disbursements may release buyer escrow in parallel)

## Blocks

- Sprint 11 — AI Legal Intelligence hooks into `conveyancing.cases`, `conveyancing.case_tasks`, and `conveyancing.generated_documents`
- Sprint 14 — Mortgage module references `conveyancing.cases` for bond registration sub-cases

---

## Future / Deferred (Sprint 11+)

- **AI Case Copilot**: natural language query over case state (`"What is blocking case CV-001234?"`)
- **Document Intelligence Agent**: OCR + clause extraction on uploaded documents
- **Compliance Agent**: AML/KYC checks on parties per transaction
- **Workflow Agent**: auto-advance stages when all blocker tasks in `conveyancing.case_tasks` are complete
- **Legal Research Agent**: regulation lookup and conveyancing process guidance via RAG
- **Risk Detection Agent**: ownership conflict detection across active cases
- **AI Command Center**: firm-level dashboard driven by AI insights (see `docs/conveyancer/ai_conveyancing_system_blueprint.md`)

The `conveyancing.cases`, `conveyancing.case_tasks`, and `conveyancing.generated_documents` tables are designed as the primary data sources for all future AI agents. The AI Data Map in `docs/conveyancer/ai-data-map.md` and the Agent Permission Matrix in `docs/conveyancer/ai-agent-tool-permission-matrix.md` define read/write access per agent — implement those access boundaries when building the AI layer.
