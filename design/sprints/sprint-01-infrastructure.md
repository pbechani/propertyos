# Sprint 01 — Infrastructure Foundation
**Phase 0 | Weeks 1–3**

## Goal
Stand up the complete development and production infrastructure so all subsequent sprints can build on a solid, observable, secure foundation.

---

## Deliverables Checklist
- [ ] Monorepo scaffolded (Nx or Turborepo)
- [ ] PostgreSQL cluster running with per-context schemas
- [ ] Redis instance running
- [ ] S3-compatible object storage configured
- [ ] RabbitMQ / Kafka message broker running
- [ ] Docker Compose for local dev
- [ ] CI/CD pipeline (GitHub Actions) — build, test, deploy
- [ ] Terraform IaC for cloud resources
- [ ] Centralized logging (ELK or CloudWatch)
- [ ] Prometheus + Grafana metrics
- [ ] Sentry error tracking
- [ ] SSL/TLS certificates
- [ ] Secrets management (AWS Secrets Manager or Vault)
- [ ] CORS and security headers configured

---

## Monorepo Structure
```
/
├── apps/
│   ├── api/              # NestJS backend (modular monolith)
│   ├── web/              # Next.js frontend
│   └── mobile/           # React Native app
├── packages/
│   ├── shared-types/     # TypeScript interfaces shared across apps
│   ├── ui/               # Shared UI components
│   └── config/           # Shared configs (eslint, tsconfig)
├── infrastructure/
│   └── terraform/        # IaC definitions
├── docker/
│   └── docker-compose.yml
└── .github/workflows/    # CI/CD pipelines
```

---

## PostgreSQL Database Schemas (One Per Bounded Context)
```sql
CREATE SCHEMA identity;
CREATE SCHEMA property;
CREATE SCHEMA sales;
CREATE SCHEMA financial;
CREATE SCHEMA construction;
CREATE SCHEMA marketplace;
CREATE SCHEMA logistics;
CREATE SCHEMA inspection;
CREATE SCHEMA analytics;
CREATE SCHEMA ai_engine;
```

---

## Docker Compose Services (Local Dev)
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: platform_dev
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]

  elasticsearch:
    image: elasticsearch:8.10.0
    ports: ["9200:9200"]
```

---

## CI/CD Pipeline Stages (GitHub Actions)
1. `lint` — ESLint + Prettier check
2. `test` — Unit + integration tests
3. `build` — Docker image build
4. `security-scan` — Snyk / Trivy vulnerability scan
5. `deploy-staging` — Auto-deploy to staging on `main` push
6. `deploy-prod` — Manual gate on tagged releases

---

## Environment Variables Structure
```
# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://host:6379

# Storage
S3_BUCKET=platform-docs
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Message Broker
RABBITMQ_URL=amqp://host:5672

# Secrets
JWT_SECRET=...
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
ENCRYPTION_KEY=...  # AES-256 key

# Observability
SENTRY_DSN=...
```

---

## Observability Requirements
- All API requests logged with: `request_id`, `method`, `path`, `status`, `duration_ms`, `user_id`
- Error logs include stack traces and context
- Alert thresholds: error rate > 1%, p95 latency > 500ms, DB connection pool > 80%

---

## Security Foundation Checklist
- [ ] Helmet.js (security headers)
- [ ] Rate limiting (100 req/min default, 10 req/min for auth endpoints)
- [ ] CORS whitelist configured
- [ ] SQL injection prevention (parameterized queries only — no raw string interpolation)
- [ ] All secrets loaded from environment — zero hardcoded credentials

---

## Acceptance Criteria
- `docker-compose up` starts all services locally in < 2 minutes
- Health check endpoints respond on all services: `GET /health`
- CI pipeline runs in < 10 minutes
- PostgreSQL schemas are all created and migrated
- Logs appear in centralized logging within 30 seconds of generation
- Zero secrets committed to git (secret scanning active)

---

## Dependencies
- None — this is the foundation

## Blocks
- Every subsequent sprint depends on this sprint
