# Sprint 03 Run Guide (Property Marketplace)

This guide starts the Sprint 03 app locally and opens it for browser review.

## What you will run

- API (NestJS): `http://localhost:3001`
- Web app (Next.js): `http://localhost:3000`
- API docs (Swagger): `http://localhost:3001/api/docs`

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker Desktop running

## 1) Install dependencies

From repository root:

```bash
npm install
```

## 2) Ensure env files exist

From repository root:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

> Note: the web app currently reads `NEXT_PUBLIC_API_BASE_URL` in code, but defaults to `http://localhost:3001/api/v1` if not set.

## 3) Start infrastructure services

The repo script uses `docker-compose`:

```bash
npm run docker:up
```

If your machine only has Docker Compose v2 (`docker compose`) and/or the `postgis/postgis:15-alpine` tag fails, use this fallback:

```bash
cat > /tmp/pribec-compose.override.yml <<'YAML'
services:
  postgres:
    image: postgis/postgis:15-3.4-alpine
YAML

docker compose -f docker/docker-compose.yml -f /tmp/pribec-compose.override.yml up -d postgres redis rabbitmq
```

## 4) Run database migrations

Preferred:

```bash
npm run db:migrate
```

If `P3006` occurs due shadow DB schema validation, use:

```bash
npm run migrate:deploy --workspace=apps/api
```

## 5) Start API and Web

Use separate terminals from repository root:

```bash
npm run dev --workspace=apps/api
```

```bash
npm run dev --workspace=apps/web
```

## 6) Verify and review in browser

```bash
curl http://localhost:3001/api/v1/health
```

Open:

- `http://localhost:3000` (Sprint-03 review UI)
- `http://localhost:3001/api/docs` (Swagger)

## Quick smoke checks

- Web root returns `200`
- API health returns `200`
- Property search endpoint responds:

```bash
curl "http://localhost:3001/api/v1/properties?city=Harare&page=1&limit=10"
```

## Stop services

- Stop app dev servers: `Ctrl + C` in each terminal
- Stop containers:

```bash
docker compose -f docker/docker-compose.yml down
```
