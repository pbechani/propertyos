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
| `sprint-13-valuation-mandate.md` | 13 | Phase 2B | 13–17 | Valuer profiles, formal valuations, CMA, mandate enforcement, listing approval |
| `sprint-14-mortgage-financing.md` | 14 | Phase 3B | 18–23 | Bond applications, multi-bank submission, affordability calculator, interest rates |
| `sprint-15-property-development.md` | 15 | Phase 3C | 20–26 | Off-plan sales, developer unit mix, snagging, municipality approvals, NHBRC |
| `sprint-16-rental-lifecycle.md` | 16 | Phase 3D | 22–30 | Rental listings, tenancy, digital leases, rent collection, AI dynamic pricing |
| `sprint-17-market-intelligence.md` | 17 | Phase 4A | 28–34 | Price indices, AVM, comparable sales, NL-to-SQL, investment yield calculator |

### Enhanced Sprint Files (Addenda — read the base sprint first)

| File | Extends | New Additions | Status |
|------|---------|---------------|--------|
| `sprint-02-identity-auth_enhanced.md` | Sprint 02 | Multi-role users, org accounts, professional licences, enhanced KYC, agent CRM | ✅ 2026-03-05 |
| `sprint-03-property-marketplace_enhanced.md` | Sprint 03 | Mandate system, valuations integration, viewing scheduler, syndication engine | ✅ 2026-03-06 |
| `sprint-04-sales-progression_enhanced.md` | Sprint 04 | 16-stage pipeline, digital OTP, negotiation versioning, deal room, disbursements | — |
| `sprint-11-risk-analytics-ai_enhanced.md` | Sprint 11 | NL-to-SQL (LangChain), dynamic pricing XGBoost, churn prediction, PEF fraud | — |
| `sprint-12-ai-design-advanced_enhanced.md` | Sprint 12 | IoT safety monitoring (YOLOv8/Jetson), predictive maintenance (Prophet/TimescaleDB), tenant chatbot | — |

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

Parallel tracks (can begin once base sprints are stable):
  Sprint 13 (Valuation & Mandate)         → after Sprint 03
  Sprint 14 (Mortgage & Financing)         → after Sprint 04 + 05
  Sprint 15 (Property Development)         → after Sprint 03 + 06
  Sprint 16 (Rental Lifecycle)             → after Sprint 05 + 07 + 11
  Sprint 17 (Market Intelligence)          → after Sprint 11 + 13 + 16
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
