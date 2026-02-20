# Sprint 01 — Manual Steps Required

**Status:** Updated with Critical Fixes Applied  
**Last Updated:** 2026-02-20

Steps that must be performed manually to complete the infrastructure setup.

---

## ✅ Critical Fixes Completed

The following critical issues identified in the audit have been fixed:

- ✅ **Prisma initialized** — Database layer configured with multi-schema support
- ✅ **Database module created** — PrismaService with health checks
- ✅ **Baseline tests added** — Unit and E2E tests for health endpoints
- ✅ **Vault module integrated** — Properly configured in app.module

---

## Required Before Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Copy Environment Files
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```
Then edit each file to set actual secret values.

### 3. Start Docker Services
```bash
cd docker
docker-compose up -d
```

### 4. Generate Local SSL Certificates (Optional)
```bash
# Requires: brew install mkcert && mkcert -install
chmod +x scripts/generate-local-certs.sh
./scripts/generate-local-certs.sh
```

### 5. Initialize Vault with Dev Secrets
```bash
chmod +x scripts/init-vault.sh
./scripts/init-vault.sh
```

---

## External Services

### 6. Create Sentry Project
1. Create account at [sentry.io](https://sentry.io)
2. Create Node.js project
3. Copy DSN to `apps/api/.env`

### 7. Create MinIO Buckets
1. Open http://localhost:9001
2. Login with `minioadmin`/`minioadmin`
3. Create buckets: `pribec-documents`, `pribec-uploads`, `pribec-backups`, `pribec-progress-photos`

### 8. Configure GitHub Secrets
Add to **Repository → Settings → Secrets → Actions**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `SENTRY_DSN`
- `SNYK_TOKEN`

---

## Production Only

### 9. Configure AWS & Apply Terraform
```bash
aws configure
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with actual values
terraform init
terraform plan
terraform apply
```

### 10. Configure DNS for SSL
Add CNAME records for ACM certificate validation after Terraform creates them.

---

## Verification
```bash
# Check all services running
docker-compose ps

# Test health endpoint
curl http://localhost:3001/api/v1/health
```

---

## Troubleshooting Guide

### ❌ Port Already in Use (EADDRINUSE)

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change PORT in .env
echo "PORT=3002" >> apps/api/.env
```

### ❌ Docker Services Won't Start

**Problem:** `docker-compose up` fails with service errors

**Solution:**
```bash
# Check Docker is running
docker ps

# Clear old containers and volumes
docker volume prune -f
docker-compose down -v

# Start fresh
docker-compose up -d

# View logs for specific service
docker-compose logs postgres  # or redis, rabbitmq, etc.
```

### ❌ Database Connection Failed

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Verify PostgreSQL is running
docker-compose ps | grep postgres

# Check database exists
docker exec pribec-postgres psql -U pribec -d pribec_dev -c "\l"

# Verify DATABASE_URL is correct in .env
cat apps/api/.env | grep DATABASE_URL
# Should be: postgres://pribec:pribec_dev_password@localhost:5432/pribec_dev
```

### ❌ Redis Connection Failed

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Verify Redis is running
docker-compose ps | grep redis

# Test Redis connection
redis-cli ping  # Should return PONG

# Or from Docker container
docker exec pribec-redis redis-cli ping
```

### ❌ Prisma Client Generation Fails

**Problem:** `Error: @prisma/client did not initialize yet`

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Verify schema is valid
npx prisma validate

# Apply schema to database
npx prisma migrate deploy
```

### ❌ Environment Variables Not Loaded

**Problem:** Config validation fails on startup

**Solution:**
```bash
# Verify .env file exists
ls -la apps/api/.env

# Check required variables are set
cat apps/api/.env | grep DATABASE_URL
cat apps/api/.env | grep REDIS_URL
cat apps/api/.env | grep JWT_SECRET

# Copy missing variables from example
cat apps/api/.env.example
```

### ❌ Tests Fail with Coverage Error

**Problem:** `FAIL: Coverage is below 80% threshold`

**Solution:**
```bash
# View coverage report
cat coverage/coverage-summary.json

# Run tests with verbose output
npm run test -- --verbose

# Run only failing test file
npm run test -- health.controller.spec.ts

# Skip coverage check temporarily for debugging
npm run test -- --no-coverage
```

### ❌ CI Pipeline Fails

**Problem:** GitHub Actions workflow shows failures

**Solution:**
```bash
# Trigger CI by pushing code
git push

# View logs in GitHub: Actions tab → select workflow

# Most common issues:
# 1. Database health check timeout
# 2. Prisma migration failed
# 3. Coverage below 80%
# 4. Security scan detected secrets
```

---

## Performance Optimization

### Faster Local Development

```bash
# Use npm ci instead of npm install (deterministic)
npm ci

# Development watch mode
npm run dev

# Run only specific tests
npm run test -- health

# Skip coverage checks for faster feedback
npm run test -- --no-coverage
```

### Faster Docker Startup

```bash
# Start only essential services
docker-compose up -d postgres redis rabbitmq minio

# Skip logging/monitoring for local dev
# (can skip elasticsearch, kibana, prometheus, grafana)
```

---

## Prerequisites

Before starting, verify you have:

```bash
# ✅ Node.js 20+
node --version

# ✅ npm 10+
npm --version

# ✅ Docker & Docker Compose
docker --version
docker-compose --version

# ✅ Git
git --version

# ✅ PostgreSQL CLI (optional but recommended)
psql --version

# ✅ Redis CLI (optional but recommended)
redis-cli --version
```

Missing something?
```bash
# macOS (using Homebrew)
brew install node docker-compose postgresql redis

# Ubuntu/Debian
sudo apt-get install nodejs npm docker.io docker-compose postgresql-client redis-tools

# Windows: Use Docker Desktop + WSL2 or WSL
```
