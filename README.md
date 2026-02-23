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
| [docs/sprint-03-run-guide.md](docs/sprint-03-run-guide.md) | Local run instructions + UX verification checklist |

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

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker Desktop (for local development)
- mkcert (optional, for local HTTPS)

### First-Time Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd pribec
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Generate local SSL certificates (optional)**
   ```bash
   # Install mkcert first if not already installed
   # macOS: brew install mkcert
   # Linux: https://github.com/FiloSottile/mkcert#installation
   
   ./scripts/generate-local-certs.sh
   ```

5. **Start infrastructure services**
   ```bash
   npm run docker:up
   
   # Wait for all services to be healthy (30-60 seconds)
   # You can monitor logs with: npm run docker:logs
   ```

6. **Verify all services are healthy**
   ```bash
   # Check PostgreSQL
   docker exec -it pribec-postgres psql -U pribec -d pribec_dev -c "\dn"
   
   # Check Redis
   docker exec -it pribec-redis redis-cli ping
   
   # Check RabbitMQ Management UI
   open http://localhost:15672  # user: pribec, password: pribec_dev_password
   
   # Check MinIO Console
   open http://localhost:9001  # user: pribec_access_key, password: pribec_secret_key
   
   # Check Kibana
   open http://localhost:5601
   
   # Check Grafana
   open http://localhost:3002  # user: admin, password: admin
   
   # Check Prometheus
   open http://localhost:9090
   ```

7. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

8. **Start development servers**
   ```bash
   # Start all apps (API + Web)
   npm run dev
   
   # Or start individual apps
   npm run dev --workspace=apps/api
   npm run dev --workspace=apps/web
   ```

9. **Verify API is running**
   ```bash
   curl http://localhost:3001/api/v1/health
   
   # Check Swagger documentation
   open http://localhost:3001/api/docs
   ```

### Development Workflow

```bash
# Run linting
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Format code
npm run format

# Build all apps
npm run build

# Clean all build artifacts
npm run clean
```

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Restart a specific service
docker-compose -f docker/docker-compose.yml restart postgres

# Run with HTTPS proxy
docker-compose -f docker/docker-compose.yml --profile https up
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
