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
- **Service Provider Marketplace** — Verified professionals, bidding, ratings
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
| [docs/audit-sprint-01-02-03-2026-02-25.md](docs/audit-sprint-01-02-03-2026-02-25.md) | Consolidated Sprint 01–03 audit evidence and release readiness |
| [CHANGELOG.md](CHANGELOG.md) | Unreleased and historical platform changelog |

---

## Roadmap

| Milestone | Timeline | Deliverables |
|-----------|----------|--------------|
| **MVP** | ~30 weeks | Auth, Property, Sales, Escrow, Construction |
| **Marketplace** | ~60 weeks | + Service Providers, Supplier, Logistics, Inspections |
| **AI Layer** | ~92 weeks | + Risk Engine, AI Design, Legal Intelligence |
| **Full Platform** | ~130 weeks | + Lifecycle, Bank/Gov Integrations, Scale |

---

## Current Web Routes (Highlights)

- Listings: `/app/listings`
- Property detail: `/app/property/:propertyId`
- Service providers: `/service-providers`
- Role setup: `/role-setup`
- Change password: `/change-password`

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

# Smoke-check key web routes
npm run smoke:web

# Clean all build artifacts
npm run clean
```

### Web Route Smoke Check

Use the built-in smoke script to verify key web routes quickly:

```bash
# Default (http://localhost:3000)
npm run smoke:web

# Custom base URL
BASE_URL=http://localhost:3001 npm run smoke:web

# Custom route list
bash scripts/smoke-web-routes.sh / /app/listings /app/safety /app/analytics
```

### Agent Dashboard Metrics (Sprint 03)

The agent dashboard endpoint now returns the following analytics fields:

- `listingViewsLast7d`
- `listingViewsPrevious7d`
- `listingViewsTrendPct`
- `inquiryResponseRatePct`

Quick check (replace with a valid agent token):

```bash
curl -s http://localhost:3001/api/v1/agent/dashboard \
   -H "Authorization: Bearer <AGENT_TOKEN>"
```

### Profile Dashboard + Role Setup Validation (2026-02-26)

The profile trust/verification cards and role setup tabs now use persisted backend data (no hardcoded metrics).

Run required migration (if not already applied):

```bash
npm run migrate:deploy --workspace=apps/api
```

Run end-to-end flow verification:

```bash
python3 scripts/verify_role_setup_flow.py
```

Expected output includes:
- `"business_persisted": true`
- `"kyc_submitted": true`

Verification resend endpoint:
- `POST /api/v1/auth/resend-verification-email`

Expected behavior:
- authenticated user receives `200`
- verification token is re-issued and email dispatch is attempted
- resend action is audit logged

### AI Voice Search Verification (Listings)

Use this checklist to verify the voice-search flow on `apps/web/src/views/Listings.tsx`.

1. Start web + API:
   ```bash
   npm run dev --workspace=apps/api
   npm run dev --workspace=apps/web
   ```
2. Open `http://localhost:3000/app/listings`.
3. Open Filters → click **AI Voice Search**.
4. Allow microphone permission when prompted.
5. Speak a query such as:
   - `Show me 3 bedroom houses in Cape Town with a pool under 10 million rand`
6. Confirm expected behavior:
   - Transcript appears in the modal.
   - AI suggestion chips appear from parsed intent.
   - Clicking **Apply AI Search** updates listing results and applied filter badges.

Troubleshooting:
- If browser support is missing, the modal shows a compatibility message.
- If origin is not secure, voice capture requires HTTPS (or localhost).
- If mic permission is blocked, enable microphone access for the site and retry.
- If no speech is captured, retry with clearer speech / closer microphone.

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
