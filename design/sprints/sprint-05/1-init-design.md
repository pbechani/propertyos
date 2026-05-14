# Sprint 05 — Escrow & Financial Ledger
## Pre-Sprint Context: Platform State as of 11 March 2026

**Branch:** `feature/sprint-03-kickoff`
**Default Branch:** `init-design`
**Test Suite:** 569 total tests | 569 passing | 0 failures | 44 suites
**DB Migrations Applied:** 21 (last: `202603100021_mandate_seller_fields`)
**Previous Sprints:** 01 ✅ | 01-b ✅ | 02 ✅ | 02.1 ✅ | 03 ✅ | 04 ✅ | 04-enhanced ✅

> This document is the single source of context for Sprint 05 implementation. It describes the exact state of the codebase, what patterns are established, what Sprint 05 must implement, and the precise steps to do so. Read from top to bottom before writing a single line of code.

---

## 1. Sprint Audit Summary

| Sprint | Scope | Grade | Status | Tests |
|--------|-------|-------|--------|-------|
| Sprint 01 | Infrastructure: Docker, CI/CD, Vault, ELK, Prometheus | A+ | ✅ COMPLETE | 21 E2E |
| Sprint 01-b | Company management, member/invite lifecycle | ✅ PASS | ✅ COMPLETE | 46 |
| Sprint 02 | JWT auth, 9-role RBAC, KYC state machine, audit logs | PASS (3 rounds) | ✅ COMPLETE | 152 |
| Sprint 02.1 | SendGrid/Twilio adapters, signed KYC URLs, access control | ✅ PASS | ✅ COMPLETE | incl. in 152 |
| Sprint 03 | Property marketplace, PostGIS search, verification, fraud | A | ✅ COMPLETE | 40 |
| Sprint 04 | 14-stage sales pipeline, conveyancer, escrow triggers | ✅ PASS | ✅ COMPLETE | ~150 |
| Sprint 04-enhanced | OTP, multi-buyer/seller, capital gains stage (ZA) | ✅ PASS | ✅ COMPLETE | included |

**Sprint 05 prerequisite check:** Sprints 02 and 04 are both complete. `company_id` column already exists on financial transactions (migration `202603020009`). `sales.sale_stage_progress` has stage completion events that Sprint 05 will use as escrow release conditions. ✅ Safe to proceed.

---

## 2. Platform State Summary

### 2.1 Infrastructure (Sprint 01)
| Component | Detail |
|-----------|--------|
| **Database** | PostgreSQL + PostGIS (`postgis/postgis:15-alpine`). 12 bounded-context schemas live: `identity`, `property`, `sales`, `financial`, `construction`, `marketplace`, `logistics`, `inspection`, `analytics`, `ai_engine`, `audit`, `common` |
| **Cache** | Redis 7 (AOF persistence) — key patterns established; exchange rate caching required in Sprint 05 |
| **Message Broker** | RabbitMQ 3 — `payment.completed`, `escrow.released` events must be emitted here |
| **Object Storage** | MinIO (S3-compatible) — not used by Sprint 05 |
| **Secrets** | HashiCorp Vault (env-var fallback) — payment gateway API keys must be loaded via Vault/env |
| **Observability** | Prometheus + Grafana + ELK stack — financial operation metrics should expose custom Prometheus counters |

### 2.2 Identity Layer (Sprint 02)
- 9 roles seeded: `admin`, `agent`, `buyer`, `seller`, `contractor`, `supplier`, `inspector`, `truck_operator`, `conveyancer`
- JWT payload (`JwtPayload`): `sub`, `email`, `roles`, `kyc_status`, `active_company_id`, `active_company_role`, `active_company_is_admin`
- `RolesGuard` + `@Roles()` decorator — reuse on all financial endpoints
- `AuditService` (`identity/audit.service.ts`) — call for every financial action
- `NotificationService` — use for payment confirmations, release approvals, failed gateway alerts
- MFA (TOTP) is stubbed in Sprint 02 but **not fully implemented**. Sprint 05 security spec requires MFA before escrow release. Per the deferred items list: validate MFA OTP via a flag in the JWT or a short-lived Redis token (`mfa_verified:{userId}:{nonce}` — 5 min TTL). Do not block Sprint 05 on full TOTP; implement a "MFA intent" flow using an email OTP challenge as a stand-in.

### 2.3 Company Layer (Sprint 01-b)
- `company_id` is present on sales transactions (migration 009). Financial accounts must also be scoped to `company_id` where the owner is acting as a company (agent firm, contractor company).
- `CompanyContextGuard` and `CompanyAdminGuard` are available in `identity/companies/guards/` — use for admin-level financial actions within a company context.

### 2.4 Property Layer (Sprint 03)
- `property.properties` table has `status` and `price` columns. On escrow account creation for a sale, price is the seeded funding target.
- No direct dependency; escrow creation references `property_id` via the sale record.

### 2.5 Sales Layer (Sprint 04 + Enhanced)
This is the primary trigger surface for Sprint 05.

| Table / Concept | Sprint 05 Relevance |
|-----------------|---------------------|
| `sales.property_sales` | `escrow_account_id` FK must be added — escrow account is linked to the sale on creation |
| `sales.sale_stage_progress` | Stage completion events trigger escrow condition satisfaction checks |
| `sales.stage_configs` | Stage 5 (Deposit to Escrow) is the deposit trigger; Stage 15 (Final Payment / ZA) is the full release trigger |
| `sales.sale_buyers` / `sales.sale_sellers` | Multi-buyer/co-purchaser — escrow release requires the primary buyer's approval signature |
| `sales.audit_logs` | Escrow actions that originate from a stage transition must also write a `sales.audit_log` entry |

**Current stage numbering (ZA, 15 stages):**
- Stage 5 = Deposit to Escrow (blocker) → creates escrow hold
- Stage 15 = Final Payment & Handover → triggers full escrow release

---

## 3. Architecture Decisions for Sprint 05

### 3.1 Event-Sourced Financial Schema (PDR-003)
The `financial.*` schema is **event-sourced**. This means:
- Balances are **never stored** — always computed from `financial.ledger_entries` via `SUM(credits) - SUM(debits)`
- `financial.ledger_entries` is append-only — no UPDATE or DELETE ever
- An immutable DB trigger must prevent any modification: `BEFORE UPDATE OR DELETE` on `ledger_entries` raises an exception
- All state reconstruction (balance at a point in time, dispute investigation) is achievable from the event log alone

This is a departure from every other schema in the platform. **Do not copy the CRUD patterns from `sales.*` or `property.*` for the ledger table.**

### 3.2 Idempotency at Every Layer
Financial operations must be idempotent at three levels:
1. **Application layer:** `idempotency_key` column on `ledger_entries` (UNIQUE constraint). Duplicate requests with the same key return the stored entry without re-processing.
2. **Gateway webhook layer:** `gateway_reference` on `payment_requests` (UNIQUE). A duplicate webhook for the same payment is a no-op.
3. **HTTP layer:** Clients send `Idempotency-Key` header. Server stores `idempotency:{key}` → serialized response in Redis (TTL 24h). Second request returns cached response.

### 3.3 Double-Entry Accounting Convention
Every financial event creates exactly **two ledger entries** (debit and credit) that net to zero:
- Deposit: debit `platform.incoming` account → credit `user.wallet` account
- Escrow hold: debit `user.wallet` → credit `sale.escrow` account
- Escrow release: debit `sale.escrow` → credit `seller.wallet`
- Commission: debit `sale.escrow` → credit `platform.commission` + `agent.commission`

The `debit_account_id` + `credit_account_id` pair on a single `ledger_entries` row encodes the double-entry relationship. Each row records one side; implement a `createEntry(debit, credit, amount, ...)` helper that inserts one row capturing both sides on a single atomic write.

### 3.4 Module Location
```
apps/api/src/financial/
```
Register `FinancialModule` in `apps/api/src/app.module.ts` (add after `SalesModule`).

### 3.5 Redis Key Patterns for Sprint 05
| Key | TTL | Purpose |
|-----|-----|---------|
| `idempotency:{key}` | 24h | HTTP-layer idempotency cache |
| `exchange_rate:{base}:{target}` | 1h | Cached FX rates from Open Exchange Rates |
| `pending_release:{escrowId}` | 48h | Release request in-flight state |
| `mfa_intent:{userId}:{nonce}` | 5 min | Email OTP challenge for escrow release MFA |

---

## 4. Database Implementation Steps

### Step 4.1 — Migration File
Create migration: `apps/api/prisma/migrations/202603110022_sprint05_financial_escrow/migration.sql`

### Step 4.2 — Tables to Create

#### `financial.accounts`
```sql
CREATE TABLE financial.accounts (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number   VARCHAR(30)  UNIQUE NOT NULL,
  account_type     VARCHAR(30)  NOT NULL,     -- escrow | user_wallet | operational | commission | fee
  owner_id         UUID,                      -- NULL for platform accounts; references identity.users(id) by convention only (no FK)
  owner_type       VARCHAR(30),               -- user | platform | sale | project
  reference_id     UUID,                      -- sale_id or project_id if linked
  company_id       UUID,                      -- NULL for individual wallets
  currency         CHAR(3)      NOT NULL DEFAULT 'USD',
  status           VARCHAR(20)  NOT NULL DEFAULT 'active',  -- active | frozen | closed
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ON financial.accounts (owner_id);
CREATE INDEX ON financial.accounts (reference_id);
CREATE INDEX ON financial.accounts (company_id);
CREATE INDEX ON financial.accounts (owner_type, account_type);
```

**Platform seed accounts (insert on migration):**
- `PLATFORM-INCOMING-USD` — type `operational`, owner_type `platform`
- `PLATFORM-COMMISSION-USD` — type `commission`, owner_type `platform`
- `PLATFORM-FEE-USD` — type `fee`, owner_type `platform`

#### `financial.ledger_entries` (APPEND-ONLY — NEVER UPDATE/DELETE)
```sql
CREATE TABLE financial.ledger_entries (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_reference      VARCHAR(50)    UNIQUE NOT NULL,
  entry_type           VARCHAR(50)    NOT NULL,  -- deposit | withdrawal | escrow_hold | escrow_release | transfer | commission | fee | refund
  debit_account_id     UUID           NOT NULL,  -- references financial.accounts(id) — app-layer only
  credit_account_id    UUID           NOT NULL,  -- references financial.accounts(id) — app-layer only
  amount               NUMERIC(18,8)  NOT NULL CHECK (amount > 0),
  currency             CHAR(3)        NOT NULL,
  exchange_rate        NUMERIC(18,8)  NOT NULL DEFAULT 1,
  base_currency_amount NUMERIC(18,8)  NOT NULL,  -- always USD; computed at write time
  description          TEXT,
  metadata             JSONB,         -- {sale_id, project_id, stage_number, gateway_ref}
  initiated_by         UUID,          -- references identity.users(id) — app-layer only
  approved_by          UUID,          -- set on escrow_release entries
  status               VARCHAR(20)    NOT NULL DEFAULT 'completed',  -- pending | completed | failed | reversed
  idempotency_key      VARCHAR(100)   UNIQUE,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX ON financial.ledger_entries (debit_account_id, created_at);
CREATE INDEX ON financial.ledger_entries (credit_account_id, created_at);
CREATE INDEX ON financial.ledger_entries (status, created_at);
CREATE INDEX ON financial.ledger_entries (entry_type, created_at);
CREATE INDEX ON financial.ledger_entries ((metadata->>'sale_id'), created_at);
```

**Immutable trigger (CRITICAL — must be in migration):**
```sql
CREATE OR REPLACE FUNCTION financial.prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'financial.ledger_entries is append-only — no UPDATE or DELETE permitted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_immutable
BEFORE UPDATE OR DELETE ON financial.ledger_entries
FOR EACH ROW EXECUTE FUNCTION financial.prevent_ledger_modification();
```

#### `financial.escrow_conditions`
```sql
CREATE TABLE financial.escrow_conditions (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_account_id   UUID         NOT NULL,  -- references financial.accounts(id)
  condition_type      VARCHAR(50)  NOT NULL,  -- stage_completion | inspection_pass | manual_approval | time_based
  condition_details   JSONB,                  -- {"stage_number": 5, "sale_id": "uuid"}
  is_satisfied        BOOLEAN      NOT NULL DEFAULT FALSE,
  satisfied_at        TIMESTAMPTZ,
  satisfied_by        UUID,                   -- user who triggered the condition satisfaction
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ON financial.escrow_conditions (escrow_account_id, is_satisfied);
```

#### `financial.payment_requests`
```sql
CREATE TABLE financial.payment_requests (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        UUID         NOT NULL,   -- destination account
  amount            NUMERIC(18,2) NOT NULL,
  currency          CHAR(3)      NOT NULL,
  payment_method    VARCHAR(30),             -- stripe | flutterwave | paystack | bank_transfer
  gateway_reference VARCHAR(255) UNIQUE,     -- idempotency: one gateway ref → one ledger entry
  gateway_status    VARCHAR(30),
  gateway_response  JSONB,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  initiated_by      UUID,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ON financial.payment_requests (account_id, status);
CREATE INDEX ON financial.payment_requests (gateway_reference);
```

#### `financial.escrow_releases`
```sql
CREATE TABLE financial.escrow_releases (
  id                     UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_account_id      UUID           NOT NULL,
  release_amount         NUMERIC(18,2)  NOT NULL,
  currency               CHAR(3)        NOT NULL,
  destination_account_id UUID           NOT NULL,
  reason                 TEXT,
  status                 VARCHAR(20)    NOT NULL DEFAULT 'pending',  -- pending | approved | rejected | completed
  requested_by           UUID           NOT NULL,
  requested_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  buyer_approved_at      TIMESTAMPTZ,
  admin_approved_at      TIMESTAMPTZ,
  admin_approver_id      UUID,
  released_at            TIMESTAMPTZ,
  mfa_verified           BOOLEAN        NOT NULL DEFAULT FALSE,
  rejection_reason       TEXT
);
CREATE INDEX ON financial.escrow_releases (escrow_account_id, status);
CREATE INDEX ON financial.escrow_releases (requested_by, status);
```

#### `financial.exchange_rate_snapshots`
```sql
CREATE TABLE financial.exchange_rate_snapshots (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  base        CHAR(3)      NOT NULL DEFAULT 'USD',
  target      CHAR(3)      NOT NULL,
  rate        NUMERIC(18,8) NOT NULL,
  source      VARCHAR(50)  NOT NULL DEFAULT 'open_exchange_rates',
  fetched_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ON financial.exchange_rate_snapshots (base, target, fetched_at DESC);
```
> Purpose: Audit trail of rates used for historical ledger entry reconstruction. Redis is the live cache; this table is the persistent record.

#### `financial.audit_logs` (Append-Only)
```sql
CREATE TABLE financial.audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID        NOT NULL,
  action        VARCHAR(100) NOT NULL,  -- e.g. 'escrow.release.requested', 'deposit.completed'
  resource_type VARCHAR(50),
  resource_id   UUID,
  amount        NUMERIC(18,8),          -- NULL for non-monetary actions
  currency      CHAR(3),
  metadata      JSONB,
  ip            INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON financial.audit_logs (actor_id, created_at);
CREATE INDEX ON financial.audit_logs (resource_id, created_at);

CREATE OR REPLACE FUNCTION financial.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'financial.audit_logs is immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_financial_audit_immutable
BEFORE UPDATE OR DELETE ON financial.audit_logs
FOR EACH ROW EXECUTE FUNCTION financial.prevent_audit_modification();
```

#### Add `escrow_account_id` to `sales.property_sales`
```sql
ALTER TABLE sales.property_sales
  ADD COLUMN escrow_account_id UUID;
CREATE INDEX ON sales.property_sales (escrow_account_id);
```
> This must be in the same migration. The column is nullable initially — escrow is created after Stage 4 (OTP signed).

### Step 4.3 — Balance View (Optional Convenience)
```sql
CREATE VIEW financial.account_balances AS
SELECT
  a.id AS account_id,
  a.account_number,
  a.account_type,
  a.owner_id,
  a.currency,
  COALESCE(SUM(CASE WHEN le.credit_account_id = a.id THEN le.base_currency_amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN le.debit_account_id  = a.id THEN le.base_currency_amount ELSE 0 END), 0) AS balance_usd
FROM financial.accounts a
LEFT JOIN financial.ledger_entries le
  ON (le.credit_account_id = a.id OR le.debit_account_id = a.id)
  AND le.status = 'completed'
GROUP BY a.id;
```
> Use for the admin platform summary endpoint. For user-facing balance, compute inline in the service to avoid stale view state.

---

## 5. Prisma Schema Additions

Add to `apps/api/prisma/schema.prisma` (inside the `financial` schema block):

```prisma
model FinancialAccount {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  accountNumber String   @unique @map("account_number") @db.VarChar(30)
  accountType   String   @map("account_type") @db.VarChar(30)
  ownerId       String?  @map("owner_id") @db.Uuid
  ownerType     String?  @map("owner_type") @db.VarChar(30)
  referenceId   String?  @map("reference_id") @db.Uuid
  companyId     String?  @map("company_id") @db.Uuid
  currency      String   @default("USD") @db.Char(3)
  status        String   @default("active") @db.VarChar(20)
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  ledgerDebits   LedgerEntry[] @relation("DebitAccount")
  ledgerCredits  LedgerEntry[] @relation("CreditAccount")
  escrowConditions EscrowCondition[]
  releasesAsEscrow EscrowRelease[] @relation("EscrowAccount")
  releasesAsDestination EscrowRelease[] @relation("DestinationAccount")
  paymentRequests PaymentRequest[]

  @@map("accounts")
  @@schema("financial")
}

model LedgerEntry {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  entryReference     String   @unique @map("entry_reference") @db.VarChar(50)
  entryType          String   @map("entry_type") @db.VarChar(50)
  debitAccountId     String   @map("debit_account_id") @db.Uuid
  creditAccountId    String   @map("credit_account_id") @db.Uuid
  amount             Decimal  @db.Decimal(18, 8)
  currency           String   @db.Char(3)
  exchangeRate       Decimal  @default(1) @map("exchange_rate") @db.Decimal(18, 8)
  baseCurrencyAmount Decimal  @map("base_currency_amount") @db.Decimal(18, 8)
  description        String?  @db.Text
  metadata           Json?    @db.JsonB
  initiatedBy        String?  @map("initiated_by") @db.Uuid
  approvedBy         String?  @map("approved_by") @db.Uuid
  status             String   @default("completed") @db.VarChar(20)
  idempotencyKey     String?  @unique @map("idempotency_key") @db.VarChar(100)
  createdAt          DateTime @default(now()) @map("created_at") @db.Timestamptz

  debitAccount  FinancialAccount @relation("DebitAccount",  fields: [debitAccountId],  references: [id])
  creditAccount FinancialAccount @relation("CreditAccount", fields: [creditAccountId], references: [id])

  @@map("ledger_entries")
  @@schema("financial")
}

model EscrowCondition {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  escrowAccountId  String    @map("escrow_account_id") @db.Uuid
  conditionType    String    @map("condition_type") @db.VarChar(50)
  conditionDetails Json?     @map("condition_details") @db.JsonB
  isSatisfied      Boolean   @default(false) @map("is_satisfied")
  satisfiedAt      DateTime? @map("satisfied_at") @db.Timestamptz
  satisfiedBy      String?   @map("satisfied_by") @db.Uuid
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz

  escrowAccount FinancialAccount @relation(fields: [escrowAccountId], references: [id])

  @@map("escrow_conditions")
  @@schema("financial")
}

model PaymentRequest {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  accountId        String    @map("account_id") @db.Uuid
  amount           Decimal   @db.Decimal(18, 2)
  currency         String    @db.Char(3)
  paymentMethod    String?   @map("payment_method") @db.VarChar(30)
  gatewayReference String?   @unique @map("gateway_reference") @db.VarChar(255)
  gatewayStatus    String?   @map("gateway_status") @db.VarChar(30)
  gatewayResponse  Json?     @map("gateway_response") @db.JsonB
  status           String    @default("pending") @db.VarChar(20)
  initiatedBy      String?   @map("initiated_by") @db.Uuid
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  account FinancialAccount @relation(fields: [accountId], references: [id])

  @@map("payment_requests")
  @@schema("financial")
}

model EscrowRelease {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  escrowAccountId      String    @map("escrow_account_id") @db.Uuid
  releaseAmount        Decimal   @map("release_amount") @db.Decimal(18, 2)
  currency             String    @db.Char(3)
  destinationAccountId String    @map("destination_account_id") @db.Uuid
  reason               String?   @db.Text
  status               String    @default("pending") @db.VarChar(20)
  requestedBy          String    @map("requested_by") @db.Uuid
  requestedAt          DateTime  @default(now()) @map("requested_at") @db.Timestamptz
  buyerApprovedAt      DateTime? @map("buyer_approved_at") @db.Timestamptz
  adminApprovedAt      DateTime? @map("admin_approved_at") @db.Timestamptz
  adminApproverId      String?   @map("admin_approver_id") @db.Uuid
  releasedAt           DateTime? @map("released_at") @db.Timestamptz
  mfaVerified          Boolean   @default(false) @map("mfa_verified")
  rejectionReason      String?   @map("rejection_reason") @db.Text

  escrowAccount      FinancialAccount @relation("EscrowAccount",      fields: [escrowAccountId],      references: [id])
  destinationAccount FinancialAccount @relation("DestinationAccount", fields: [destinationAccountId], references: [id])

  @@map("escrow_releases")
  @@schema("financial")
}

model ExchangeRateSnapshot {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  base      String   @default("USD") @db.Char(3)
  target    String   @db.Char(3)
  rate      Decimal  @db.Decimal(18, 8)
  source    String   @default("open_exchange_rates") @db.VarChar(50)
  fetchedAt DateTime @default(now()) @map("fetched_at") @db.Timestamptz

  @@map("exchange_rate_snapshots")
  @@schema("financial")
}

model FinancialAuditLog {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  actorId      String    @map("actor_id") @db.Uuid
  action       String    @db.VarChar(100)
  resourceType String?   @map("resource_type") @db.VarChar(50)
  resourceId   String?   @map("resource_id") @db.Uuid
  amount       Decimal?  @db.Decimal(18, 8)
  currency     String?   @db.Char(3)
  metadata     Json?     @db.JsonB
  ip           String?   @db.Inet
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz

  @@map("audit_logs")
  @@schema("financial")
}
```

After adding these models, run:
```bash
cd apps/api && npx prisma generate
```

---

## 6. NestJS Module Structure

```
apps/api/src/financial/
├── financial.module.ts
├── financial.constants.ts        -- Enums: AccountType, EntryType, EscrowStatus, ReleaseStatus, PaymentMethod
├── financial.dto.ts              -- All request/response DTOs with class-validator
├── account.service.ts            -- Account CRUD + provisioning
├── account.service.spec.ts
├── ledger.service.ts             -- Core double-entry write + balance compute
├── ledger.service.spec.ts
├── escrow.service.ts             -- Escrow lifecycle: create, deposit, conditions, release
├── escrow.service.spec.ts
├── payment-gateway.service.ts    -- Stripe + Flutterwave/Paystack adapters
├── payment-gateway.service.spec.ts
├── exchange-rate.service.ts      -- Redis-cached FX rates + snapshot persist
├── exchange-rate.service.spec.ts
├── commission.service.ts         -- Commission split calculation + ledger entries
├── commission.service.spec.ts
├── financial-audit.service.ts    -- Append-only writer → financial.audit_logs
├── financial.controller.ts       -- User-facing: accounts, deposits, transactions
├── escrow.controller.ts          -- Escrow CRUD + release workflow
├── admin-finance.controller.ts   -- Admin: pending releases, platform summary, export
└── index.ts
```

Register in `apps/api/src/app.module.ts`:
```typescript
import { FinancialModule } from './financial/financial.module';
// ...
@Module({ imports: [..., SalesModule, FinancialModule] })
```

---

## 7. Service Implementation Guide

### 7.1 `LedgerService` — The Core Engine

`LedgerService` is the **only** service that writes to `financial.ledger_entries`. All other services call it; they never write to the ledger directly.

```typescript
async createEntry(params: {
  entryType: EntryType;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
  initiatedBy: string;
  idempotencyKey?: string;
}): Promise<LedgerEntry>
```

**Balance computation — always use this, never cache the result:**
```typescript
async getBalance(accountId: string): Promise<{ balance: number; currency: string }>
// SQL: SUM(credit amounts) - SUM(debit amounts) WHERE status = 'completed'
```

**Statement (paginated):**
```typescript
async getStatement(accountId: string, params: { page: number; limit: number; from?: Date; to?: Date }): Promise<{ entries: LedgerEntry[]; total: number }>
```

Edge cases to test:
- Idempotency key collision → return existing entry, do not insert
- `amount <= 0` → throw `BadRequestException`
- Either account ID not found → throw `NotFoundException`
- Database trigger fires on any UPDATE attempt → must never be called; if it is, `InternalServerErrorException`

### 7.2 `AccountService`

```typescript
async provision(params: { ownerId: string; ownerType: string; accountType: AccountType; currency: string; referenceId?: string; companyId?: string }): Promise<FinancialAccount>
async getOrProvision(params): Promise<FinancialAccount>     // used by EscrowService on sale escrow creation
async freeze(accountId: string, adminId: string): Promise<void>
async close(accountId: string, adminId: string): Promise<void>
async getAccountsForUser(userId: string): Promise<FinancialAccount[]>
```

*Account provisioning for a new user wallet happens lazily on their first deposit — do not provision on registration.*

### 7.3 `EscrowService`

```typescript
async createForSale(saleId: string, currency: string, requestedBy: string): Promise<FinancialAccount>
// - Calls accountService.provision({ ownerType: 'sale', accountType: 'escrow', referenceId: saleId })
// - Updates sales.property_sales SET escrow_account_id = newAccount.id
// - Seeds EscrowCondition: { conditionType: 'stage_completion', conditionDetails: { stage_number: 5, sale_id } }
// - Seeds EscrowCondition: { conditionType: 'stage_completion', conditionDetails: { stage_number: 15, sale_id } }  (ZA final release)
// - Writes financial.audit_log

async depositToEscrow(escrowAccountId: string, amount: number, currency: string, userId: string, idempotencyKey: string): Promise<LedgerEntry>
// - Ensure escrow account exists and is active
// - Ensure user wallet has sufficient balance (balance check)
// - Calls ledgerService.createEntry({ type: 'escrow_hold', debit: userWallet, credit: escrowAccount })

async satisfyCondition(conditionId: string, satisfiedBy: string): Promise<void>
// - Sets is_satisfied = true, satisfied_at = NOW(), satisfied_by
// - Check if all conditions for the escrow are now satisfied → if yes, emit 'escrow.conditions_met' event to RabbitMQ

async requestRelease(escrowAccountId: string, params: RequestReleaseDto, requestedBy: string): Promise<EscrowRelease>
// - Validate escrow.status = 'active'
// - Validate release_amount ≤ computedBalance
// - Create financial.escrow_releases record (status = 'pending')
// - Trigger MFA intent email OTP for requestedBy
// - Write financial.audit_log

async approveBuyer(releaseId: string, buyerId: string, mfaOtp: string): Promise<EscrowRelease>
// - Validate mfaOtp against Redis key mfa_intent:{buyerId}:{nonce}
// - Set buyer_approved_at; if admin also approved → call executeRelease()

async approveAdmin(releaseId: string, adminId: string): Promise<EscrowRelease>
// - Admin requires active JWT with role 'admin'
// - Set admin_approved_at, admin_approver_id; if buyer also approved → call executeRelease()

private async executeRelease(release: EscrowRelease): Promise<void>
// - Calls ledgerService.createEntry({ type: 'escrow_release', debit: escrowAccount, credit: destinationAccount })
// - Then calls commissionService.distributeCommission() for the linked sale
// - Set release.status = 'completed', released_at = NOW()
// - Emit 'escrow.released' to RabbitMQ
// - Write financial.audit_log
```

### 7.4 `PaymentGatewayService`

Provides a unified interface over Stripe and Flutterwave/Paystack:

```typescript
async initiateDeposit(params: { userId: string; amount: number; currency: string; paymentMethod: PaymentMethod; idempotencyKey: string }): Promise<{ paymentUrl: string; gatewayReference: string }>

async handleWebhook(gateway: string, payload: unknown, signature: string): Promise<void>
// - Verify webhook signature (gateway-specific: Stripe-Signature header, Flutterwave x-flw-signature)
// - Look up payment_request by gateway_reference
// - If already status = 'completed' → return (idempotency)
// - If gateway reports success → call ledgerService.createEntry({ type: 'deposit', debit: PLATFORM-INCOMING, credit: userWallet })
// - Update payment_request.status → 'completed'
// - Emit 'payment.completed' to RabbitMQ
```

**Security note:** Webhook endpoints are **unauthenticated** (called by the gateway, not the user). They MUST verify the gateway signature before processing. Invalid signatures → return HTTP 400 immediately, log the attempt.

**Stripe test mode:** Use `STRIPE_SECRET_KEY=sk_test_...` from environment. Never hardcode.

Env vars to add to `apps/api/src/config/env.validation.ts`:
```
STRIPE_SECRET_KEY          Joi.string().required()
STRIPE_WEBHOOK_SECRET      Joi.string().required()
FLUTTERWAVE_SECRET_KEY     Joi.string().optional()
FLUTTERWAVE_WEBHOOK_SECRET Joi.string().optional()
OPEN_EXCHANGE_RATES_APP_ID Joi.string().required()
HIGH_VALUE_THRESHOLD_USD   Joi.number().default(10000)
COMMISSION_PLATFORM_PCT    Joi.number().default(1.5)
COMMISSION_AGENT_PCT       Joi.number().default(1.0)
```

### 7.5 `ExchangeRateService`

```typescript
async getRate(base: string, target: string): Promise<number>
// 1. Check Redis: GET exchange_rate:{base}:{target}
// 2. Cache miss → fetch from Open Exchange Rates API
// 3. Store in Redis (TTL 1h) + insert into financial.exchange_rate_snapshots
// 4. Return rate

async toBase(amount: number, currency: string): Promise<{ amountUsd: number; rate: number }>
// Converts any currency amount to USD for ledger entry base_currency_amount
```

### 7.6 `CommissionService`

Called by `EscrowService.executeRelease()` when an escrow is fully released on a final sale completion.

```typescript
async distributeCommission(saleId: string, totalAmount: number, currency: string, escrowAccountId: string, agentId: string, adminId: string): Promise<void>
// Rates from env: COMMISSION_PLATFORM_PCT (default 1.5%), COMMISSION_AGENT_PCT (default 1.0%)
// Steps:
// 1. Compute platformCommission = totalAmount * COMMISSION_PLATFORM_PCT / 100
// 2. Compute agentCommission   = totalAmount * COMMISSION_AGENT_PCT / 100
// 3. ledgerService.createEntry({ type: 'commission', debit: escrow, credit: PLATFORM-COMMISSION })
// 4. ledgerService.createEntry({ type: 'commission', debit: escrow, credit: agentWallet })
// 5. Write financial.audit_log
```

### 7.7 `FinancialAuditService`

```typescript
async log(params: {
  actorId: string;
  action: string;           // e.g. 'escrow.release.requested'
  resourceType?: string;
  resourceId?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}): Promise<void>
// Uses prisma.$executeRaw with gen_random_uuid() — never store amounts in application logs, only in this table
```

---

## 8. API Endpoints

### `FinancialController` (`/api/v1/finance`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/accounts/me` | authenticated | User's accounts + computed balances |
| `GET` | `/accounts/:id/balance` | account owner / admin | Computed balance for one account |
| `GET` | `/accounts/:id/statement` | account owner / admin | Paginated ledger entries (`?page&limit&from&to`) |
| `POST` | `/deposit` | authenticated | Initiate deposit via payment gateway |
| `POST` | `/payment-webhook/stripe` | **public** (gateway) | Stripe webhook — verify signature |
| `POST` | `/payment-webhook/flutterwave` | **public** (gateway) | Flutterwave webhook — verify signature |
| `GET` | `/transactions` | authenticated | Own transaction history (paginated) |
| `GET` | `/commission-summary` | `agent` | Commission earned by the calling agent |

### `EscrowController` (`/api/v1/finance/escrow`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | `admin`, `system` | Create escrow account for a sale |
| `GET` | `/:id` | sale parties | Escrow details, balance, conditions |
| `POST` | `/:id/deposit` | `buyer` | Deposit funds to escrow |
| `POST` | `/:id/release-request` | `buyer`, `project_owner` | Request partial or full release |
| `POST` | `/:id/release-request/:reqId/approve-buyer` | `buyer` | Buyer approval (requires MFA OTP) |
| `POST` | `/:id/release-request/:reqId/approve-admin` | `admin` | Admin approval |

### `AdminFinanceController` (`/api/v1/admin/finance`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/pending-releases` | `admin` | All escrow releases awaiting approval |
| `GET` | `/platform-summary` | `admin` | Total deposits, escrow held, commissions earned |
| `GET` | `/export` | `admin` | CSV export of ledger entries (`?from&to&type`) |

---

## 9. Business Rules

1. **Balance sufficiency before escrow hold:** `EscrowService.depositToEscrow` must verify `userWallet.balance >= amount` before writing any ledger entry. Insufficient funds → `BadRequestException('Insufficient wallet balance')`.

2. **Escrow account immutability:** Once an escrow's `status = 'closed'`, no further deposits or withdrawals. Attempts throw `ConflictException`.

3. **Multi-signature release:** A release moves from `pending` to `approved` only when **both** `buyer_approved_at IS NOT NULL` AND `admin_approved_at IS NOT NULL`. Either approval alone does not execute the release.

4. **MFA on release request:** Before `requestRelease()` succeeds, the system sends a 6-digit email OTP to the requesting user. That OTP must be verified via `approveBuyer()`. The OTP is stored in Redis as `mfa_intent:{userId}:{nonce}` with 5 min TTL.

5. **High-value threshold:** Any single release > `HIGH_VALUE_THRESHOLD_USD` (default $10,000) emits a `financial.high_value_release` event to RabbitMQ and logs an alert entry in `financial.audit_logs`. The threshold is configurable via env var.

6. **No financial data in application logs:** `LedgerService` and `EscrowService` must NEVER log `amount`, `account_number`, or `balance` values using NestJS `Logger`. Only log event names and resource IDs. All monetary values go exclusively into the DB tables.

7. **Commission distribution timing:** Commission is distributed only when the final escrow release (linked to Stage 15 completion for ZA) executes. Partial releases do not trigger commissions.

8. **Exchange rate snapshot at write time:** Every `LedgerEntry` stores the exchange rate at the moment of creation. The `base_currency_amount` (USD) must be computed and stored immediately — never recomputed retroactively.

9. **Idempotent webhook processing:** If `gateway_reference` already exists in `financial.payment_requests` with `status = 'completed'`, the webhook handler returns HTTP 200 immediately without inserting a new ledger entry.

10. **Account number format:** `PRFIN-{ownerId_first8}-{random6}` — generated in `AccountService.provision()`. Must be unique (enforced by DB UNIQUE constraint).

---

## 10. Test Requirements

Per the project testing policy, every service method requires a unit test covering the happy path plus at least 2 error paths.

### `ledger.service.spec.ts` (minimum 10 tests)
- ✅ Happy path: `createEntry` inserts and returns a ledger entry
- ✅ Idempotency: same `idempotencyKey` returns existing entry without inserting
- ✅ `amount <= 0` throws `BadRequestException`
- ✅ Unknown debit account throws `NotFoundException`
- ✅ Unknown credit account throws `NotFoundException`
- ✅ `getBalance` computes credit minus debit from completed entries
- ✅ `getBalance` returns 0 for account with no entries
- ✅ `getBalance` ignores `status = 'failed'` entries
- ✅ `getStatement` returns paginated entries in descending `created_at` order
- ✅ Prisma UPDATE call triggers exception (mocked DB trigger behavior)

### `account.service.spec.ts` (minimum 8 tests)
- ✅ `provision` creates account with correct `account_number` format
- ✅ `getOrProvision` returns existing account if one matches owner+type
- ✅ `getOrProvision` creates new account if none found
- ✅ `freeze` updates status to `frozen`
- ✅ `close` throws if account has non-zero balance
- ✅ `getAccountsForUser` returns all accounts for a user

### `escrow.service.spec.ts` (minimum 12 tests)
- ✅ `createForSale` provisions escrow account and links to sale record
- ✅ `createForSale` seeds Stage 5 and Stage 15 conditions
- ✅ `depositToEscrow` calls `ledgerService.createEntry` with correct accounts
- ✅ `depositToEscrow` throws if insufficient wallet balance
- ✅ `depositToEscrow` throws if escrow account is frozen
- ✅ `satisfyCondition` updates `is_satisfied = true`
- ✅ `satisfyCondition` emits RabbitMQ event when all conditions met
- ✅ `requestRelease` creates release record in `pending` status
- ✅ `requestRelease` sends MFA OTP (mocked)
- ✅ `approveBuyer` validates MFA OTP from Redis
- ✅ Two approvals trigger `executeRelease`
- ✅ `executeRelease` calls `commissionService.distributeCommission`

### `payment-gateway.service.spec.ts` (minimum 8 tests)
- ✅ `initiateDeposit` returns `paymentUrl` and `gatewayReference`
- ✅ `handleWebhook('stripe')` verifies Stripe signature
- ✅ Invalid Stripe signature throws 400
- ✅ `handleWebhook` with already-completed `gateway_reference` is a no-op
- ✅ `handleWebhook` success creates ledger entry via `ledgerService.createEntry`
- ✅ `handleWebhook` success emits `payment.completed` to RabbitMQ

### `exchange-rate.service.spec.ts` (minimum 6 tests)
- ✅ Cache hit: returns rate from Redis without HTTP call
- ✅ Cache miss: fetches from Open Exchange Rates, stores in Redis + DB snapshot
- ✅ `toBase` correctly converts amount using cached rate
- ✅ External API failure throws `ServiceUnavailableException`

### `commission.service.spec.ts` (minimum 5 tests)
- ✅ Creates two ledger entries (platform + agent) with correct amounts
- ✅ Uses env-configured percentages
- ✅ Writes financial audit log on completion

---

## 11. Security Checklist

Before marking Sprint 05 complete:

- [ ] Webhook endpoints validate gateway signatures before any DB write
- [ ] No `amount`, `account_number`, or `balance` values appear in NestJS `Logger` calls
- [ ] All payment gateway keys loaded from environment variables only (no hardcoding)
- [ ] `HIGH_VALUE_THRESHOLD_USD` releases emit audit alerts
- [ ] MFA OTP required and verified before escrow release executes
- [ ] All `/api/v1/finance/*` endpoints (except webhooks) require valid JWT
- [ ] `ParseUUIDPipe` on all `:id` path params
- [ ] Escrow balance check prevents overdraft (debit > credit balance)
- [ ] IP address logged on every `financial.audit_logs` entry
- [ ] idempotency_key uniqueness enforced at DB level (already in migration)

---

## 12. Acceptance Criteria Mapping

From `design/sprints/sprint-05-escrow-payments.md`:

| Criterion | Implementation |
|-----------|---------------|
| User can deposit funds via Stripe (test mode) | `POST /finance/deposit` → `PaymentGatewayService.initiateDeposit` → Stripe checkout session |
| Escrow account created with conditions for sale Stage 5 | `EscrowService.createForSale` seeds Stage 5 condition |
| Escrow balance correctly reflects deposits and holds | `LedgerService.getBalance` — computed not stored |
| Release requires two approvals (buyer + admin) | `EscrowService.approveBuyer` + `approveAdmin` both required before `executeRelease` |
| Commission distributed automatically on final release | `CommissionService.distributeCommission` called from `executeRelease` |
| Duplicate webhook does not create duplicate ledger entry | `gateway_reference` UNIQUE constraint + idempotency check in `handleWebhook` |
| Balance computed from ledger always matches expected value | `LedgerService.getBalance` SQL aggregate from `ledger_entries` |
| Transaction history paginates correctly | `LedgerService.getStatement` with `page`/`limit` params |
| CSV export contains all required fields | `AdminFinanceController` export endpoint — fields: id, type, amount, currency, debit_account, credit_account, created_at, metadata |
| All financial actions logged in audit table with amounts | `FinancialAuditService.log` called from every state-changing service method |

---

## 13. Carry-Forward Deferred Items

| Item | Source | Risk for Sprint 05 |
|------|--------|-------------------|
| OAuth token verification unimplemented | Sprint 02 D1 | Low — no new OAuth flows in Sprint 05 |
| MFA (TOTP) not fully implemented | Sprint 02 D3 | **Medium** — use email OTP as stand-in; document as D1 for Sprint 05 |
| S3 not wired for document storage | Sprint 02 D2 | Low — Sprint 05 has no document uploads |
| Stripe live keys not tested | Sprint 05 new | Low for MVP — test mode sufficient |
| Open Exchange Rates API key required | Sprint 05 new | Medium — service must degrade gracefully if API key absent (default rate = 1, log warning) |

**Sprint 05 Deferred Items (D1–D3):**
- **D1 — TOTP MFA:** Email OTP used as stand-in. Full TOTP (Google Authenticator) should be implemented in Sprint 09 alongside offline-first mobile.
- **D2 — Real-time webhook retries:** If the gateway retries a failed webhook, current idempotency handles it. But we don't yet have a dead-letter queue for webhooks that fail DB writes. Add RabbitMQ dead-letter handling in Sprint 11.
- **D3 — Multi-currency display:** Amounts are stored in USD base. Frontend display conversion uses `ExchangeRateService.getRate()`. Full multi-currency wallet (separate account per currency) is deferred to Phase 3.

---

## 14. Running the Platform Locally

```bash
# Start all infrastructure
docker compose -f docker/docker-compose.yml up -d

# Apply new migration
cd apps/api && npx prisma migrate dev --name sprint05_financial_escrow

# Generate Prisma client after schema changes
cd apps/api && npx prisma generate

# Run API in dev mode (port 3001)
npm run dev --workspace=apps/api

# Run all tests
npm run test --workspace=apps/api

# Run only financial module tests
cd apps/api && npx jest --testPathPattern="financial"

# Type-check (must exit 0 before marking done)
npx tsc --noEmit -p apps/api/tsconfig.json
```

---

## 15. File Location Quick Reference

| What | Where |
|------|-------|
| Sprint 05 spec | `design/sprints/sprint-05-escrow-payments.md` |
| Financial module (to create) | `apps/api/src/financial/` |
| Migration (to create) | `apps/api/prisma/migrations/202603110022_sprint05_financial_escrow/migration.sql` |
| Prisma schema | `apps/api/prisma/schema.prisma` |
| Env validation | `apps/api/src/config/env.validation.ts` |
| AppModule | `apps/api/src/app.module.ts` |
| Sales module (for `escrow_account_id` FK) | `apps/api/src/sales/` |
| Sales Prisma model | `apps/api/prisma/schema.prisma` → `PropertySale` model |
| RabbitMQ client (existing) | `apps/api/src/common/` or wired via `@nestjs/microservices` |
| PrismaService | `apps/api/src/database/prisma.service.ts` |
| RedisService | `apps/api/src/cache/redis.service.ts` |
| AuditService (identity) | `apps/api/src/identity/audit.service.ts` |
| NotificationService | `apps/api/src/identity/notification.service.ts` |
| RolesGuard / JwtAuthGuard | `apps/api/src/identity/rbac/` |
| Web stub (to wire) | `apps/web/src/views/EscrowFinancialDashboard.tsx` |
| Route policy | `apps/web/src/lib/route-policy.ts` |
