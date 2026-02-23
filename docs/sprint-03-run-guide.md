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

## Listings first-load behavior (updated)

- On first load, the listings screen now starts with no selected filters.
- This allows backend data to render immediately without requiring manual reset.
- Filters still persist per-session in browser storage after user interaction.

## Listings location filtering (updated)

- The Location section no longer uses predefined location checkboxes.
- Users now type locations with assisted suggestions and press `Enter` (or `,`) to add each location.
- Multiple locations are supported and shown as removable chips.
- Listings are matched when property location text contains any selected location chip.

## Seed local demo listings (optional)

If your local database is empty, run the commands below from repo root to create a demo agent and three active listings:

```bash
curl -s -X POST http://localhost:3001/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"agent.demo.20260223@example.com","password":"TempPass123!","firstName":"Demo","lastName":"Agent","role":"agent"}'

TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"agent.demo.20260223@example.com","password":"TempPass123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);process.stdout.write(j?.tokens?.accessToken||'');});")

curl -s -X POST http://localhost:3001/api/v1/properties -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"title":"Modern 3-Bed Home in Gaborone","description":"Move-in ready family home with secure yard.","propertyType":"residential","price":185000,"currency":"USD","bedrooms":3,"bathrooms":2,"parkingSpaces":2,"areaSqm":210,"features":["Garden","Solar Water Heater","Fibre Internet"],"location":{"city":"Gaborone","region":"South-East","country":"BW","latitude":-24.6545,"longitude":25.9086}}'
curl -s -X POST http://localhost:3001/api/v1/properties -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"title":"Serviced Plot Near Airport Junction","description":"Prime land parcel ideal for mixed-use development.","propertyType":"land","price":92000,"currency":"USD","areaSqm":1200,"features":["Road Access","Water Connection","Fenced"],"location":{"city":"Gaborone","region":"South-East","country":"BW","latitude":-24.6280,"longitude":25.9230}}'
curl -s -X POST http://localhost:3001/api/v1/properties -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"title":"Commercial Office Space - Francistown","description":"Flexible office units suitable for SMEs.","propertyType":"commercial","price":310000,"currency":"USD","bathrooms":4,"parkingSpaces":8,"areaSqm":640,"features":["Backup Power","CCTV","Reception"],"location":{"city":"Francistown","region":"North-East","country":"BW","latitude":-21.1702,"longitude":27.5070}}'

curl -s -X PATCH http://localhost:3001/api/v1/properties/ba61e499-5153-461a-bf49-709632e84930 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"status":"active"}'
curl -s -X PATCH http://localhost:3001/api/v1/properties/a5d6c9e8-5b05-43e2-9a59-ecfd7205da77 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"status":"active"}'
curl -s -X PATCH http://localhost:3001/api/v1/properties/98256dfb-ed63-4e06-9f31-c13d94e91fb0 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"status":"active"}'
```

Verify:

```bash
curl -s "http://localhost:3001/api/v1/properties?sort=newest&limit=100"
```

> Note: public property search currently returns only `active` listings; newly created listings default to `draft`.

## UX Verification Checklist (Routing + Shell)

- Logged-out user does not see left sidebar on `/app/*` screens
- Logged-in user sees reusable left sidebar on `/app/*` screens
- `/app/property/:id` shows minimal header (no search/create-listing toolbar)
- Clicking a listing card or map pin opens `/app/property/:id`
- Opening agent profile from property detail appends `?back=/app/property/:id`
- Back action on agent profile returns to originating property detail page
- Direct agent-profile visits without `back` still return to `/app/listings`

## Stop services

- Stop app dev servers: `Ctrl + C` in each terminal
- Stop containers:

```bash
docker compose -f docker/docker-compose.yml down
```
