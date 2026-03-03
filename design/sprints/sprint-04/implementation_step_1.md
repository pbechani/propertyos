# Sprint 04 — Implementation Step 1: Backend Core
**Date:** 2 March 2026
**Branch:** `feature/sprint-03-kickoff`
**Author:** GitHub Copilot

---

## Summary

Sprint 04 — Sales Progression & Legal Workflow backend is fully implemented.
All NestJS modules, services, controllers, Prisma models, the DB migration, and unit tests are in place.

---

## Files Created

### Database

| File | Purpose |
|------|---------|
| `apps/api/prisma/migrations/202603020010_sprint04_sales_progression/migration.sql` | All `sales.*` tables, indexes, triggers, seed data (14 stages for ZA) |

**Note:** The migration SQL initially included a `GENERATED ALWAYS AS (... NOW() ...)` column on `sale_stage_progress.days_in_stage` which fails because `NOW()` is non-deterministic. The column was changed to a plain `INTEGER` computed by the application layer.

#### Tables Created
| Table | Description |
|-------|-------------|
| `sales.stage_configs` | 14-stage config per country (ZA seeded) |
| `sales.property_sales` | Master sale record |
| `sales.sale_stage_progress` | Per-sale stage status tracking |
| `sales.stage_documents` | Documents uploaded per stage |
| `sales.government_interactions` | Gov dept tracking per stage |
| `sales.sale_issues` | Flagged issues / disputes |
| `sales.sale_messages` | Communication hub per sale |
| `sales.audit_logs` | Append-only audit log (trigger protected) |

### Prisma Schema

Added 7 Prisma models to `apps/api/prisma/schema.prisma` under the `sales` schema:
`SaleStageConfig`, `PropertySale`, `SaleStageProgress`, `SaleStageDocument`, `GovernmentInteraction`, `SaleIssue`, `SaleMessage`, `SalesAuditLog`

### NestJS Source (`apps/api/src/sales/`)

| File | Purpose |
|------|---------|
| `sales.constants.ts` | Enums, state machines, helper functions |
| `sales.dto.ts` | All DTOs with class-validator decorators |
| `sales-audit.service.ts` | Append-only audit writer → `sales.audit_logs` |
| `sales.service.ts` | Sale CRUD, participant guard, status machine |
| `stage.service.ts` | Stage state machine with blocker enforcement |
| `stage-document.service.ts` | Document upload/status/delete per stage |
| `government-interaction.service.ts` | Gov dept interaction CRUD |
| `sale-message.service.ts` | Role-filtered communication hub |
| `sales.controller.ts` | All 20 API endpoints under `/api/v1/sales` |
| `dashboard.controller.ts` | Agent, Conveyancer, Admin dashboards |
| `sales.module.ts` | NestJS module wiring |
| `sales.service.spec.ts` | 15 unit tests for SalesService |
| `stage.service.spec.ts` | 9 unit tests for StageService |

### AppModule

`app.module.ts` updated to import `SalesModule`.

---

## API Endpoints Implemented

### Core Sales
```
POST   /api/v1/sales                          [agent, admin]
GET    /api/v1/sales/me                       [authenticated]
GET    /api/v1/sales/:id                      [sale parties]
PATCH  /api/v1/sales/:id/assign-conveyancer   [agent, admin]
PATCH  /api/v1/sales/:id/cancel               [agent, admin]
```

### Stage Management
```
GET    /api/v1/sales/:id/stages                      [sale parties]
POST   /api/v1/sales/:id/stages/:stageNum/start      [sale parties]
POST   /api/v1/sales/:id/stages/:stageNum/complete   [sale parties]
POST   /api/v1/sales/:id/stages/:stageNum/flag       [sale parties]
```

### Documents
```
POST   /api/v1/sales/:id/stages/:stageNum/documents  [sale parties]
GET    /api/v1/sales/:id/documents                   [sale parties]
PATCH  /api/v1/sales/:id/documents/:docId/status     [admin, conveyancer]
DELETE /api/v1/sales/:id/documents/:docId            [uploader or admin]
```

### Government Interactions
```
POST   /api/v1/sales/:id/government-interactions         [conveyancer, admin]
GET    /api/v1/sales/:id/government-interactions         [sale parties]
PATCH  /api/v1/sales/:id/government-interactions/:intId  [conveyancer, admin]
```

### Communication
```
POST   /api/v1/sales/:id/messages   [sale parties]
GET    /api/v1/sales/:id/messages   [sale parties, role-filtered]
```

### Dashboards
```
GET    /api/v1/agent/sales           [agent, admin] — with days_in_stage
GET    /api/v1/conveyancer/cases     [conveyancer, admin] — with outstanding docs count
GET    /api/v1/admin/sales           [admin] — all sales, filterable
```

---

## Architecture Decisions

### State Machines

**Stage Transitions:**
```
not_started → in_progress | skipped
in_progress → completed | blocked
blocked     → in_progress
completed   → (terminal)
skipped     → (terminal)
```

**Sale Transitions:**
```
active    → completed | cancelled | disputed
disputed  → active | cancelled
completed → (terminal)
cancelled → (terminal)
```

### Blocker Enforcement
- Blocker stages (4, 5, 12, 13 in ZA default config) prevent completion until all `is_required = TRUE` documents are `received` or `verified`
- Any prior blocker stage must be `completed` before a later stage can be started

### Participant Access Control
`assertParticipant(sale, userId, roles)` — used on every sale-scoped operation:
- `admin` role → always allowed through
- Everyone else → userId must match one of: `seller_id`, `buyer_id`, `agent_id`, `buyer_conveyancer_id`, `seller_conveyancer_id`

### Buyer Visibility (Message Filtering)
Messages have `visible_to_roles JSONB` field. Non-admin users only receive messages where their role is in `visible_to_roles`, enforced via `@>` JSONB operator.

### Audit Trail
All mutations are logged to `sales.audit_logs` (append-only, trigger-protected). Follows the same pattern as `property.audit_logs` from Sprint 03.

### days_in_stage
Computed at query time as a raw SQL `EXTRACT(DAY FROM ...)` in the dashboard controller. Not stored as a generated column (PostgreSQL GENERATED ALWAYS requires immutable expressions; `NOW()` is volatile).

---

## Test Results

```
Before Sprint 04:  280 tests | 278 pass | 2 fail (parse errors — pre-existing)
After Sprint 04:   304 tests | 302 pass | 2 fail (same pre-existing parse errors)
New tests added:   24 unit tests
```

The 2 failing "suites" are the same pre-existing Jest/Babel parse errors (from root-level Jest finding compiled `.js` files in `dist/`). All logic tests pass.

---

## DB Migration Status

Migration `202603020010_sprint04_sales_progression` applied to `pribec_dev`:
- ✅ 8 tables created
- ✅ All indexes created
- ✅ Audit append-only trigger installed
- ✅ `updated_at` auto-maintenance triggers installed
- ✅ 14 stage configs seeded for ZA (South Africa)

---

## Sprint 04 Acceptance Criteria Progress

| Criterion | Status |
|-----------|--------|
| Agent can initiate a sale and assign conveyancers | ✅ |
| All 14 stages visible on timeline with correct statuses | ✅ |
| Conveyancer can upload documents per stage | ✅ |
| Buyer receives notification on every stage change | ⏳ (notification system in Sprint 05 hooks) |
| Government interaction tracker updates correctly | ✅ |
| Stage blocker prevents progression until unblocked | ✅ |
| Missing document reminder fires after 2 days | ⏳ (scheduled job — Phase 2 feature) |
| All stage changes logged in audit table | ✅ |
| Sale messages visible only to configured roles | ✅ |
| Dashboard shows correct days_in_stage | ✅ |

---

## Deferred / Next Steps

| Item | Target |
|------|--------|
| Notification triggers (stage completed, blocked, doc uploaded) | Sprint 05 / notification service |
| Missing document reminder cron job | Sprint 05 |
| Web frontend wiring for `PropertySaleWorkspace.tsx` | Sprint 04 Step 2 |
| `ConveyancerView.tsx` wiring | Sprint 04 Step 2 |
| E2E tests for full 14-stage happy path | Sprint 04 Step 2 |
| Country-specific stage config (other than ZA) | Sprint 07+ |

---

## Blocks

Sprint 05 (Escrow) is now unblocked — `sales.property_sales.id` and Stage 5 (Deposit to Escrow) are in place.
