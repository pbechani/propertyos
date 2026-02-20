# Sprint 01 — Infrastructure Foundation: Completion Reference

**Phase:** 0 | **Weeks:** 1–3  
**Status:** ✅ COMPLETE — All 18 fixes applied  
**Final Grade:** A+ (100/100)  
**Completed:** 2026-02-21  
**Next Sprint:** Sprint 02 — Identity & Auth ✅ APPROVED TO START

---

## 1. What Was Built

Sprint 01 established the complete development and production infrastructure foundation. All 14 deliverables were completed, plus 18 additional fixes applied across two audit rounds.

### 1.1 Infrastructure Services (Docker Compose)

All services defined in `docker/docker-compose.yml`. Start with:

```bash
cd docker && docker-compose up -d
```

| Service | Image | Port(s) | Purpose |
|---------|-------|---------|---------|
| `pribec-postgres` | postgres:15-alpine | 5432 | Primary database (12 schemas) |
| `pribec-redis` | redis:7-alpine | 6379 | Cache, sessions, rate limiting |
| `pribec-rabbitmq` | rabbitmq:3-management-alpine | 5672, 15672 | Message broker (UI at :15672) |
| `pribec-minio` | minio/minio:latest | 9000, 9001 | S3-compatible object storage |
| `pribec-elasticsearch` | elasticsearch:8.12.0 | 9200 | Log storage |
| `pribec-kibana` | kibana:8.12.0 | 5601 | Log visualisation |
| `pribec-filebeat` | filebeat:8.12.0 | — | Ships Docker logs → Elasticsearch |
| `pribec-prometheus` | prom/prometheus:latest | 9090 | Metrics collection |
| `pribec-grafana` | grafana/grafana:latest | 3002 | Metrics dashboards (admin/admin) |
| `pribec-vault` | hashicorp/vault:1.15 | 8200 | Secrets management |
| `pribec-postgres-exporter` | postgres-exporter | 9187 | DB metrics for Prometheus |
| `pribec-redis-exporter` | redis_exporter | 9121 | Cache metrics for Prometheus |
| `pribec-nginx` | nginx:alpine | 80, 443 | HTTPS proxy (profile: `https`) |

> **Filebeat** automatically ships all Docker container stdout/stderr to Elasticsearch using `docker/filebeat/filebeat.yml`. Logs are indexed as `pribec-logs-YYYY.MM.DD`.

### 1.2 NestJS API (`apps/api`)

**Entry point:** `apps/api/src/main.ts`  
**App module:** `apps/api/src/app.module.ts`  
**Base URL:** `http://localhost:3001/api/v1`  
**Swagger docs:** `http://localhost:3001/api/docs`

**Modules registered in AppModule:**

| Module | Location | Role |
|--------|----------|------|
| `ConfigModule` | `@nestjs/config` | Global config with Joi validation |
| `DatabaseModule` | `src/database/` | Global Prisma ORM provider |
| `CacheModule` | `src/cache/` | Global Redis provider |
| `VaultModule` | `src/common/vault/` | Secrets management with env-var fallback |
| `ThrottlerModule` | `@nestjs/throttler` | Rate limiting (100/min default, 10/min auth) |
| `SentryModule` | `src/common/sentry/` | Error tracking + exception filter |
| `HealthModule` | `src/health/` | Health check endpoints |
| `MetricsModule` | `src/metrics/` | Prometheus metrics endpoint |

### 1.3 Database Architecture — 12 Bounded-Context Schemas

All schemas created via `docker/init-scripts/01-create-schemas.sql` on first Postgres start and declared in `apps/api/prisma/schema.prisma`.

| Schema | Purpose |
|--------|---------|
| `identity` | Users, roles, KYC, sessions — **Sprint 02 target** |
| `property` | Listings, ownership, verification |
| `sales` | 14-stage purchase pipeline, documents |
| `financial` | Accounts, ledger, escrow (event-sourced, append-only) |
| `construction` | Projects, milestones, stages |
| `marketplace` | Contractors, suppliers, RFQ |
| `logistics` | Operators, deliveries, tracking |
| `inspection` | Requirements, results, certificates |
| `analytics` | Risk scores, predictions |
| `ai_engine` | Design sessions, generated content |
| `audit` | Shared audit logs (cross-cutting) |
| `common` | Shared lookup tables: currencies, countries |

**Pre-seeded data** (loaded from init script):
- `common.currencies`: USD, ZAR, KES, NGN, GHS, EUR, GBP
- `common.countries`: ZA, KE, NG, GH, US, GB

### 1.4 Security Foundations

| Measure | Implementation | Notes |
|---------|---------------|-------|
| Security headers | `helmet()` in `main.ts` | CSP, X-Frame-Options, XSS protection, nosniff |
| CORS | `app.enableCors()` driven by `CORS_ORIGINS` env var | Whitelist only |
| Rate limiting | `ThrottlerModule` — 100 req/min default, 10 req/min `auth` | Applied globally via `ThrottlerGuard` |
| Input validation | `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true` | Strips unknown fields |
| SQL injection | Prisma ORM — all queries parameterised | No raw SQL concatenation |
| Secrets | Vault + env-var fallback; `JWT_SECRET` & `ENCRYPTION_KEY` required in `production`/`staging` | See env validation |
| Secret scanning | TruffleHog in CI | Blocks PR if verified secrets detected |
| HTTPS (local) | Nginx with TLS 1.2/1.3 via `--profile https` | Run `scripts/generate-local-certs.sh` first |

---

## 2. Key File Reference

### Configuration & Environment

| File | Purpose |
|------|---------|
| `apps/api/src/config/env.validation.ts` | Joi schema — validates all env vars on startup |
| `apps/api/.env.example` | Template for all required environment variables |
| `.env.example` | Root-level env template |

**Required env vars** (must be set before starting API):

```env
# Required always
DATABASE_URL=postgres://pribec:pribec_dev_password@localhost:5432/pribec_dev
REDIS_URL=redis://localhost:6379

# Required in production/staging (optional in development — Vault can supply)
JWT_SECRET=<min 32 chars>
ENCRYPTION_KEY=<min 32 chars>
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Optional — enable Vault for secrets
VAULT_ENABLED=false
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=pribec-dev-token

# Optional
RABBITMQ_URL=amqp://localhost:5672
SENTRY_DSN=
CORS_ORIGINS=http://localhost:3000
```

### Database

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | Multi-schema Prisma config; all 12 schemas declared |
| `apps/api/prisma/migrations/` | Migration history (tracked in git) |
| `docker/init-scripts/01-create-schemas.sql` | SQL init script — creates all schemas + seeds common data |

**Working with Prisma:**

```bash
# Generate client after schema change
npx prisma generate

# Create a migration
npx prisma migrate dev --name <description>

# Apply pending migrations
npx prisma migrate deploy

# Validate schema
npx prisma validate
```

### Services & Modules

| File / Directory | Purpose |
|-----------------|---------|
| `apps/api/src/database/prisma.service.ts` | PrismaClient wrapper with `healthCheck()` |
| `apps/api/src/cache/redis.service.ts` | ioredis wrapper with TTL, JSON helpers, health check |
| `apps/api/src/common/vault/vault.service.ts` | Vault HTTP client with 5-minute secret cache + env fallback |
| `apps/api/src/common/sentry/sentry.filter.ts` | Global exception filter → Sentry |
| `apps/api/src/metrics/metrics.service.ts` | `prom-client` HTTP duration histogram + request counter |
| `apps/api/src/config/env.validation.ts` | Joi environment schema |

### Infrastructure as Code

| File | Purpose |
|------|---------|
| `infrastructure/terraform/main.tf` | AWS: VPC, RDS, ElastiCache, S3, ECS, ACM |
| `infrastructure/terraform/terraform.tfvars.example` | Variable template |
| `docker/filebeat/filebeat.yml` | Filebeat log-shipping config |
| `docker/nginx/nginx.conf` | Local HTTPS reverse proxy |
| `docker/vault/config/vault.hcl` | Vault server config |
| `docker/prometheus/prometheus.yml` | Prometheus scrape targets |

---

## 3. Health Endpoints

| Endpoint | Purpose | Used By |
|----------|---------|--------|
| `GET /api/v1/health` | Full status: API + DB + Redis | Monitoring |
| `GET /api/v1/health/ready` | DB + Redis checked; blocks traffic if unhealthy | Kubernetes readiness probe |
| `GET /api/v1/health/live` | Liveness only — `{ status: "ok" }` | Kubernetes liveness probe |
| `GET /api/v1/metrics` | Prometheus text format metrics | Prometheus scraper |

**Sample healthy response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T08:00:00.000Z",
  "uptime": 120.5,
  "version": "0.1.0",
  "checks": {
    "api": { "status": "ok" },
    "database": { "status": "ok", "message": "Connected" },
    "redis": { "status": "ok", "message": "Connected" }
  }
}
```

---

## 4. CI/CD Pipeline (`.github/workflows/ci.yml`)

### Stages

| Stage | Trigger | What It Does |
|-------|---------|-------------|
| `lint` | every push/PR | ESLint + Prettier check |
| `test` | every push/PR (parallel with lint) | Unit + E2E tests; Prisma migrate; coverage ≥ 80% enforced |
| `build` | after lint + test | `npm run build`; uploads artifacts |
| `security-scan` | after build | Trivy (CRITICAL/HIGH CVEs) + TruffleHog (secrets) |
| `deploy-staging` | push to `main` | ECR build/push → `aws ecs update-service` on `pribec-staging` |
| `deploy-prod` | git tag `v*` | Re-tag ECR image → `aws ecs update-service` on `pribec-production` |

### Services Provided to Test Job

- `postgres:15-alpine` (pribec / pribec_test_password / pribec_test)
- `redis:7-alpine`
- `rabbitmq:3-alpine`

### Required GitHub Secrets / Variables

| Type | Key | Purpose |
|------|-----|---------|
| Secret | `AWS_ACCESS_KEY_ID` | ECS deploy |
| Secret | `AWS_SECRET_ACCESS_KEY` | ECS deploy |
| Secret | `CODECOV_TOKEN` | Coverage upload |
| Variable | `AWS_REGION` | e.g. `us-east-1` |
| Variable | `TURBO_TEAM` | Remote cache (optional) |

---

## 5. Shared Types Package (`packages/shared-types`)

`@pribec/shared-types` — imported as a workspace package by `apps/api` and `apps/web`.

**Available types (200+) in `src/index.ts`:**

| Category | Key Exports |
|----------|-------------|
| API | `ApiResponse<T>`, `PaginatedResponse<T>`, `SearchParams` |
| Financial | `Money`, `PaymentMethod`, `CurrencyCode` |
| Users | `UserRole`, `VerificationStatus`, `UserBasic` |
| Property | `PropertyType`, `PropertyStatus`, `Address`, `GeoLocation` |
| Construction | `ProjectStatus`, `MilestoneStatus` |
| Files | `FileUpload`, `ImageMetadata` |
| Errors | `ErrorCode`, `AppError` |
| Utilities | `Nullable<T>`, `Optional<T>`, `DeepPartial<T>`, `DateRange`, `PriceRange` |

**Constants (250+) in `src/constants.ts`:** HTTP statuses, pagination defaults, file size limits, supported currencies, construction stages, etc.

---

## 6. Test Coverage

| Type | Files | Tests | Coverage Threshold |
|------|-------|-------|--------------------|
| Unit | `src/**/*.spec.ts` | 9+ tests | 80% lines/branches/functions/statements |
| E2E | `test/health.e2e-spec.ts` | 3 tests | — |

**Running tests:**

```bash
# Unit tests
npm run test --workspace=apps/api

# E2E tests
npm run test:e2e --workspace=apps/api

# Coverage report
npm run test:cov --workspace=apps/api
```

---

## 7. Terraform (AWS Cloud)

**Modules provisioned** (`infrastructure/terraform/`):

| Module | Resource |
|--------|----------|
| `vpc` | VPC, subnets, routing |
| `rds` | PostgreSQL RDS (Multi-AZ) |
| `elasticache` | Redis ElastiCache |
| `s3` | Document storage buckets |
| `ecs` | Fargate cluster + services |
| `acm` | SSL certificates |

**⚠️ Remote state must be bootstrapped before first team/CI apply:**

```bash
# Create S3 bucket + DynamoDB lock table
aws s3api create-bucket --bucket pribec-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket pribec-terraform-state \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket pribec-terraform-state \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws dynamodb create-table --table-name pribec-terraform-locks \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH --region us-east-1

# Then uncomment the backend "s3" block in main.tf and run:
terraform init -reconfigure
```

---

## 8. Local Setup Checklist

```bash
# 1. Install dependencies
npm install   # postinstall auto-runs prisma generate

# 2. Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
# Edit both files — set DATABASE_URL, REDIS_URL etc.

# 3. Start infrastructure
cd docker && docker-compose up -d
cd ..

# 4. Apply database migrations
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

# 5. (Optional) HTTPS proxy
./scripts/generate-local-certs.sh
cd docker && docker-compose --profile https up -d nginx

# 6. (Optional) Init Vault with dev secrets
./scripts/init-vault.sh

# 7. Start API
npm run dev --workspace=apps/api

# 8. Verify
curl http://localhost:3001/api/v1/health
```

**Create MinIO buckets** (one-time, `http://localhost:9001` user: pribec_access_key / pribec_secret_key):
- `pribec-documents`
- `pribec-uploads`
- `pribec-backups`
- `pribec-progress-photos`

---

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Port 3001 in use | `lsof -i :3001` → `kill -9 <PID>` or set `PORT=3002` in `.env` |
| Docker services fail to start | `docker-compose down -v && docker-compose up -d` |
| DB connection refused | Confirm `pribec-postgres` is healthy: `docker-compose ps \| grep postgres` |
| Redis connection refused | `docker exec pribec-redis redis-cli ping` |
| Prisma client not found | `npx prisma generate` |
| Env validation fails on startup | Check all required vars in `apps/api/.env` (`DATABASE_URL`, `REDIS_URL`) |
| CI coverage below 80% | `npm run test:cov` locally → review `coverage/lcov-report/index.html` |
| Kibana won't start | Check ES health: `curl localhost:9200/_cluster/health` (yellow is fine for single-node) |
| Logs not in Kibana | Verify Filebeat started: `docker-compose logs filebeat` |

---

## 10. Sprint 02 Prerequisites — All Met ✅

Sprint 02 (Identity & Auth) can begin immediately. Everything it needs is ready:

| Prerequisite | Status | Detail |
|---|---|---|
| `identity` schema exists | ✅ | Created in Postgres; declared in Prisma schema |
| Prisma ORM configured | ✅ | `PrismaService` available globally via `DatabaseModule` |
| Redis for sessions | ✅ | `RedisService` available globally via `CacheModule` |
| JWT infrastructure | ✅ | `JWT_SECRET` / `JWT_EXPIRY` / `REFRESH_TOKEN_EXPIRY` in env validation; Vault ready |
| Rate limiting on auth endpoints | ✅ | `ThrottlerModule` with `auth` config (10 req/min) already registered |
| Audit logging table | ✅ | `audit.logs` table live with indexes on user, record, timestamp |
| Test framework | ✅ | Jest configured, 80% coverage enforced, E2E runner ready |
| CI pipeline | ✅ | Will automatically test + deploy auth code |
| Security headers | ✅ | Helmet, CORS, validation pipe all in place |
| Shared types | ✅ | `UserRole`, `VerificationStatus`, `UserBasic` already defined |

### What Sprint 02 Will Add to the `identity` Schema

Sprint 02 will create Prisma models and migrations for:
- `identity.users` — core user record (UUID PK, email, hashed password, role, KYC status)
- `identity.sessions` — JWT refresh token store (backed by Redis for fast lookup)
- `identity.roles` / `identity.permissions` — RBAC tables
- `identity.kyc_attempts` — KYC submission records

These will be added via `npx prisma migrate dev` and automatically deployed in CI via `npx prisma migrate deploy`.

---

## 11. All Fixes Applied (18 total)

### Round 1 — 2026-02-20 (12 fixes)

| # | Fix | Files |
|---|-----|-------|
| 1 | Prisma schema + multi-schema config | `apps/api/prisma/schema.prisma` |
| 2 | `DatabaseModule` + `PrismaService` with health check | `src/database/*` |
| 3 | Baseline unit + E2E test suite | `src/health/*.spec.ts`, `test/health.e2e-spec.ts` |
| 4 | `VaultModule.forRoot()` dynamic module + wired in `AppModule` | `src/common/vault/vault.module.ts`, `app.module.ts` |
| 5 | `CacheModule` + `RedisService` with health check | `src/cache/*` |
| 6 | Joi env validation schema wired into `ConfigModule` | `src/config/env.validation.ts` |
| 7 | Root `CHANGELOG.md` created | `CHANGELOG.md` |
| 8 | `MetricsModule` + Prometheus `/metrics` endpoint | `src/metrics/*` |
| 9 | CI coverage enforcement (80% threshold) | `.github/workflows/ci.yml`, `jest.config.js` |
| 10 | Postgres + Redis exporters in Docker Compose | `docker/docker-compose.yml`, `docker/prometheus/prometheus.yml` |
| 11 | Full shared types package (200+ types, 250+ constants) | `packages/shared-types/src/*` |
| 12 | Production multi-stage `Dockerfile` + `.dockerignore` | `apps/api/Dockerfile` |

### Round 2 — 2026-02-21 (6 fixes)

| # | Fix | Files |
|---|-----|-------|
| 13 | Filebeat service + config for log shipping to Elasticsearch | `docker/docker-compose.yml`, `docker/filebeat/filebeat.yml` |
| 14 | Elasticsearch healthcheck: `grep -qE 'green\|yellow'` (single-node is always yellow) | `docker/docker-compose.yml` |
| 15 | `JWT_SECRET` + `ENCRYPTION_KEY` required in `production`/`staging` | `apps/api/src/config/env.validation.ts` |
| 16 | `rabbitmq:3-alpine` CI service + `RABBITMQ_URL` env in test job | `.github/workflows/ci.yml` |
| 17 | Real ECS deploy: ECR build/push + `ecs update-service wait` | `.github/workflows/ci.yml` |
| 18 | Terraform remote state bootstrap: S3 + DynamoDB prerequisites documented | `infrastructure/terraform/main.tf` |

---

*Source files: `design/sprints/sprint-01/` — report.md, AUDIT-REPORT-FINAL.md, CHANGELOG.md, FIXES-APPLIED.md, fixes.md, completion-summary.md, high-priority-completion.md, medium-priority-completion.md, final-summary.md, ultimate-summary.md, manual-steps.md*
