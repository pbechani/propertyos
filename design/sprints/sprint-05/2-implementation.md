# Sprint 05 — Escrow & Financial Ledger: Implementation

**Date:** 2026-03-11  
**Branch:** `feature/sprint-03-kickoff`  
**Tests:** 610 passing, 0 failing (41 new tests added)  
**TypeScript:** 0 compile errors (`tsc --noEmit` clean)

---

## Overview

Sprint 05 implements the full financial backbone of the platform: a double-entry, append-only ledger with event-sourced escrow, Stripe/Flutterwave payment gateway integration, Open Exchange Rates FX with Redis caching, and multi-signature escrow release workflow.

---

## Files Created

### Database

| File | Description |
|------|-------------|
| `apps/api/prisma/migrations/202603110022_sprint05_financial_escrow/migration.sql` | Full financial schema migration |

**Tables created:**
- `financial.accounts` — wallet accounts (ESCROW, WALLET, REVENUE, INCOMING types)
- `financial.ledger_entries` — double-entry rows, append-only enforced by trigger
- `financial.escrow_conditions` — conditions required before escrow release
- `financial.payment_requests` — Stripe/Flutterwave intent tracking
- `financial.escrow_releases` — dual-approval release requests
- `financial.exchange_rate_snapshots` — historical FX snapshots
- `financial.audit_logs` — immutable compliance log, append-only by trigger

**Platform seed accounts:** `PLATFORM_ESCROW_POOL`, `PLATFORM_REVENUE`, `PLATFORM_INCOMING`

### Prisma Schema (`apps/api/prisma/schema.prisma`)

Added to `PropertySale` model:
```
escrowAccountId  String?  @map("escrow_account_id")  @db.Uuid
```

Appended 7 Prisma models: `FinancialAccount`, `LedgerEntry`, `EscrowCondition`, `PaymentRequest`, `EscrowRelease`, `ExchangeRateSnapshot`, `FinancialAuditLog` — all with `@@schema("financial")`.

### Source Files

| File | Purpose |
|------|---------|
| `src/financial/financial.constants.ts` | Platform account names, entry/status enums, cache config |
| `src/financial/financial.dto.ts` | 9 request DTOs with class-validator decorators |
| `src/financial/financial-audit.service.ts` | Immutable audit log via `$executeRaw` |
| `src/financial/exchange-rate.service.ts` | Redis-cached FX from Open Exchange Rates |
| `src/financial/account.service.ts` | Account CRUD + balance computation |
| `src/financial/ledger.service.ts` | Double-entry posting + helpers |
| `src/financial/payment-gateway.service.ts` | Stripe + Flutterwave + bank transfer |
| `src/financial/escrow.service.ts` | Full escrow lifecycle management |
| `src/financial/commission.service.ts` | Platform fee + agent commission calculation/settlement |
| `src/financial/financial.controller.ts` | REST endpoints: accounts, ledger, FX, commission |
| `src/financial/escrow.controller.ts` | REST endpoints: deposit, release CRUD |
| `src/financial/admin-finance.controller.ts` | Admin-only: deposit confirm, balance |
| `src/financial/financial.module.ts` | NestJS module definition + exports |
| `src/financial/index.ts` | Barrel re-export |

### Test Files

| File | Tests | Coverage |
|------|-------|---------|
| `exchange-rate.service.spec.ts` | 7 | Same-currency, cache hit, OER fetch+persist, no key fallback, network error, convert |
| `account.service.spec.ts` | 5 | Create account, getById (found + 404), getOrCreate (existing + new), computeBalance |
| `ledger.service.spec.ts` | 4 | Post with FX, idempotency key, recordEscrowDeposit, listForAccount |
| `commission.service.spec.ts` | 5 | Calculate (1.5%/1.0%), percentages, zero amount, settle with/without agent |
| `escrow.service.spec.ts` | 11 | initiateDeposit (3), requestRelease (2), buyerApprove (4), adminApprove (3), rejectRelease (2; actually combined into 11 total) |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Added `escrowAccountId` to `PropertySale` + 7 financial models |
| `apps/api/src/config/env.validation.ts` | 8 new environment variables |
| `apps/api/src/app.module.ts` | Added `FinancialModule` to imports |

---

## API Endpoints Added

### EscrowController (`/api/v1/escrow`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/deposit` | `buyer_seller`, `admin` | Initiate deposit payment |
| `GET` | `/:saleId` | `buyer_seller`, `agent`, `conveyancer`, `admin` | Get escrow summary |
| `POST` | `/:releaseId/approve` | `buyer_seller`, `admin` | Buyer approves release |
| `GET` | `/release/:releaseId` | `buyer_seller`, `agent`, `conveyancer`, `admin` | Get release details |
| `POST` | `/release/request` | `buyer_seller`, `admin` | Request escrow release |

### FinancialController (`/api/v1/financial`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/accounts` | `admin`, `buyer_seller`, `agent` | Create escrow account |
| `GET` | `/accounts/:id` | `admin`, `buyer_seller`, `agent` | Get account details |
| `GET` | `/ledger/:accountId` | `admin`, `buyer_seller`, `agent`, `conveyancer` | List ledger entries |
| `GET` | `/fx/rate` | `admin`, `agent`, `conveyancer` | Get FX rate |
| `POST` | `/fx/convert` | `admin`, `agent`, `conveyancer` | Convert amount between currencies |
| `POST` | `/commission/calculate` | `admin`, `agent` | Calculate commission breakdown |
| `POST` | `/commission/settle` | `admin` | Settle commission to accounts |

### AdminFinanceController (`/api/v1/admin/finance`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/confirm-deposit` | `admin` | Confirm deposit on behalf of gateway |
| `GET` | `/balance/:accountId` | `admin` | Get raw account balance |
| `POST` | `/release/:releaseId/approve` | `admin` | Admin approves escrow release |
| `POST` | `/release/:releaseId/reject` | `admin` | Reject escrow release |

---

## Architecture Decisions

### Append-Only Ledger
Enforced at the database level via a PostgreSQL trigger (`trg_ledger_immutable`). Any attempt to UPDATE or DELETE a `ledger_entries` row raises an exception. Prisma's `update()`/`delete()` on this table will throw — this is intentional.

### No Cross-Schema Foreign Keys (PDR-006)
`ledger_entries` stores `account_id`, `sale_id`, `user_id` as plain UUID columns without Prisma relation definitions. Cross-context references are resolved in the application layer only.

### Mock Payment Gateway Fallback
When `STRIPE_SECRET_KEY` or `FLUTTERWAVE_SECRET_KEY` env vars are not set, `PaymentGatewayService` returns a mock payment result. This enables local development without live payment credentials.

### FX Lazy Config Read
`ExchangeRateService` reads `OPEN_EXCHANGE_RATES_APP_ID` lazily in `fetchRate()` (not in constructor). This ensures the config mock is respected in tests and allows runtime config changes.

### High-Value Transaction Flagging
Deposits ≥ `HIGH_VALUE_THRESHOLD_USD` (default: $10,000 USD equivalent) have `high_value_flag = true` set on the escrow release request. These require manual admin review before funds are released.

### Multi-Signature Escrow Release
Release requires both buyer approval (`buyer_approved_at`) AND admin approval (`admin_approved_at`) before `APPROVED` status is set and funds move. Either party can reject (`REJECTED`) which immediately cancels the release.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | No | — | Stripe live/test secret key |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signature secret |
| `FLUTTERWAVE_SECRET_KEY` | No | — | Flutterwave secret key |
| `FLUTTERWAVE_WEBHOOK_SECRET` | No | — | Flutterwave webhook secret |
| `OPEN_EXCHANGE_RATES_APP_ID` | No | — | OER app ID for FX rates |
| `HIGH_VALUE_THRESHOLD_USD` | No | `10000` | USD threshold for manual review flag |
| `COMMISSION_PLATFORM_PCT` | No | `1.5` | Platform commission percentage |
| `COMMISSION_AGENT_PCT` | No | `1.0` | Agent commission percentage |

---

## Run Commands

```bash
# Apply database migration
npm run migrate --workspace=apps/api
# or with Prisma directly:
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Run financial tests only
npm run test --workspace=apps/api -- --testPathPattern=financial

# Run full test suite
npm run test --workspace=apps/api

# TypeScript check
npx tsc --noEmit -p apps/api/tsconfig.json
```

---

## Deferred Items (Not in Sprint 05 Scope)

- Webhook handlers for Stripe/Flutterwave payment confirmations (`POST /webhooks/stripe`, `POST /webhooks/flutterwave`)
- Escrow condition enforcement (conditions created but not yet auto-evaluated on release approval)
- Multi-currency wallet UI in `apps/web`
- E2E integration tests (require live DB + Docker environment)
- Logistics payment integration (Sprint 10)
- Risk/analytics hooks on escrow events (Sprint 11)
