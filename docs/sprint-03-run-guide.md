# Sprint 03 Run Guide (Property Marketplace)

This guide starts the Sprint 03 app locally and opens it for browser review.

## Related docs

- [README.md](../README.md)
- [CHANGELOG.md](../CHANGELOG.md)
- [audit-sprint-01-02-03-2026-02-25.md](./audit-sprint-01-02-03-2026-02-25.md)

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

Set persistent file storage values in `apps/api/.env` so uploaded avatars/documents survive API restarts:

```dotenv
LOCAL_STORAGE_DIR=/absolute/path/to/pribec-storage
PUBLIC_STORAGE_BASE_URL=http://localhost:3001/storage
```

Create the storage directory once:

```bash
mkdir -p /absolute/path/to/pribec-storage
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

If `P3006` occurs due to shadow DB schema validation, use:

```bash
npm run migrate:deploy --workspace=apps/api
```

> **Note (2026-03-02):** Two migrations are required for login and registration to work correctly:
> - `202603020008_property_listing_type` — adds `listing_type` column to `property.properties`
> - `202603020009_company_id_on_transactions` — adds `company_id` to `identity.audit_logs` and several property tables
>
> Without `202603020009`, `AuditService.log()` will throw a Postgres "column not found" error on every auth action, returning HTTP 500. These are included automatically by the `migrate:deploy` command above.

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

## Agent dashboard metrics API (updated)

`GET /api/v1/agent/dashboard` now includes Sprint-03 analytics fields:

- `listingViewsLast7d`
- `listingViewsPrevious7d`
- `listingViewsTrendPct`
- `inquiryResponseRatePct`

Quick verify (requires agent auth token):

```bash
curl -s http://localhost:3001/api/v1/agent/dashboard \
  -H "Authorization: Bearer <AGENT_TOKEN>"
```

Expected: response includes the four fields above in addition to existing `totalListings`, `byStatus`, `newInquiries7d`, and `verificationSummary`.

## Profile dashboard + role setup verification (updated)

The profile/role setup flow now uses persisted backend state for verification metrics, business details, and KYC submission.

### Required migration

Run this once if your local DB was created before the business-profile table was added:

```bash
npm run migrate:deploy --workspace=apps/api
```

### Verify role-setup persistence and KYC submission

From repo root:

```bash
python3 scripts/verify_role_setup_flow.py
```

Expected output includes:
- `"business_persisted": true`
- `"kyc_submitted": true`

### Verify resend email endpoint

From Swagger (`/api/docs`) or API client, call:
- `POST /api/v1/auth/resend-verification-email`

Expected behavior:
- `200` response for authenticated user
- verification token re-issued and email dispatch attempted
- audit event recorded for resend action

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

## Agent profile page verification (updated)

The agent profile page now uses the full authenticated shell (sidebar + header) for logged-in users and all interactive buttons are wired to real API endpoints.

### New API endpoints

| Method | Path | Description |
|--------|------|--------------|
| `POST` | `/api/v1/properties/agents/:id/contact` | Log a Contact Agent message (auth optional) |
| `POST` | `/api/v1/properties/agents/:id/schedule-call` | Log a Schedule Call request (auth optional) |
| `GET`  | `/api/v1/properties/agents/:id/reviews` | Paginated published client reviews |

### Required migration

Apply the two new migrations if your local DB was created before these tables existed:

```bash
docker exec -i pribec-postgres psql -U pribec -d pribec_dev \
  < apps/api/prisma/migrations/202602260004_agent_contacts/migration.sql

docker exec -i pribec-postgres psql -U pribec -d pribec_dev \
  < apps/api/prisma/migrations/202602260005_agent_reviews/migration.sql
```

### Verify contact and schedule-call persistence

```bash
AGENT_ID=<uuid-of-any-agent-in-your-db>

# Contact agent
curl -s -X POST http://localhost:3001/api/v1/properties/agents/$AGENT_ID/contact \
  -H 'Content-Type: application/json' \
  -d '{"message":"Interested in your listing","requesterName":"Test Buyer","requesterEmail":"buyer@example.com"}'

# Schedule a call (at least 30 min from now)
curl -s -X POST http://localhost:3001/api/v1/properties/agents/$AGENT_ID/schedule-call \
  -H 'Content-Type: application/json' \
  -d '{"preferredDate":"2026-03-01T10:00:00Z"}'
```

Both return `201` with `{ id, status, createdAt }`.  Rows visible in `property.agent_contacts`.

### Verify reviews endpoint

Insert a test review and confirm it is served back:

```bash
# Insert directly (replace AGENT_ID)
docker exec -i pribec-postgres psql -U pribec -d pribec_dev -c \
  "INSERT INTO property.agent_reviews (agent_id, reviewer_name, rating, comment, property_type) \
   VALUES ('${AGENT_ID}'::uuid, 'Happy Client', 5, 'Excellent service', 'Residential');"

# Read via API
curl -s http://localhost:3001/api/v1/properties/agents/$AGENT_ID/reviews | node -e \
  "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const r=JSON.parse(d);console.log('total='+r.total,'avg='+r.averageRating);})"
```

Expected: `total=1 avg=5`.

## UX Verification Checklist (Routing + Shell)

- Logged-out user does not see left sidebar on `/app/*` screens
- Logged-in user sees reusable left sidebar on `/app/*` screens
- Logged-in user sees full sidebar and header on `/agent-profile/:id`
- `/app/property/:id` shows minimal header (no search/create-listing toolbar)
- Clicking a listing card or map pin opens `/app/property/:id`
- Opening agent profile from property detail appends `?back=/app/property/:id`
- Back action on agent profile returns to originating property detail page
- Direct agent-profile visits without `back` still return to `/app/listings`
- "Contact Agent" button opens a modal form; submitting it returns a success state and writes to `property.agent_contacts`
- "Schedule Call" button opens a datetime picker modal; datetime defaults to now+30 min and can be adjusted; submitting writes to `property.agent_contacts`
- "Call" button is an active `tel:` link when the agent has a phone number; otherwise disabled
- "Email" button is an active `mailto:` link when the agent has an email; otherwise disabled
- Client Reviews section shows a loading spinner while fetching, live reviews from the DB, or an empty-state message — no hardcoded placeholder data

## Stop services

- Stop app dev servers: `Ctrl + C` in each terminal
- Stop containers:

```bash
docker compose -f docker/docker-compose.yml down
```
