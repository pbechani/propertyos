# Sprint 05 — Escrow & Financial Ledger
**Phase 4 | Weeks 18–22**

## Goal
Build a **financial-grade** double-entry ledger, escrow account system, payment gateway integration, and full financial audit trail. This is the most critical sprint — zero tolerance for data loss or incorrect balances.

---

## Deliverables Checklist
- [ ] Double-entry accounting ledger (accounts + journal entries)
- [ ] Event-sourced transaction system (append-only)
- [ ] Escrow accounts (property sales + construction projects)
- [ ] Fund deposit workflow
- [ ] Multi-signature escrow release workflow (manual for MVP)
- [ ] Payment gateway integration (Stripe + Flutterwave / Paystack)
- [ ] Multi-currency support with exchange rate integration
- [ ] Commission distribution logic
- [ ] Financial reporting (statements, history, exports)
- [ ] Financial audit trail

---

## Architecture Note
All financial state is derived from the **event log** — never update a balance directly. Balances are computed via aggregate queries on the events table. This enables point-in-time reconstruction and dispute resolution.

---

## Data Models

### `financial.accounts`
```sql
CREATE TABLE financial.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number VARCHAR(30) UNIQUE NOT NULL,
  account_type VARCHAR(30) NOT NULL, -- escrow, user_wallet, operational, commission, fee
  owner_id UUID REFERENCES identity.users(id), -- NULL for platform accounts
  owner_type VARCHAR(30), -- user, platform, sale, project
  reference_id UUID,   -- sale_id or project_id if linked
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active', -- active, frozen, closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON financial.accounts (owner_id);
CREATE INDEX ON financial.accounts (reference_id);
```

### `financial.ledger_entries` (Append-Only — NEVER UPDATE/DELETE)
```sql
CREATE TABLE financial.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_reference VARCHAR(50) UNIQUE NOT NULL,
  entry_type VARCHAR(50) NOT NULL, -- deposit, withdrawal, escrow_hold, escrow_release, transfer, commission, fee, refund
  debit_account_id UUID REFERENCES financial.accounts(id),
  credit_account_id UUID REFERENCES financial.accounts(id),
  amount NUMERIC(18,8) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  exchange_rate NUMERIC(18,8) DEFAULT 1,
  base_currency_amount NUMERIC(18,8),
  description TEXT,
  metadata JSONB,  -- payment gateway refs, sale_id, project_id, stage_number
  initiated_by UUID REFERENCES identity.users(id),
  approved_by UUID REFERENCES identity.users(id),
  status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, reversed
  idempotency_key VARCHAR(100) UNIQUE,  -- prevent duplicate transactions
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON financial.ledger_entries (debit_account_id, created_at);
CREATE INDEX ON financial.ledger_entries (credit_account_id, created_at);
CREATE INDEX ON financial.ledger_entries (status, created_at);
```

### `financial.escrow_conditions`
```sql
CREATE TABLE financial.escrow_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_account_id UUID REFERENCES financial.accounts(id),
  condition_type VARCHAR(50) NOT NULL, -- stage_completion, inspection_pass, manual_approval, time_based
  condition_details JSONB,  -- e.g. {"stage_number": 13, "sale_id": "uuid"}
  is_satisfied BOOLEAN DEFAULT FALSE,
  satisfied_at TIMESTAMPTZ,
  satisfied_by UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `financial.payment_requests`
```sql
CREATE TABLE financial.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES financial.accounts(id),
  amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  payment_method VARCHAR(30), -- stripe, flutterwave, paystack, bank_transfer
  gateway_reference VARCHAR(255),
  gateway_status VARCHAR(30),
  gateway_response JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `financial.escrow_releases` (Multi-Signature)
```sql
CREATE TABLE financial.escrow_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_account_id UUID REFERENCES financial.accounts(id),
  release_amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  destination_account_id UUID REFERENCES financial.accounts(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, completed
  requested_by UUID REFERENCES identity.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  buyer_approval_at TIMESTAMPTZ,
  admin_approval_at TIMESTAMPTZ,
  admin_approver_id UUID REFERENCES identity.users(id),
  released_at TIMESTAMPTZ
);
```

---

## API Endpoints

### Accounts
```
GET  /api/v1/finance/accounts/me            — user's accounts + balances
GET  /api/v1/finance/accounts/:id/balance   — computed balance
GET  /api/v1/finance/accounts/:id/statement — paginated ledger entries
```

### Deposits
```
POST /api/v1/finance/deposit                — initiate deposit via payment gateway
POST /api/v1/finance/payment-webhook/:gateway — payment gateway webhook
```

### Escrow
```
POST /api/v1/finance/escrow                           — create escrow account [admin, system]
GET  /api/v1/finance/escrow/:id                       — escrow details + balance + conditions
POST /api/v1/finance/escrow/:id/deposit               — deposit funds to escrow
POST /api/v1/finance/escrow/:id/release-request       — request release [buyer, project_owner]
POST /api/v1/finance/escrow/:id/release-request/:reqId/approve-buyer   [buyer]
POST /api/v1/finance/escrow/:id/release-request/:reqId/approve-admin   [admin]
GET  /api/v1/admin/finance/pending-releases           [admin]
```

### Reporting
```
GET /api/v1/finance/transactions            — own transaction history
GET /api/v1/finance/commission-summary      [agent] — commission earned
GET /api/v1/admin/finance/platform-summary  [admin] — platform financial overview
GET /api/v1/admin/finance/export            [admin] — CSV/PDF export
```

---

## Balance Computation
Balances are **never stored** — always computed:
```sql
SELECT
  SUM(CASE WHEN credit_account_id = $accountId THEN amount ELSE 0 END)
  - SUM(CASE WHEN debit_account_id = $accountId THEN amount ELSE 0 END) AS balance
FROM financial.ledger_entries
WHERE (credit_account_id = $accountId OR debit_account_id = $accountId)
  AND status = 'completed';
```

---

## Commission Structure
Platform commission on property sales:
- Default: **2.5%** of agreed sale price
- Distributed on Stage 14 completion:
  - Platform: 1.5%
  - Agent: 1.0%

On escrow release, commissions are split automatically by creating ledger entries.

---

## Payment Gateway Webhooks
Handle idempotently using `gateway_reference` as unique key:
1. Receive webhook
2. Verify signature (gateway-specific)
3. Check if already processed (idempotency)
4. Update `payment_requests` status
5. If success → create ledger entry to credit user's account
6. Emit `payment.completed` event to message broker

---

## Multi-Currency Support
- All internal accounting in **USD** (base currency)
- Display amounts in user's preferred currency
- Exchange rates fetched from: [Open Exchange Rates API](https://openexchangerates.org)
- Rates cached in Redis, refreshed every 1 hour
- `exchange_rate` column stored on every ledger entry at time of transaction

---

## Idempotency
All financial operations must accept an `Idempotency-Key` header.
Server stores this key with the result. Duplicate requests return the stored result without re-processing.

---

## Security Requirements
- MFA required before initiating any escrow release
- High-value threshold: any single transaction > $10,000 requires admin approval
- All financial API endpoints require valid JWT with correct role
- IP logged on all financial actions
- No financial data in application logs — only references (IDs)

---

## Acceptance Criteria
- [ ] User can deposit funds via Stripe (test mode)
- [ ] Escrow account created with conditions for sale Stage 5
- [ ] Escrow balance correctly reflects deposits and holds
- [ ] Release requires two approvals (buyer + admin)
- [ ] Commission distributed automatically on final release
- [ ] Duplicate webhook does not create duplicate ledger entry
- [ ] Balance computed from ledger always matches expected value
- [ ] Transaction history paginates correctly
- [ ] CSV export contains all required fields
- [ ] All financial actions logged in audit table with amounts

---

## Dependencies
- Sprint 02 (auth, user accounts)
- Sprint 04 (sale stages trigger escrow conditions)

## Blocks
- Sprint 06 (construction milestone payments use this escrow)
- Sprint 10 (logistics delivery payments)
