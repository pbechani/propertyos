# PRIBEC - Claude Code Context

## Project Overview

**PRIBEC** is a Real Estate & Construction Trust Platform targeting emerging markets with focus on diaspora confidence, transparency, and fraud prevention.

**Core Value:** Financial-grade ledger platform combining construction operations, trust infrastructure, and real estate intelligence.

---

## Product Requirements Document (PRD)

### Problem Statement

**Property Market Issues:**
- Double selling of land — no centralized ownership tracking
- Documentation fraud — fake or incomplete title deeds
- Lack of transparency — no ownership history visibility
- Agent fraud — unscrupulous agents with no accountability

**Construction Management Issues:**
- Cost opacity — no visibility into actual costs vs estimates
- Contractor reliability — no verified professional database
- Budget overruns — poor tracking and change order management
- Communication breakdown — fragmented project communication

**Diaspora-Specific Challenges:**
- Remote oversight — buyers not on-site during construction
- Trust deficit — no reliable reporting mechanisms
- High fraud exposure — distance enables exploitation
- Limited legal recourse — difficult enforcement across borders

---

### Target Users & Personas

| Role | Description | Key Needs |
|------|-------------|-----------|
| **Buyer/Seller** | Purchase or sell property | Transparent process, fraud protection, progress visibility |
| **Diaspora Investor** | Remote property investment | Trust, verified progress photos, escrow protection |
| **Contractor** | Build projects, submit bids | Fair bidding, milestone payments, reputation building |
| **Supplier** | Sell materials, manage catalog | Market access, order management, payment security |
| **Agent** | List properties, manage sales | Lead tracking, commission management, sales tools |
| **Conveyancer/Lawyer** | Legal workflow, stage progression | Document management, compliance tracking, case management |
| **Inspector** | Government & independent inspections | Mobile-first, offline capability, certificate issuance |
| **Truck Operator** | Logistics & delivery | Job matching, route optimization, payment tracking |

---

### Core Features by Module

#### Module 1: Property Marketplace & Sales Progression
- Property listings (land, residential, commercial, off-plan)
- Document verification workflow with badges
- Ownership history tracking
- Fraud reporting system
- **14-Stage Purchase Pipeline:**
  1. Property Search & Viewing
  2. Offer Submission
  3. Offer Accepted / Negotiation
  4. Sale Agreement (Offer to Purchase)
  5. Deposit Payment & Escrow
  6. Title Deed Search & Verification
  7. Mortgage/Financing Approval
  8. Property Inspection & Due Diligence
  9. Compliance Certificates
  10. Transfer Documentation Preparation
  11. Deeds Office Registration
  12. Transfer Duty Payment
  13. Final Payment & Registration
  14. Post-Purchase

#### Module 2: Construction Project Management
- Project dashboard (budget vs actual, timeline, milestones)
- **11 Construction Stages** (Foundation → Handover)
- Government inspection requirements per stage
- **Flexible Budgeting:** Stage-based, whole project, or job-by-job
- **Intelligent BOQ System:**
  - Auto-generate from architectural plans (AI-powered)
  - Multi-tier pricing (premium/recommended/budget)
  - Real-time material swapping with instant cost updates
  - Price comparison across supplier marketplace

#### Module 3: Service Provider Marketplace
- Verified profiles with certifications
- Portfolio uploads and past project showcase
- Project bidding system
- Performance metrics (completion %, budget adherence, disputes)
- Rating & review system

#### Module 4: Supplier Marketplace
- Comprehensive catalog (10,000+ materials)
- Multi-tier pricing per material
- RFQ (Request for Quotation) system
- Real-time price updates → Material Price Index
- Delivery tracking with geo-proof

#### Module 5: Escrow & Financial Ledger
- Multi-currency wallet
- Double-entry ledger system (event-sourced)
- Milestone-linked release logic
- Two-step approval for large releases
- Immutable transaction logs

#### Module 6: Monitoring & Verification
- Geo-tagged, timestamped progress uploads
- **Offline-first** — works without connectivity
- Camera metadata validation (EXIF)
- Independent site inspection booking
- Immutable progress timeline

#### Module 7: Logistics & Transport Marketplace
- Truck operator registration & verification
- Job matching algorithm (proximity, truck type, rating)
- Real-time GPS tracking
- Digital signatures and photo proof
- Dynamic pricing based on demand

#### Module 8: AI Engine & Legal Intelligence
- Multi-LLM orchestration (GPT-4, Claude, Gemini)
- Document AI (OCR, classification, verification)
- RAG system for legal/regulatory queries
- Computer vision for progress verification
- **AI House Design Assistant** (voice/text → floor plans → BOQ)

---

### Key User Stories

**Diaspora Buyer:**
> "As a diaspora buyer, I want to see geo-tagged, timestamped progress photos of my construction project so I can trust that work is actually happening."

**Property Buyer:**
> "As a property buyer, I want to track my purchase through all 14 stages with full visibility into required documents and current status."

**Service Provider:**
> "As a contractor, I want to receive milestone payments automatically when my work is approved so I don't have to chase clients for payment."

**Agent:**
> "As an agent, I want a dashboard showing all my listings, leads, and sales progression so I can manage my business efficiently."

**Conveyancer:**
> "As a conveyancer, I want to track all required documents per stage and coordinate with government departments through a single interface."

**Supplier:**
> "As a supplier, I want to receive bulk RFQs from BOQ systems and respond with quotes to win orders."

**Project Owner:**
> "As a project owner, I want to swap materials in my BOQ and see instant cost updates so I can optimize my budget."

---

### Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| MVP | User registrations | 1,000+ |
| MVP | Properties listed | 500+ |
| MVP | KYC completion rate | >80% |
| Phase 2 | Escrow transaction volume | $1M+ |
| Phase 2 | Project creation rate | 100+/month |
| Phase 2 | Milestone completion rate | >90% |
| Phase 3 | Contractor registrations | 500+ |
| Phase 3 | Supplier catalog items | 10,000+ |
| Phase 3 | RFQ submission rate | 200+/month |
| Phase 4 | AI design generations | 1,000+/month |
| Phase 4 | Platform uptime | 99.5%+ |
| Phase 4 | API response time | <300ms |

---

### MVP Definition (After Sprint 6)

**Core Trust Loop:**
1. Users register and verify identity (KYC)
2. Agents list verified properties
3. Buyers track property purchase through 14 stages
4. Funds held in escrow, released on legal transfer
5. Construction projects tracked with geo-verified progress photos
6. Contractors paid on milestone completion

**MVP Excludes:**
- AI Design Assistant (Phase 4)
- Logistics Marketplace (Phase 3)
- Risk & Analytics Engine (Phase 2+)
- Advanced BOQ AI features

---

### Phased Roadmap

| Milestone | Phases | Timeline | Key Deliverables |
|-----------|--------|----------|------------------|
| **MVP** | 0–5 | ~30 weeks | Auth, Property, Sales, Escrow, Construction |
| **Marketplace** | 0–10 | ~60 weeks | + Contractor, Supplier, Logistics, Inspections |
| **AI Layer** | 0–13 | ~92 weeks | + Risk Engine, AI Design, Legal Intelligence |
| **Full Platform** | 0–18 | ~130 weeks | + Lifecycle, Bank/Gov Integrations, Scale |

---

### Competitive Differentiators

1. **14-Stage Property Purchase Pipeline** — Full legal workflow transparency
2. **Offline-First Mobile** — Works in areas with poor connectivity
3. **Event-Sourced Financial Ledger** — Immutable, auditable, dispute-ready
4. **AI House Design Assistant** — Voice/text → floor plans → BOQ
5. **Truck Operator Marketplace** — On-demand logistics (Uber for construction)
6. **Material Price Intelligence** — Real-time pricing with substitution engine
7. **Multi-Country Ready** — Multi-currency, multi-language from day one

---

## Development Workflow

### Branch Strategy
```
main              # Production-ready code
├── develop       # Integration branch
│   ├── feature/* # New features (feature/sprint-01-auth)
│   ├── fix/*     # Bug fixes
│   └── refactor/*# Code improvements
```

### Sprint-Based Development
1. **Read the sprint file** before starting work: `design/sprints/sprint-XX-*.md`
2. Each sprint file contains: Goal, Data Models, API Endpoints, Acceptance Criteria, Dependencies
3. Complete sprints sequentially — dependencies are strict

### Commit Convention
```
<type>(<scope>): <description>

Types: feat, fix, refactor, docs, test, chore, ci
Scope: auth, property, escrow, construction, etc.

Examples:
feat(auth): add JWT refresh token rotation
fix(escrow): correct balance calculation on partial release
refactor(property): extract verification service
```

### PR Process
1. Create feature branch from `develop`
2. Implement with tests
3. Self-review against acceptance criteria in sprint file
4. PR to `develop` with linked sprint reference
5. Squash merge after approval

### Code Review Checklist
- [ ] Matches sprint acceptance criteria
- [ ] No security vulnerabilities (OWASP Top 10)
- [ ] Tests cover happy path + edge cases
- [ ] No hardcoded secrets
- [ ] Audit logging for sensitive actions
- [ ] API follows REST conventions

---

## Project Decision Records (PDR)

### PDR-001: Modular Monolith First
**Decision:** Start with modular monolith, extract services only when scale demands.

**Context:** Team is small, time-to-market is critical, microservices add operational complexity.

**Rationale:**
- Faster initial development
- Easier debugging and deployment
- Module boundaries prepare for future extraction
- Escrow & Risk services extracted first when needed (Phase 2)

**Consequences:**
- Enforce strict module boundaries from day one
- Use internal events between modules (prepare for message broker)
- Schema-per-bounded-context in PostgreSQL

---

### PDR-002: NestJS over Go
**Decision:** Use NestJS (Node.js) for backend services.

**Context:** Evaluated NestJS vs Go for primary backend.

**Rationale:**
- Faster development velocity for 18-month timeline
- Strong TypeScript ecosystem matches frontend (Next.js, React Native)
- Built-in DI, validation, guards align with enterprise patterns
- Team familiarity
- Go considered for future high-performance services (Risk Engine)

**Consequences:**
- Shared TypeScript types across frontend/backend
- Use `@nestjs/microservices` for future service extraction
- Monitor performance; extract to Go if CPU-bound bottlenecks emerge

---

### PDR-003: PostgreSQL with Event Sourcing for Financials
**Decision:** PostgreSQL as primary database; event sourcing for financial transactions only.

**Context:** Need ACID compliance, audit trails, and point-in-time reconstruction for escrow/ledger.

**Rationale:**
- PostgreSQL provides ACID, JSONB flexibility, mature ecosystem
- Full event sourcing everywhere is over-engineering
- Event sourcing for `financial` schema only (escrow, ledger, payments)
- Other schemas use standard CRUD with audit log triggers

**Consequences:**
- `financial.events` table is append-only
- Projections rebuild from events
- Other modules use `audit_logs` table (not full event sourcing)

---

### PDR-004: RabbitMQ over Kafka
**Decision:** Use RabbitMQ for message broker.

**Context:** Need async communication between modules; evaluated Kafka vs RabbitMQ.

**Rationale:**
- Simpler operational model for current scale
- Sufficient for event-driven patterns needed
- Kafka's replay/partitioning not required initially
- Lower infrastructure cost

**Consequences:**
- Use RabbitMQ exchanges for domain events
- Design message schemas to be Kafka-compatible for future migration
- Revisit if throughput exceeds 10K events/sec

---

### PDR-005: Offline-First Mobile with SQLite
**Decision:** React Native with SQLite for offline-first mobile architecture.

**Context:** Construction workers operate in areas with poor/no connectivity.

**Rationale:**
- SQLite provides local relational database
- Encrypted storage for sensitive data
- Background sync queue with priority (photos > text)
- Conflict resolution: last-write-wins for most data; manual for financial

**Consequences:**
- All mobile features must work offline
- Sync queue persists across app restarts
- Geo-tagged photos validated on upload (EXIF, location match)
- Build conflict resolution UI for edge cases

---

### PDR-006: Schema-Per-Bounded-Context
**Decision:** Separate PostgreSQL schemas for each bounded context.

**Context:** Need isolation between domains while sharing single database instance.

**Rationale:**
- Clear ownership boundaries
- Independent migrations per context
- Prepares for future database splitting
- Shared `audit` and `common` schemas for cross-cutting concerns

**Consequences:**
- No direct foreign keys across schemas (use IDs + eventual consistency)
- Each schema has own migration history
- Cross-schema queries via application layer, not SQL joins

**Schema Layout:**
```
identity.*       # Users, roles, KYC, sessions
property.*       # Listings, ownership, verification
sales.*          # Purchase stages, documents
financial.*      # Accounts, ledger, escrow (event-sourced)
construction.*   # Projects, milestones, stages
marketplace.*    # Contractors, suppliers, RFQ
logistics.*      # Operators, deliveries, tracking
inspection.*     # Requirements, results, certificates
analytics.*      # Risk scores, predictions
ai_engine.*      # Design sessions, generated content
audit.*          # Shared audit logs
common.*         # Shared lookup tables
```

---

### PDR-007: AI Infrastructure Strategy
**Decision:** Build unified LLM Gateway with multi-provider support.

**Context:** AI powers multiple features (document AI, legal compliance, design assistant).

**Rationale:**
- Avoid vendor lock-in (OpenAI, Anthropic, Google)
- Unified API for all AI interactions
- Central cost tracking and rate limiting
- Model fallback on failures

**Consequences:**
- Build abstraction layer over LLM providers
- Vector DB (Pinecone/Weaviate) for RAG
- Legislation corpus indexed for legal compliance queries
- AI features deferred to Phase 11+ (after core platform stable)

---

### PDR-008: 14-Stage Property Purchase Pipeline
**Decision:** Implement full 14-stage property purchase workflow.

**Context:** Legal property transfers in target markets involve multiple government departments.

**Rationale:**
- Each stage has specific documentation requirements
- Multi-party visibility (buyer, seller, agent, conveyancer)
- Government department tracking (Land Registry, Deeds Office, Tax Authority)
- Stage-based escrow releases

**Consequences:**
- Configurable stages per country/region
- Stage progression requires document uploads
- Blocked stages prevent advancement
- Full audit trail per stage transition

---

## File Structure Reference

```
/
├── apps/
│   ├── api/              # NestJS backend
│   ├── web/              # Next.js frontend
│   └── mobile/           # React Native app
├── packages/
│   ├── shared-types/     # TypeScript interfaces
│   ├── ui/               # Shared UI components
│   └── config/           # Shared configs
├── design/
│   ├── design.md         # Full architecture analysis
│   ├── design-phase.md   # Implementation phases
│   └── sprints/          # Sprint specifications
├── infrastructure/
│   └── terraform/        # IaC definitions
└── docker/
    └── docker-compose.yml
```

---

## Sprint Reading Order

Before implementing any sprint, read:
1. `design/sprints/00-project-overview.md` (architecture context)
2. The specific sprint file: `design/sprints/sprint-XX-*.md`
3. Any dependent sprint files listed in "Dependencies" section

---

## Security Non-Negotiables

- **Never** hardcode secrets — use environment variables
- **Always** parameterized queries — no SQL string concatenation
- **Always** audit log sensitive actions (financial, KYC, stage transitions)
- **Always** validate file uploads (type, size, EXIF for geo-tagged)
- **Always** rate limit auth endpoints (10 req/min)
- **Always** MFA for financial actions
- **Never** expose internal IDs in URLs — use UUIDs

---

## Testing Requirements

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows (auth, escrow release, stage progression)
- Offline sync tests for mobile
- Load tests before production (target: 1000 concurrent users)

---

## Quick Commands

```bash
# Start development environment
docker-compose up -d

# Run API tests
npm run test --workspace=apps/api

# Run migrations
npm run migrate --workspace=apps/api

# Generate TypeScript types from schema
npm run generate:types

# Lint all workspaces
npm run lint
```
