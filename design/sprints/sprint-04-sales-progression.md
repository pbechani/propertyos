# Sprint 04 — Sales Progression & Legal Workflow
**Phase 3 | Weeks 13–17**

## Goal
Build the 14-stage property purchase pipeline that gives buyers, sellers, agents, and conveyancers full transparency into the legal transfer process. This is the core trust feature for property transactions.

---

## Deliverables Checklist
- [ ] 14-stage configurable purchase pipeline
- [ ] Visual timeline UI (web + mobile)
- [ ] Multi-party role assignment per sale
- [ ] Conveyancer dashboard (case management)
- [ ] Document management per stage (upload, checklist, status)
- [ ] Government department tracking (Land Registry, Deeds Office, Tax Authority)
- [ ] Agent sales dashboard with stage management
- [ ] Buyer/seller transparency portal
- [ ] Communication hub per sale
- [ ] Automated reminders for missing documents / stalled stages

---

## The 14 Purchase Stages (Default Config — Configurable Per Country)

| Stage | Name | Owner | Blocker? |
|-------|------|-------|----------|
| 1 | Offer Submitted | Agent/Buyer | No |
| 2 | Offer Accepted | Agent/Seller | No |
| 3 | Sale Agreement Drafted | Conveyancer | No |
| 4 | Sale Agreement Signed | Both Parties | Yes |
| 5 | Deposit to Escrow | Buyer | Yes |
| 6 | Title Deed Search | Conveyancer (Land Registry) | No |
| 7 | Property Survey / Valuation | Inspector | No |
| 8 | Bond / Mortgage Approval | Buyer | No |
| 9 | Compliance Certificates | Conveyancer | No |
| 10 | Rates Clearance | Conveyancer (Municipality) | No |
| 11 | Deeds Office Submission | Conveyancer (Deeds Office) | No |
| 12 | Transfer Duty Payment | Buyer (Tax Authority) | Yes |
| 13 | Deeds Office Registration | Deeds Office | Yes |
| 14 | Final Payment & Handover | Buyer/Seller/Conveyancer | — |

---

## Data Models

### `sales.property_sales`
```sql
CREATE TABLE sales.property_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  sale_reference VARCHAR(50) UNIQUE NOT NULL,
  seller_id UUID REFERENCES identity.users(id),
  buyer_id UUID REFERENCES identity.users(id),
  agent_id UUID REFERENCES identity.users(id),
  buyer_conveyancer_id UUID REFERENCES identity.users(id),
  seller_conveyancer_id UUID REFERENCES identity.users(id),
  agreed_price NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  deposit_amount NUMERIC(18,2),
  status VARCHAR(30) DEFAULT 'active', -- active, completed, cancelled, disputed
  current_stage SMALLINT DEFAULT 1,
  country CHAR(2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `sales.stage_configs`
```sql
CREATE TABLE sales.stage_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country CHAR(2) NOT NULL,
  stage_number SMALLINT NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  description TEXT,
  responsible_role VARCHAR(50), -- agent, conveyancer, buyer, seller, inspector
  is_blocker BOOLEAN DEFAULT FALSE, -- stage must complete before next
  government_dept VARCHAR(100),   -- null if no government interaction
  typical_duration_days SMALLINT,
  required_documents JSONB DEFAULT '[]',
  UNIQUE(country, stage_number)
);
```

### `sales.sale_stage_progress`
```sql
CREATE TABLE sales.sale_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  stage_number SMALLINT NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed, blocked, skipped
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES identity.users(id),
  days_in_stage INTEGER,
  notes TEXT,
  UNIQUE(sale_id, stage_number)
);
```

### `sales.stage_documents`
```sql
CREATE TABLE sales.stage_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  stage_number SMALLINT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  url TEXT,
  version SMALLINT DEFAULT 1,
  uploaded_by UUID REFERENCES identity.users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, received, verified, rejected
  is_required BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `sales.government_interactions`
```sql
CREATE TABLE sales.government_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  stage_number SMALLINT NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  application_reference VARCHAR(100),
  submission_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  status VARCHAR(30) DEFAULT 'pending', -- pending, submitted, in_review, approved, rejected
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `sales.sale_issues`
```sql
CREATE TABLE sales.sale_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  stage_number SMALLINT,
  reported_by UUID REFERENCES identity.users(id),
  issue_type VARCHAR(50), -- delay, missing_doc, dispute, other
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `sales.sale_messages`
```sql
CREATE TABLE sales.sale_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales.property_sales(id),
  sender_id UUID REFERENCES identity.users(id),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  visible_to_roles JSONB DEFAULT '["buyer","seller","agent","conveyancer"]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Sales
```
POST /api/v1/sales                          [agent] — initiate sale
GET  /api/v1/sales/:id                      [sale parties]
GET  /api/v1/sales/me                       [authenticated — own sales]
PATCH /api/v1/sales/:id/assign-conveyancer  [agent, admin]
```

### Stage Management
```
GET  /api/v1/sales/:id/stages               [sale parties]
POST /api/v1/sales/:id/stages/:stageNum/start     [responsible role]
POST /api/v1/sales/:id/stages/:stageNum/complete  [responsible role]
POST /api/v1/sales/:id/stages/:stageNum/flag      [any party]
```

### Documents
```
POST   /api/v1/sales/:id/stages/:stageNum/documents     [conveyancer, agent]
GET    /api/v1/sales/:id/documents                      [sale parties]
PATCH  /api/v1/sales/:id/documents/:docId/status        [admin, conveyancer]
DELETE /api/v1/sales/:id/documents/:docId               [uploader]
```

### Government Interactions
```
POST  /api/v1/sales/:id/government-interactions         [conveyancer]
PATCH /api/v1/sales/:id/government-interactions/:intId  [conveyancer]
```

### Communication
```
POST /api/v1/sales/:id/messages   [sale parties]
GET  /api/v1/sales/:id/messages   [sale parties]
```

### Dashboards
```
GET /api/v1/agent/sales            — agent's active sales with stage summary
GET /api/v1/conveyancer/cases      — conveyancer's active cases
GET /api/v1/admin/sales            — all sales, filterable
```

---

## Notification Triggers
| Event | Recipients |
|-------|-----------|
| Stage completed | All sale parties |
| Stage blocked (missing doc/issue) | Responsible party + agent |
| Document uploaded | Relevant parties |
| Document overdue reminder | Responsible party (daily after due date) |
| Government interaction updated | Buyer + conveyancer |
| New message | All sale parties |
| Sale completed | All parties |

---

## Buyer Visibility Rules
Buyers can always see:
- Current stage + all previous stages
- Documents uploaded for their benefit
- Government interaction status
- Sale messages addressed to them

Buyers **cannot** see:
- Internal conveyancer notes
- Commission details

---

## Acceptance Criteria
- [ ] Agent can initiate a sale and assign conveyancers
- [ ] All 14 stages visible on timeline with correct statuses
- [ ] Conveyancer can upload documents per stage
- [ ] Buyer receives notification on every stage change
- [ ] Government interaction tracker updates correctly
- [ ] Stage blocker prevents progression until unblocked
- [ ] Missing document reminder fires after 2 days of no upload
- [ ] All stage changes logged in audit table
- [ ] Sale messages visible only to configured roles
- [ ] Dashboard shows correct "days in stage" for each active stage

---

## Dependencies
- Sprint 02 (multi-role auth — buyer, seller, agent, conveyancer)
- Sprint 03 (property must exist to initiate sale)

## Blocks
- Sprint 05 (escrow triggered by Stage 5: Deposit to Escrow)
