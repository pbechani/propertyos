# Sprint 07-B: Contractor Marketplace + Job Execution System

> A production-grade system design for a hybrid Thumbtack/Upwork/Uber contractor marketplace embedded inside the PRIBEC real estate platform.

---

## Table of Contents

1. [Core System Overview](#1-core-system-overview)
2. [User Roles](#2-user-roles)
3. [End-to-End Flow](#3-end-to-end-flow)
4. [System Modules](#4-system-modules)
5. [AI Enhancements](#5-ai-enhancements)
6. [Database Schema](#6-database-schema)
7. [Architecture](#7-architecture)
8. [Key Screens — User Side](#8-key-screens--user-side)
9. [Key Screens — Contractor Side](#9-key-screens--contractor-side)
10. [Advanced Features](#10-advanced-features)
11. [MVP Build Plan](#11-mvp-build-plan)
12. [API Specification](#12-api-specification)
13. [Contractor Matching Algorithm](#13-contractor-matching-algorithm)
14. [UI Screen Blueprint (200+)](#14-ui-screen-blueprint-200)

---

## 1. Core System Overview

### Goal

Enable:

- **Contractors** → register, showcase services, send quotes
- **Users** (property owners/agents) → search, request work, compare quotes
- **Platform** → manage trust, payments, and execution

---

## 2. User Roles

### Property Users
- Homeowners
- Real estate agents
- Property managers

### Contractors
- Individuals or companies
- Categories: plumber, electrician, builder, painter, etc.

### Admin
- Platform control, verification, dispute resolution

---

## 3. End-to-End Flow

### Phase 1: Discovery

User searches (e.g. "Plumber near me") with filters: rating, price range, availability. System returns geo-based contractor listings.

### Phase 2: Job Request

User creates a job with:
- Title (e.g. "Fix leaking pipe")
- Description
- Images/videos
- Location
- Budget (optional)
- Timeline

### Phase 3: Contractor Engagement

Two supported models:

| Model | Description |
|-------|-------------|
| **Open Marketplace** | Job visible to relevant contractors; they submit quotes |
| **Direct Hire** | User selects a contractor and sends a direct request |

### Phase 4: Quotation System

Contractor submits:
- Price (fixed or hourly)
- Breakdown (materials + labor)
- Timeline
- Notes

User can:
- Compare quotes
- Chat with contractors
- Negotiate

### Phase 5: Hiring

User accepts quote:
- Contract created automatically
- Job status → **Assigned**

### Phase 6: Job Execution

- Milestones (optional)
- Progress updates (photos, notes)
- Real-time chat

### Phase 7: Payment

- Escrow system (recommended)
- Milestone-based release
- Platform commission

### Phase 8: Review System

- User rates contractor
- Contractor rates client (optional)

---

## 4. System Modules

### Module 1: Contractor Management System

**Features:**
- Registration & onboarding
- KYC / verification
- Portfolio uploads
- Skills & categories
- Service areas (geo radius)

**Contractor Profile includes:**
- Name / company
- Ratings & reviews
- Completed jobs
- Certifications
- Pricing model

### Module 2: Search & Discovery Engine

**Capabilities:**
- Geo-based search (PostGIS)
- Category filtering

**Ranking algorithm:**

```
score = (rating × 0.4) + (distance × 0.2) + (price_competitiveness × 0.2) + (response_time × 0.2)
```

### Module 3: Job Management System

**Job States:**

```
Draft → Open → Quoting → Assigned → In Progress → Completed → Closed
```

**Features:**
- Attachments (images/videos)
- Budget tracking
- Timeline tracking

### Module 4: Quotation Engine

**Data Model:**

```
Quote:
  - id
  - job_id
  - contractor_id
  - price
  - breakdown (JSON)
  - timeline_days
  - status: pending | accepted | rejected
```

**Advanced:**
- Versioning (multiple revisions)
- AI-assisted pricing suggestions

### Module 5: Messaging System

- Real-time chat (WebSockets)
- Attachments
- Read receipts
- System messages (quote updates, status changes)

### Module 6: Contract & Agreement System

Auto-generated when a quote is accepted. Includes:
- Scope of work
- Payment terms
- Timeline
- Legal clauses

### Module 7: Payment System

**Options:**
- Escrow wallet
- Direct payment integration

**Flow:**
1. User funds escrow
2. Contractor starts work
3. Milestone completed
4. Funds released

### Module 8: Review & Reputation System

**Metrics:** Quality · Timeliness · Communication · Value

### Module 9: Notification System

**Channels:** Push notifications · Email · SMS (optional)

**Triggers:**
- New quote received
- Job accepted
- Payment released

---

## 5. AI Enhancements

| Feature | Description |
|---------|-------------|
| **Smart Job Creation** | User describes problem → AI structures job post |
| **Auto Contractor Matching** | Recommend best contractors instantly |
| **Quote Intelligence** | Suggest fair pricing based on location, job type, historical data |
| **Fraud Detection** | Flag suspicious behavior automatically |
| **Smart Assistant** | Natural language queries: "Find me the cheapest electrician available tomorrow" |

---

## 6. Database Schema

```sql
-- Users
id, name, email, role, rating

-- Contractors
id, user_id, category, bio, verified, rating

-- Jobs
id, user_id, title, description, status, location, budget

-- Quotes
id, job_id, contractor_id, price, status

-- Contracts
id, job_id, contractor_id, terms, signed_at

-- Payments
id, contract_id, amount, status

-- Reviews
id, job_id, reviewer_id, rating, comment
```

---

## 7. Architecture

### Frontend
- Web (React)
- Mobile (React Native)

### Backend
- Node.js / NestJS
- REST API + WebSockets

### Services
- Auth Service
- Job Service
- Quote Service
- Payment Service
- Messaging Service (WebSockets)

### Infrastructure

| Component | Purpose |
|-----------|---------|
| PostgreSQL | Primary database |
| Redis | Sessions + caching + geo |
| S3 | Media storage |
| Kafka | Event streaming |
| WebSocket Gateway | Real-time updates |

---

## 8. Key Screens — User Side

- Search contractors
- Contractor profile
- Create job
- Job detail page
- Quotes comparison
- Chat screen
- Payment screen
- Review screen

---

## 9. Key Screens — Contractor Side

- Dashboard
- Job feed (available jobs)
- Submit quote
- Active jobs
- Earnings dashboard
- Profile management

---

## 10. Advanced Features

| Feature | Description |
|---------|-------------|
| Live Tracking | Uber-style contractor location tracking |
| Invoice Generation | Auto-generate invoices on job completion |
| Multi-Contractor Projects | Assign multiple contractors to a single job |
| Maintenance Subscriptions | Recurring service packages |
| Team Accounts | Multi-member contractor company accounts |
| Analytics Dashboard | Business intelligence for contractors and admins |

---

## 11. MVP Build Plan (30–45 Days)

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| Phase 1 | Week 1–2 | Auth, Contractor registration, Job posting |
| Phase 2 | Week 3 | Quotation system, Search |
| Phase 3 | Week 4 | Chat, Hiring flow |
| Phase 4 | Week 5–6 | Payments, Reviews, Notifications |

### Strategic Integration Insight

> This system becomes very powerful when integrated into the real estate platform:
> - **Property listing** → "Request maintenance"
> - **Tenant** → "Report issue"
> - **Agent** → "Assign contractor instantly"
>
> This turns the platform into a full property lifecycle ecosystem, not just listings.

---

## 12. API Specification

### Base URL

```
https://api.yourplatform.com/v1
```

### Auth Strategy

- JWT (access + refresh tokens)
- Role-based access control (RBAC): `USER` | `CONTRACTOR` | `ADMIN`

---

### 12.1 Authentication API

#### POST /auth/register

```json
{
  "name": "John Doe",
  "email": "john@email.com",
  "password": "securepass",
  "role": "USER | CONTRACTOR"
}
```

#### POST /auth/login

```json
{
  "email": "john@email.com",
  "password": "securepass"
}
```

**Response:**

```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "user": {
    "id": "uuid",
    "role": "USER"
  }
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

---

### 12.2 Contractor API

#### POST /contractors/profile

```json
{
  "categories": ["plumbing", "electrical"],
  "bio": "Experienced contractor",
  "hourly_rate": 25,
  "service_radius_km": 20,
  "location": {
    "lat": -17.8252,
    "lng": 31.0335
  }
}
```

#### GET /contractors/{id}

Returns full contractor profile.

#### GET /contractors/search

Query params: `?category=plumbing&lat=-17.82&lng=31.03&radius=10&min_rating=4`

#### POST /contractors/{id}/verify

Admin only — verify a contractor account.

---

### 12.3 Job API

#### POST /jobs

```json
{
  "title": "Fix leaking pipe",
  "description": "Kitchen pipe leaking",
  "category": "plumbing",
  "location": { "lat": -17.82, "lng": 31.03 },
  "budget": 100,
  "images": ["url1", "url2"]
}
```

#### GET /jobs/{id}

#### GET /jobs

Query params: `?status=open&category=plumbing&near_me=true`

#### POST /jobs/{id}/invite

```json
{ "contractor_id": "uuid" }
```

#### PATCH /jobs/{id} · DELETE /jobs/{id}

---

### 12.4 Quotation API

#### POST /quotes

```json
{
  "job_id": "uuid",
  "price": 120,
  "timeline_days": 2,
  "breakdown": [
    { "item": "Labor", "amount": 80 },
    { "item": "Materials", "amount": 40 }
  ],
  "message": "Can complete quickly"
}
```

#### GET /jobs/{id}/quotes

#### PATCH /quotes/{id} · POST /quotes/{id}/accept · POST /quotes/{id}/reject

---

### 12.5 Contract API

#### POST /contracts

Auto-created on quote acceptance.

#### GET /contracts/{id}

#### POST /contracts/{id}/sign

Digitally sign the contract.

---

### 12.6 Messaging API

#### REST (fallback)

- `GET /conversations`
- `GET /conversations/{id}/messages`

#### WebSocket (primary)

**Connection:** `wss://api.yourplatform.com/ws`

**Send Message:**

```json
{
  "type": "SEND_MESSAGE",
  "payload": {
    "conversation_id": "uuid",
    "message": "Hello",
    "attachments": []
  }
}
```

**Receive Message:**

```json
{
  "type": "NEW_MESSAGE",
  "payload": {
    "message_id": "uuid",
    "sender_id": "uuid",
    "message": "Hello"
  }
}
```

---

### 12.7 Payment API

#### POST /payments/escrow/fund

```json
{
  "contract_id": "uuid",
  "amount": 120
}
```

#### POST /payments/release

```json
{
  "contract_id": "uuid",
  "milestone_id": "uuid"
}
```

#### GET /payments/{id}

#### POST /webhooks/payments

Payment provider webhook handler.

---

### 12.8 Review API

#### POST /reviews

```json
{
  "job_id": "uuid",
  "contractor_id": "uuid",
  "rating": 5,
  "comment": "Great work"
}
```

#### GET /contractors/{id}/reviews

---

### 12.9 Notification API

- `GET /notifications`
- `PATCH /notifications/{id}/read`

**WebSocket Event:**

```json
{
  "type": "NOTIFICATION",
  "payload": {
    "title": "New Quote",
    "body": "You received a new quote"
  }
}
```

---

### 12.10 AI API

#### POST /ai/job/parse

Convert raw text to structured job post.

```json
{ "input": "My sink is leaking badly" }
```

#### POST /ai/quote/suggest

AI-suggested pricing for a job.

#### GET /ai/match-contractors?job_id=uuid

---

### 12.11 Geo & Matching API

#### GET /contractors/nearby

Query params: `?lat=-17.82&lng=31.03&radius=5`

#### POST /internal/match-job

Internal matching trigger (service-to-service).

---

### 12.12 Admin API

- `GET /admin/users`
- `GET /admin/jobs`
- `POST /admin/contractors/{id}/suspend`
- `GET /admin/metrics`

---

### 12.13 Job State Machine

```
DRAFT → OPEN → QUOTING → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED → CANCELLED
```

---

### 12.14 Error Handling Standard

```json
{
  "error": {
    "code": "QUOTE_ALREADY_ACCEPTED",
    "message": "This job already has an accepted quote"
  }
}
```

---

### 12.15 Pagination Standard

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 200
  }
}
```

---

### 12.16 Security

- JWT auth with role guards (`USER`, `CONTRACTOR`, `ADMIN`)
- Input validation (Zod/Joi)
- File upload scanning
- Rate limiting: 100 requests/min per user; WebSocket throttling

---

### 12.17 Production Enhancements

**Must-have:**
- Idempotency keys (payments, quotes)
- Audit logs
- Soft deletes
- Caching (Redis)

**Nice-to-have:**
- GraphQL gateway
- gRPC internal services
- Event sourcing

---

## 13. Contractor Matching Algorithm

### 13.1 Matching Strategy

Two supported modes:

| Mode | Description |
|------|-------------|
| **Instant Match** (Uber-style) | System auto-assigns best available contractor |
| **Marketplace Match** | Notify top N contractors; they submit quotes |

### 13.2 Ranking Formula

```
score =
  (rating_weight      × normalized_rating)    +
  (distance_weight    × inverse_distance)     +
  (price_weight       × price_score)          +
  (availability_weight × availability_score)  +
  (response_weight    × response_speed)
```

**Default weights:**

```js
const WEIGHTS = {
  rating:       0.30,
  distance:     0.25,
  price:        0.15,
  availability: 0.20,
  response:     0.10,
};
```

### 13.3 Geo Indexing

**Option A — PostgreSQL (PostGIS):**

```sql
SELECT id, ST_Distance(location, ST_MakePoint($lng, $lat)) AS distance
FROM contractors
WHERE ST_DWithin(location, ST_MakePoint($lng, $lat), $radius);
```

**Option B — Redis GEO (faster):**

```
GEOADD contractors:locations lng lat contractor_id
GEORADIUS contractors:locations lng lat 5 km WITHDIST
```

### 13.4 Real-Time Availability (Redis)

```
contractor:{id}:status       = "available" | "busy" | "offline"
contractor:{id}:last_active  = timestamp
```

### 13.5 Full Matching Pipeline

**Step 1 — Fetch nearby contractors:**

```js
const nearby = await redis.georadius(
  'contractors:locations',
  lng, lat, radiusKm, 'km', 'WITHDIST'
);
```

**Step 2 — Filter eligible contractors:**

```js
const eligible = nearby.filter(c =>
  c.status === 'available' &&
  c.categories.includes(job.category)
);
```

**Step 3 — Enrich from DB:**

```js
const contractors = await db.contractors.findMany({
  where: { id: { in: eligibleIds } },
  include: { stats: true }, // rating, jobs_completed, avg_response_time
});
```

**Step 4 — Score each contractor:**

```js
function scoreContractor(contractor, job) {
  const ratingScore       = contractor.rating / 5;
  const distanceScore     = 1 / (1 + contractor.distance_km);
  const priceScore        = job.budget
    ? Math.max(0, 1 - contractor.avg_price / job.budget)
    : 0.5;
  const availabilityScore = contractor.status === 'available' ? 1 : 0;
  const responseScore     = 1 / (1 + contractor.avg_response_time_minutes);

  return (
    ratingScore       * WEIGHTS.rating       +
    distanceScore     * WEIGHTS.distance     +
    priceScore        * WEIGHTS.price        +
    availabilityScore * WEIGHTS.availability +
    responseScore     * WEIGHTS.response
  );
}
```

**Step 5 — Rank:**

```js
const ranked = contractors
  .map(c => ({ ...c, score: scoreContractor(c, job) }))
  .sort((a, b) => b.score - a.score);
```

**Step 6A — Sequential dispatch (Uber-style):**

```js
for (const contractor of ranked) {
  const accepted = await sendJobRequest(contractor.id, job);
  if (accepted) return contractor;
  await delay(5000);
}
```

**Step 6B — Batch dispatch (Marketplace):**

```js
const topN = ranked.slice(0, 10);
await Promise.all(topN.map(c => notifyContractor(c.id, job.id)));
```

### 13.6 Race Condition Safety (Redis Lock)

```js
const lockKey  = `job:${jobId}:lock`;
const acquired = await redis.set(lockKey, contractorId, 'NX', 'EX', 30);

if (!acquired) {
  return { error: 'Already assigned' };
}
```

### 13.7 Timeout & Fallback

```js
if (noAcceptanceAfter(60_000 /* ms */)) {
  expandRadius();
  retryMatching();
}
```

### 13.8 AI Enhancements

**Predict acceptance probability:**

```js
const acceptanceScore = model.predict({
  contractor_id,
  job_type,
  time_of_day,
  distance,
});

const finalScore = score * 0.7 + acceptanceScore * 0.3;
```

**Load balancing — penalise overloaded contractors:**

```js
if (contractor.active_jobs > 5) {
  score *= 0.7;
}
```

**Cold-start boost for new contractors:**

```js
if (contractor.jobs_completed < 5) {
  score += 0.1;
}
```

### 13.9 WebSocket Dispatch Flow

**Outbound — job request to contractor:**

```json
{
  "type": "JOB_REQUEST",
  "payload": {
    "job_id": "uuid",
    "title": "Fix pipe",
    "distance": 2.1
  }
}
```

**Inbound — contractor response:**

```json
{
  "type": "JOB_ACCEPT",
  "payload": { "job_id": "uuid" }
}
```

### 13.10 Scaling Architecture

**Services:** Matching Service (stateless) · Redis · PostgreSQL · Kafka

**Event flow:**

```
JOB_CREATED → MATCHING_REQUEST → CONTRACTOR_NOTIFIED → ACCEPTED → JOB_ASSIGNED
```

### 13.11 Edge Cases

- Multiple contractors accept simultaneously → Redis lock prevents double-assignment
- Contractor goes offline mid-process → timeout + fallback to next ranked
- Fake availability → last_active check + heartbeat
- GPS spoofing → server-side distance validation
- No contractors in radius → auto-expand radius + retry

---

## 14. UI Screen Blueprint (200+)

### Design System Tokens

| Token | Values |
|-------|--------|
| **Colors** | Primary (Blue), Secondary (Teal), Success (Green), Error (Red) |
| **Typography** | H1 32px · H2 24px · Body 16px · Caption 12px |
| **Spacing** | 4 / 8 / 12 / 16 / 24 / 32 |
| **Radius** | 8px / 16px / 24px |
| **Shadows** | Soft elevation (cards, modals) |

---

### 14.1 Authentication (12 Screens)

1. Splash screen
2. Onboarding slide 1
3. Onboarding slide 2
4. Onboarding slide 3
5. Login
6. Register (User)
7. Register (Contractor)
8. Email verification
9. OTP verification
10. Forgot password
11. Reset password
12. Role selection
13. Terms & conditions
14. Welcome success

---

### 14.2 User (Client) App — 60+ Screens

#### Home & Discovery (10)

1. Home dashboard
2. Search contractors
3. Search results (list view)
4. Search results (map view)
5. Filters modal
6. Category browsing
7. Featured contractors
8. Recently hired
9. Saved contractors
10. Empty states

#### Contractor Profile (8)

1. Profile overview
2. Portfolio gallery
3. Reviews list
4. Certifications
5. Pricing details
6. Availability calendar
7. Contact CTA panel
8. Report contractor

#### Job Creation (12)

1. Step 1: Category selection
2. Step 2: Description
3. Step 3: Upload media
4. Step 4: Budget
5. Step 5: Location (map picker)
6. Step 6: Schedule
7. Review job summary
8. Submit success
9. Drafts list
10. Edit draft
11. AI-assisted job creation
12. Voice input job creation

#### Quotes & Hiring (10)

1. Quotes list
2. Quote comparison view
3. Quote detail
4. Accept quote confirmation
5. Reject quote
6. Negotiate quote (chat inline)
7. Counter-offer screen
8. Hire contractor screen
9. Contract preview
10. Contract signed success

#### Messaging (8)

1. Conversations list
2. Chat screen
3. Attach media
4. Voice message UI
5. System messages (quote updates)
6. Typing indicator
7. Message failed / retry
8. Block / report user

#### Job Execution (10)

1. Active jobs list
2. Job detail (in-progress)
3. Timeline view
4. Milestones list
5. Upload progress (contractor updates visible)
6. Approve milestone
7. Request revision
8. Cancel job
9. Dispute screen
10. Job completion confirmation

#### Payments (6)

1. Payment method selection
2. Escrow funding
3. Payment success
4. Payment history
5. Invoice view
6. Refund request

#### Reviews (4)

1. Leave review
2. Rating breakdown
3. Review submitted
4. Edit review

#### Notifications (4)

1. Notification list
2. Notification detail
3. Notification settings
4. Push preferences

---

### 14.3 Contractor App — 70+ Screens

#### Dashboard (8)

1. Contractor home dashboard
2. Earnings summary
3. Performance metrics
4. Job stats
5. Notifications widget
6. Quick actions
7. Availability toggle
8. Offline state

#### Job Feed (10)

1. Available jobs list
2. Job detail preview
3. Accept / reject job
4. Filter jobs
5. Map job view
6. Urgent jobs highlight
7. Saved jobs
8. Recommended jobs (AI)
9. No jobs empty state
10. Job alerts settings

#### Quotation System (12)

1. Create quote
2. Price breakdown editor
3. Timeline input
4. Attach files
5. Preview quote
6. Submit success
7. Edit quote
8. Withdraw quote
9. Quote history
10. Quote analytics
11. AI price suggestion
12. Duplicate quote

#### Active Jobs (10)

1. Active jobs list
2. Job detail
3. Update progress
4. Upload images/videos
5. Mark milestone complete
6. Request payment
7. Chat with client
8. Delay notification
9. Cancel job request
10. Complete job

#### Earnings (6)

1. Earnings dashboard
2. Transaction history
3. Withdraw funds
4. Bank details
5. Payout status
6. Tax summary

#### Profile Management (12)

1. Edit profile
2. Add services
3. Portfolio upload
4. Certifications upload
5. Pricing setup
6. Availability schedule
7. Service area map
8. Verification status
9. Reviews received
10. Respond to reviews
11. Profile preview
12. Deactivate account

#### Messaging (6)

1. Chat list
2. Chat screen
3. Attachments
4. Voice messages
5. Notifications
6. Block / report

#### Settings (6)

1. Account settings
2. Notification settings
3. Security settings
4. Password change
5. Language selection
6. Logout

---

### 14.4 Admin Panel — 50+ Screens

#### Dashboard (8)

1. Admin dashboard
2. Platform metrics
3. Revenue analytics
4. Active users
5. Job metrics
6. Contractor stats
7. Alerts panel
8. System health

#### User Management (10)

1. Users list
2. User detail
3. Suspend user
4. Verify user
5. User activity log
6. Search users
7. Filter users
8. Export data
9. User complaints
10. Ban history

#### Contractor Management (10)

1. Contractors list
2. Contractor detail
3. Verification review
4. Approve / reject contractor
5. Performance tracking
6. Fraud detection panel
7. Contractor suspension
8. Document verification
9. Ratings audit
10. Contractor reports

#### Job Management (8)

1. Jobs list
2. Job detail
3. Force assign contractor
4. Cancel job
5. Dispute resolution
6. Job analytics
7. Flagged jobs
8. Manual intervention

#### Payments (6)

1. Payments overview
2. Transactions list
3. Escrow management
4. Refund processing
5. Commission settings
6. Financial reports

#### AI & Matching Control (4)

1. Matching algorithm dashboard
2. Pricing insights
3. Recommendation tuning
4. Model monitoring

#### Notifications (4)

1. Broadcast notifications
2. Templates
3. Email campaigns
4. Push campaigns

#### System Settings (6)

1. Roles & permissions
2. API keys
3. Feature flags
4. Logs viewer
5. Backup settings
6. Integrations

---

### 14.5 Sample Figma Prompt

Use this directly in Figma AI tools:

```
Design a modern mobile app screen for a contractor marketplace.

Screen: Contractor Profile

Include:
- Header with profile image, name, rating, verified badge
- Service categories (chips)
- Portfolio gallery (horizontal scroll)
- Reviews preview (cards)
- Pricing summary
- Availability indicator
- CTA buttons: "Request Quote", "Chat"

Style:
- Clean, minimal
- Card-based layout
- Soft shadows
- Rounded corners (16px)
- Blue primary color

Add bottom sticky CTA bar.
```

---

### UX Principles

| Principle | Implementation |
|-----------|---------------|
| **Speed** | 1–2 taps to request a contractor |
| **Trust** | Ratings, reviews, verification badges everywhere |
| **Transparency** | Clear pricing and timelines at every step |
| **Real-Time Feel** | Live updates for chat and job status |
