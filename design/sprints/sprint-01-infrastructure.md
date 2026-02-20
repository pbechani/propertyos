# Sprint 01 — Infrastructure Foundation
**Phase 0 | Weeks 1–3**

## Goal
Stand up the complete development and production infrastructure so all subsequent sprints can build on a solid, observable, secure foundation.

---

## Deliverables Checklist
- [x] Monorepo scaffolded (Turborepo)
- [x] PostgreSQL cluster running with per-context schemas
- [x] Redis instance running
- [x] S3-compatible object storage configured (MinIO)
- [x] RabbitMQ / Kafka message broker running
- [x] Docker Compose for local dev
- [x] CI/CD pipeline (GitHub Actions) — lint, test, build, security-scan, deploy-staging (ECS), deploy-prod (ECS)
- [x] Terraform IaC for cloud resources (VPC, RDS, ElastiCache, S3, ECS, ACM)
- [x] Centralized logging (ELK + Filebeat log shipping)
- [x] Prometheus + Grafana metrics
- [x] Sentry error tracking
- [x] SSL/TLS certificates (nginx, TLS 1.2/1.3, local cert generation script)
- [x] Secrets management (HashiCorp Vault with env-var fallback)
- [x] CORS and security headers configured (Helmet.js + nginx security headers)

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
- [x] Helmet.js (security headers)
- [x] Rate limiting (100 req/min default, 10 req/min for auth endpoints)
- [x] CORS whitelist configured (driven by `CORS_ORIGINS` env var)
- [x] SQL injection prevention (parameterized queries only — Prisma ORM)
- [x] All secrets loaded from environment — zero hardcoded credentials
- [x] `JWT_SECRET` and `ENCRYPTION_KEY` required in staging/production environments
- [x] Secret scanning in CI (TruffleHog)

---

## Acceptance Criteria
- [x] `docker-compose up` starts all services locally in < 2 minutes
- [x] Health check endpoints respond on all services: `GET /health`, `/health/ready`, `/health/live`
- [x] CI pipeline runs in < 10 minutes
- [x] PostgreSQL schemas are all created and migrated (12 bounded-context schemas via init script + Prisma)
- [x] Logs appear in centralized logging within 30 seconds (Filebeat ships Docker container logs → Elasticsearch)
- [x] Zero secrets committed to git (TruffleHog secret scanning active in CI)

## Notes
- Elasticsearch healthcheck uses `grep -qE 'green|yellow'` — single-node clusters always report `yellow` (no replicas); both statuses are healthy.
- Filebeat config at `docker/filebeat/filebeat.yml` decodes structured JSON logs from NestJS and attaches Docker metadata.
- Terraform S3 remote state backend is commented out with step-by-step setup instructions. Enable before first team or CI `terraform apply`.
- Deploy jobs in CI use AWS ECS (`pribec-staging` / `pribec-production` clusters). Required secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Required variables: `AWS_REGION`.
- Grafana admin password in docker-compose is `admin` — acceptable for local dev only. Set via `GF_SECURITY_ADMIN_PASSWORD` env var before promoting to staging.

---

## Dependencies
- None — this is the foundation

## Blocks
- Every subsequent sprint depends on this sprint
