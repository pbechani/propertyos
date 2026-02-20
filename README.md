# PRIBEC

**Real Estate & Construction Trust Platform**

A financial-grade digital infrastructure for property buying, construction management, and supplier marketplaces — targeting emerging markets with a focus on diaspora confidence, transparency, and fraud prevention.

---

## Problem We Solve

| Domain | Problem |
|--------|---------|
| **Property Market** | Double-selling of land, documentation fraud, no ownership transparency |
| **Construction** | Cost opacity, unreliable contractors, budget overruns, communication breakdown |
| **Diaspora Investors** | Remote oversight challenges, trust deficit, high fraud exposure |

---

## Core Platform

### Property Marketplace
- Verified property listings with ownership history
- **14-stage purchase pipeline** with full transparency
- Agent, buyer, seller, and conveyancer dashboards
- Government department tracking (Land Registry, Deeds Office, Tax Authority)

### Construction Management
- Project tracking with budget vs actual visualization
- 11 construction stages with government inspection workflow
- **Intelligent BOQ system** — AI-powered quantity calculation, multi-tier pricing, real-time material swapping
- Milestone-based escrow releases

### Marketplaces
- **Contractor Marketplace** — Verified professionals, bidding, ratings
- **Supplier Marketplace** — 10,000+ materials, RFQ system, price index
- **Logistics Marketplace** — On-demand truck operators (Uber for construction)

### Trust Layer
- Geo-tagged, timestamped progress photos (offline-first)
- Event-sourced financial ledger (double-entry, immutable)
- Multi-currency escrow with two-step approval
- Append-only audit logs

### AI Engine
- Document AI (OCR, verification, classification)
- Legal intelligence with RAG (building codes, regulations)
- **AI House Design Assistant** — voice/text to floor plans to BOQ
- Risk scoring and fraud detection

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS (Node.js), PostgreSQL, Redis, RabbitMQ |
| **Frontend** | Next.js (Web), React Native (Mobile) |
| **Mobile** | Offline-first with SQLite, encrypted storage |
| **AI/ML** | OpenAI, Anthropic Claude, Pinecone/Weaviate |
| **Infrastructure** | Docker, Kubernetes, Terraform, GitHub Actions |
| **Observability** | ELK Stack, Prometheus, Grafana, Sentry |

---

## Project Structure

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
│   ├── design.md         # Architecture analysis
│   ├── design-phase.md   # Implementation phases
│   └── sprints/          # Sprint specifications
├── infrastructure/
│   └── terraform/        # IaC definitions
└── docker/
    └── docker-compose.yml
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Development workflow, PRD, and architectural decisions |
| [design/design.md](design/design.md) | Comprehensive architecture analysis |
| [design/design-phase.md](design/design-phase.md) | 18-phase implementation plan |
| [design/sprints/](design/sprints/) | Sprint-by-sprint specifications |

---

## Roadmap

| Milestone | Timeline | Deliverables |
|-----------|----------|--------------|
| **MVP** | ~30 weeks | Auth, Property, Sales, Escrow, Construction |
| **Marketplace** | ~60 weeks | + Contractor, Supplier, Logistics, Inspections |
| **AI Layer** | ~92 weeks | + Risk Engine, AI Design, Legal Intelligence |
| **Full Platform** | ~130 weeks | + Lifecycle, Bank/Gov Integrations, Scale |

---

## Getting Started

```bash
# Clone repository
git clone <repo-url>
cd pribec

# Start development environment
docker-compose up -d

# Install dependencies
npm install

# Run migrations
npm run migrate --workspace=apps/api

# Start development servers
npm run dev
```

---

## Architecture Principles

1. **Security by design** — Financial-grade, no shortcuts
2. **Auditability as core primitive** — Every action has immutable log entry
3. **Offline-first mobile** — Construction workers operate with poor connectivity
4. **Event sourcing for financials** — Double-entry ledger, zero data loss tolerance
5. **Multi-tenant & multi-country ready** — Multi-currency, multi-language from day one

---

## User Roles

| Role | Description |
|------|-------------|
| Buyer/Seller | Purchase or sell property |
| Diaspora Investor | Remote property investment |
| Contractor | Build projects, submit bids |
| Supplier | Sell materials, manage catalog |
| Agent | List properties, manage sales |
| Conveyancer/Lawyer | Legal workflow, stage progression |
| Inspector | Government & independent inspections |
| Truck Operator | Logistics & delivery |
| Admin | Platform administration |

---

## License

Proprietary. All rights reserved.
