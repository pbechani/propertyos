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
│   │   └── src/
│   │       ├── common/       # Shared types (AuthRequest) & BaseAuditService
│   │       ├── property/     # Property module (listings, verification, fraud, etc.)
│   │       ├── sales/        # Sales progression module (14-stage pipeline)
│   │       ├── conveyancing/ # Conveyancer case management
│   │       ├── financial/    # Escrow, ledger, payments (event-sourced)
│   │       ├── identity/     # Auth, RBAC, KYC, companies
│   │       ├── leads/        # Lead management & pipeline
│   │       └── ai-intelligence/ # AI engine & LLM orchestration
│   ├── web/              # Next.js frontend
│   │   └── src/
│   │       ├── lib/          # Shared utilities (formatters, status-colors, constants)
│   │       ├── components/ui/# Reusable UI primitives (KpiCard, StatCard, LoadingSpinner, etc.)
│   │       └── views/        # Page-level view components
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
   # API environment
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env — key variables: PORT=3001, DATABASE_URL, REDIS_URL, etc.
   ```

4. **Generate local SSL certificates (optional — HTTPS only)**
   ```bash
   # macOS: brew install mkcert
   ./scripts/generate-local-certs.sh
   ```

5. **Start all infrastructure services (Docker)**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   # Wait 30–60 seconds for health checks to pass
   ```

6. **Run database migrations**
   ```bash
   npm run migrate --workspace=apps/api
   ```

7. **Start the API (NestJS — watch mode)**
   ```bash
   cd apps/api && npm run dev
   # Runs on http://localhost:3001
   ```

8. **Start the Web app (Next.js — in a separate terminal)**
   ```bash
   cd apps/web && npm run dev
   # Runs on http://localhost:3000
   ```

9. **Verify everything is running**
   ```bash
   # API responds
   curl http://localhost:3001/api/v1/auth/me

   # Swagger docs
   open http://localhost:3001/api/docs

   # Web app
   open http://localhost:3000
   ```

---

### Running Services Reference

#### Application Processes (started manually)

| Process | Command | URL |
|---------|---------|-----|
| **NestJS API** | `cd apps/api && npm run dev` | http://localhost:3001 |
| **Next.js Web** | `cd apps/web && npm run dev` | http://localhost:3000 |

#### Docker Containers (started via `docker compose`)

| Container | Description | Port(s) | Credentials |
|-----------|-------------|---------|-------------|
| `pribec-postgres` | PostgreSQL 15 + PostGIS | `5432` | user: `pribec` / pw: `pribec_dev_password` / db: `pribec_dev` |
| `pribec-redis` | Redis 7 cache & session store | `6379` | — |
| `pribec-rabbitmq` | RabbitMQ message broker | `5672` (AMQP), `15672` (UI) | user: `pribec` / pw: `pribec_dev_password` |
| `pribec-minio` | MinIO S3-compatible object storage | `9000` (API), `9001` (Console) | access key: `pribec_access_key` / secret: `pribec_secret_key` |
| `pribec-mailpit` | Local email catcher (SMTP + UI) | `1025` (SMTP), `8025` (UI) | — |
| `pribec-vault` | HashiCorp Vault secrets management | `8200` | dev token: `pribec-dev-token` |
| `pribec-elasticsearch` | Elasticsearch 8 log store | `9200` | — |
| `pribec-kibana` | Kibana log visualisation | `5601` | — |
| `pribec-filebeat` | Filebeat log shipper (Docker → ES) | — | — |
| `pribec-prometheus` | Prometheus metrics scraper | `9090` | — |
| `pribec-grafana` | Grafana metrics dashboards | `3002` | user: `admin` / pw: `admin` |
| `pribec-postgres-exporter` | PostgreSQL metrics for Prometheus | `9187` | — |
| `pribec-redis-exporter` | Redis metrics for Prometheus | `9121` | — |

> **Note:** The `nginx` container (`pribec-nginx`) is optional and only starts when you pass `--profile https`. Run `./scripts/generate-local-certs.sh` first.

#### Quick Health Check

```bash
# Check all container statuses at once
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Individual checks
docker exec pribec-postgres psql -U pribec -d pribec_dev -c "SELECT 1"
docker exec pribec-redis redis-cli ping
curl -s http://localhost:9200/_cluster/health | python3 -m json.tool
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
# Start all infrastructure services (detached)
docker compose -f docker/docker-compose.yml up -d

# Stop all services
docker compose -f docker/docker-compose.yml down

# Stop services and remove volumes (full reset)
docker compose -f docker/docker-compose.yml down -v

# View logs for all services
docker compose -f docker/docker-compose.yml logs -f

# View logs for a specific service
docker compose -f docker/docker-compose.yml logs -f postgres

# Restart a specific service
docker compose -f docker/docker-compose.yml restart postgres

# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Start with optional HTTPS proxy (requires local certs)
docker compose -f docker/docker-compose.yml --profile https up -d
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
