# Sprint Files Index
## Real Estate & Construction Trust Platform

Always read `00-project-overview.md` before reading any sprint file.

---

## Reading Order

| File | Sprint | Phase | Weeks | Topic |
|------|--------|-------|-------|-------|
| `00-project-overview.md` | — | — | — | Architecture, tech stack, roles, principles |
| `sprint-01-infrastructure.md` | 1 | Phase 0 | 1–3 | Monorepo, DB, Redis, CI/CD, observability |
| `sprint-02-identity-auth.md` | 2 | Phase 1 | 4–7 | Auth, JWT, RBAC, KYC, audit logs |
| `sprint-03-property-marketplace.md` | 3 | Phase 2 | 8–12 | Property listings, search, verification, fraud |
| `sprint-04-sales-progression.md` | 4 | Phase 3 | 13–17 | 14-stage purchase pipeline, conveyancer, buyer portal |
| `sprint-05-escrow-payments.md` | 5 | Phase 4 | 18–22 | Double-entry ledger, escrow, payment gateways |
| `sprint-06-construction-projects.md` | 6 | Phase 5 | 23–30 | Project management, milestones, offline-first mobile |
| `sprint-07-contractor-supplier.md` | 7 | Phase 6 | 31–38 | Contractor & supplier marketplaces, RFQ, orders |
| `sprint-08-boq-system.md` | 8 | Phase 7 | 39–45 | BOQ engine, quantity calc, material swapping |
| `sprint-09-inspections-monitoring.md` | 9 | Phases 8–9 | 46–55 | Gov inspections, progress ledger, disputes |
| `sprint-10-logistics.md` | 10 | Phase 10 | 56–60 | Truck marketplace, GPS tracking, delivery escrow |
| `sprint-11-risk-analytics-ai.md` | 11 | Phases 11–12 | 61–80 | Risk scores, anomaly detection, LLM gateway, RAG |
| `sprint-12-ai-design-advanced.md` | 12 | Phases 13–18 | 81–130 | AI design, lifecycle, security, gov integrations, scale |

---

## How to Use These Files in Claude Code

### Starting a new sprint
```
"Read sprint-XX.md and implement the [feature] described there"
```

### Building on existing work
```
"Read 00-project-overview.md and sprint-06 then add the change order endpoint"
```

### For data model work
```
"Read sprint-05-escrow-payments.md and create the migration files for the financial schema"
```

---

## Dependency Chain
```
Sprint 01 (Infrastructure)
  ↓
Sprint 02 (Identity & Auth)
  ↓
Sprint 03 (Property Marketplace)
  ↓
Sprint 04 (Sales Progression)
  ↓
Sprint 05 (Escrow & Payments)
  ↓
Sprint 06 (Construction Projects)
  ↓
Sprint 07 (Contractor & Supplier)
  ↓
Sprint 08 (BOQ System)
  ↓
Sprint 09 (Inspections & Monitoring)
  ↓
Sprint 10 (Logistics)
  ↓
Sprint 11 (Risk Analytics + AI Engine)
  ↓
Sprint 12 (AI Design + Advanced Features)
```

## MVP Completion Marker
**After Sprint 06 is complete**, the MVP is live:
- ✅ Users can register, verify identity (KYC)
- ✅ Agents can list verified properties
- ✅ Buyers can track a property purchase through 14 stages
- ✅ Funds held in escrow, released on legal transfer
- ✅ Construction projects tracked with geo-verified progress photos
- ✅ Contractors paid on milestone completion

---

## Core Non-Negotiables (Enforce in Every Sprint)
1. Every state-changing action writes an audit log entry
2. No plaintext PII in logs — only IDs/references
3. Financial tables are append-only — no UPDATE/DELETE on ledger_entries
4. RBAC enforced at API layer — never trust client-side role claims
5. All file uploads: virus scan before storage, signed URLs for access
6. Offline mobile: local SQLite outbox → background sync → conflict resolution
