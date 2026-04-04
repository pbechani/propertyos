# Sprint 10-b — B2B + B2C Construction Marketplace
**Design Reference & Architecture Guide**

> **Note:** This document covers the extended marketplace platform design including materials e-commerce, RFQ procurement, Uber-style logistics, real-time dispatch architecture, and the driver mobile app. Use alongside `sprint-10-logistics.md` for the backend implementation spec.

---

## Part 1: Core Marketplace Platform

### 1. Platform Vision

Three tightly coupled marketplaces:

| Marketplace | Layer | Description |
|---|---|---|
| **Materials Marketplace** | E-commerce | Browse & buy building materials, multi-supplier catalog, cart + checkout + price comparison |
| **RFQ Marketplace** | Procurement | Request bulk/custom quotes, suppliers bid, negotiation + award flow |
| **Contractor Network** | Service | Verified contractors, ratings + job history, linked to material usage |

The key insight: linking material usage to contractor job history creates a data loop that is extremely defensible.

---

### 2. System Architecture Overview

```
[ Buyer App / Web ]
        ↓
[ Marketplace API Layer ]
        ↓
------------------------------------------------
| Product Service | RFQ Service | Order Service |
| Supplier Portal | Pricing AI  | Rating System |
------------------------------------------------
        ↓
[ Event Bus / Queue ]
        ↓
[ Notifications | Inventory Sync | Analytics ]
```

---

### 3. Materials Marketplace (Buying System)

#### 3.1 Product Model

Two-tier catalog design:

**Global Product** (catalog master)
- `id`, `name`, `category` (cement, steel, bricks)
- `specifications` (JSON), `unit` (kg, ton, piece)
- `images[]`, `global_sku`

**SupplierProduct** (per-supplier listing)
- `id`, `supplier_id`, `product_id`
- `price`, `stock_quantity`, `location`
- `delivery_time`, `min_order_qty`

This allows the same product from multiple suppliers with real-time price comparison.

#### 3.2 Buyer Experience Flow

**Browse**
- Categories: Cement, Steel, Electrical, etc.
- Filters: Price, Distance, Supplier Rating, Availability

**Compare Prices (Product Page)**
```
Supplier A → $10.00  (In Stock)
Supplier B → $9.50   (Low Stock)
Supplier C → $10.20  (Fast Delivery)
[Compare Suppliers]
```

**Multi-Supplier Cart**
```
Cart — grouped by supplier:

  Supplier A:
    - Cement × 50 bags

  Supplier B:
    - Steel rods × 20 lengths
```
Checkout automatically splits into multiple orders per supplier.

#### 3.3 Order Flow

```
User Checkout
   ↓
Create Orders (per supplier)
   ↓
Notify Supplier
   ↓
Reserve Inventory
   ↓
Payment (Escrow optional)
   ↓
Supplier Fulfillment
   ↓
Delivery Tracking
```

#### 3.4 Inventory Sync

When a user buys, an `ORDER_CONFIRMED` event fires:

- Reduce `SupplierProduct.stock_quantity`
- Notify supplier dashboard
- Update marketplace availability

---

### 4. Supplier Portal

#### 4.1 Supplier Capabilities

**Product Management**
- Add/edit products
- Bulk upload (CSV/API)
- Pricing rules (tiered pricing)

**Inventory Management**
- Stock levels
- Low stock alerts

**Orders Dashboard**
- New orders
- Accept/reject
- Fulfillment status

**Analytics**
- Sales trends
- Price competitiveness
- Demand signals

#### 4.2 Supplier Product Upload Flow

```
Supplier logs in
   ↓
Add product OR link to existing catalog SKU
   ↓
Set: Price / Stock / Delivery terms
   ↓
Product goes live instantly
```

---

### 5. RFQ System (Procurement Engine)

#### 5.1 RFQ Flow

```
Buyer creates RFQ:
  - Materials list
  - Quantity
  - Delivery location
  - Deadline

System:
  → Sends to relevant suppliers
  → Suppliers submit quotes
  → Buyer compares bids
  → Selects winner
  → Converts to order
```

#### 5.2 RFQ Data Model

**RFQ**
- `id`, `buyer_id`, `items[]`, `status`

**RFQBid**
- `supplier_id`, `price`, `delivery_time`, `notes`

---

### 6. Ratings & Trust System

#### 6.1 Two-Way Ratings

**Buyers rate suppliers on:**
- Product quality
- Delivery reliability
- Pricing fairness

**Suppliers rate buyers on:**
- Payment reliability
- Order clarity
- Communication

#### 6.2 Reputation Score

```
Supplier Score =
  (Delivery Reliability × 40%)
+ (Price Competitiveness × 30%)
+ (Ratings × 30%)
```

Used for:
- Search ranking
- RFQ visibility
- Featured listings

---

### 7. Price Intelligence Engine

This is the platform moat — data that competitors cannot replicate without the same transaction volume.

#### 7.1 Data Captured

- Prices across suppliers
- Order volumes
- RFQ bid data
- Seasonal demand patterns
- Regional trends

#### 7.2 Outputs

**Price Benchmarking**
```
Cement (50kg):
  Average:  $10.20
  Lowest:   $9.50
  Highest:  $11.00
```

**Smart Suggestions**
- "This supplier is 12% cheaper"
- "Prices expected to rise next week"

**Supplier Insights**
- "You are overpriced by 8% in your region"

---

### 8. Notifications System

Triggered via event bus:

**Supplier notifications**
- New order
- RFQ received
- Low stock alert

**Buyer notifications**
- Order confirmed
- Delivery updates
- Better price alerts

---

### 9. Advanced Features (Phase 2)

| Feature | Description |
|---|---|
| **Logistics Integration** | Delivery partners, route optimization, real-time tracking |
| **Credit / Financing** | Buy now pay later for contractors, supplier financing |
| **AI Layer** | Auto-RFQ from BOQ, predict material needs, smart supplier matching |

---

### 10. Key Network Effects

1. **Supply Density** — More suppliers → better prices → more buyers
2. **Demand Data** — More buyers → better pricing intelligence → smarter suppliers
3. **Trust Graph** — Ratings + transaction history → reduced risk
4. **Switching Cost** — Saved suppliers, historical pricing, procurement workflows

---

### 11. MVP Build Plan

**Phase 1 (30–45 days)**
- Product catalog
- Supplier portal (basic)
- Cart + checkout
- Orders + inventory sync

**Phase 2 (30–60 days)**
- RFQ system
- Ratings
- Notifications

**Phase 3**
- Price intelligence
- AI recommendations
- Logistics

---

### 12. UI Structure (High-Level)

**Buyer App**
- Home (categories + deals)
- Product page (compare suppliers)
- Cart
- Orders
- RFQs

**Supplier Portal**
- Dashboard
- Products
- Orders
- RFQs
- Analytics

**Admin**
- Supplier verification
- Dispute resolution
- Pricing insights

---

## Part 2: Uber-Style Delivery Marketplace Module

Adding an on-demand logistics layer turns the marketplace into a full-stack supply chain platform — a 3-sided marketplace.

### 1. High-Level Concept

| Side | Role |
|---|---|
| **Buyers** | Order materials |
| **Suppliers** | Sell materials |
| **Drivers** | Deliver materials |

The moment an order is placed, delivery becomes an optional real-time bidding + dispatch system.

---

### 2. System Architecture (Extended)

```
[ Buyer Checkout ]
        ↓
[ Order Service ]
        ↓
[ Delivery Service ]
        ↓
-----------------------------------------
| Pricing Engine | Driver Matching Engine |
| Dispatch Engine | Tracking Service      |
-----------------------------------------
        ↓
[ Driver Mobile App ]
```

---

### 3. Delivery Flow

#### 3.1 At Checkout

User selects:
- ☑ Pickup option, OR
- ☑ Request delivery

If delivery selected, system calculates:
- Distance
- Weight
- Vehicle type required
- Urgency

#### 3.2 Delivery Request Created

```
DeliveryRequest:
  - id
  - order_id
  - pickup_location (supplier)
  - dropoff_location (buyer)
  - total_weight
  - estimated_price
  - status: broadcasting
```

#### 3.3 Broadcast to Drivers

System finds nearby drivers filtered by:
- Vehicle capacity
- Availability
- Rating

Drivers see:
```
Pickup:  Supplier A
Dropoff: Borrowdale
Weight:  1.2 tons
Price:   $25
[Accept Job]
```

#### 3.4 Driver Accepts

First driver to accept:
- Job locked
- Other drivers notified (expired)
- Buyer + Supplier notified

#### 3.5 Fulfillment Flow

```
Driver → Pickup materials
   ↓
Mark: PICKED_UP
   ↓
In transit (GPS tracking)
   ↓
Delivered
   ↓
Proof of delivery (photo/signature)
```

---

### 4. Delivery Pricing Engine

#### 4.1 Formula

```
Price =
  Base Fee
+ (Distance × Rate per KM)
+ (Weight × Rate per KG)
× Vehicle Multiplier
× Surge Multiplier
```

#### 4.2 Example Calculation

```
Base Fee:             $5.00
Distance: 15km × $0.80 = $12.00
Weight: 1000kg × $0.01 = $10.00
Vehicle (Truck):      × 1.5

Total = (5 + 12 + 10) × 1.5 = $40.50
```

#### 4.3 Vehicle Types

| Type | Load | Multiplier |
|---|---|---|
| Bike | Small items | 1.0× |
| Pickup Truck | Medium loads | 1.2× |
| 3-Ton Truck | Heavy materials | 1.5× |
| Flatbed | Bulk materials | 1.8× |

---

### 5. Driver System

#### 5.1 Driver Profile

```
Driver:
  - id
  - name
  - vehicle_type
  - max_capacity (kg)
  - rating
  - location (live GPS)
  - availability_status
```

#### 5.2 Driver App Core Features

- Online / Offline toggle
- Incoming delivery requests
- Navigation (Google Maps integration)
- Earnings dashboard
- Job history

#### 5.3 Driver Earnings Model

```
Delivery Fee:        $40.00
Platform Commission: 15% = $6.00
Driver Earns:        $34.00
```

---

### 6. Matching Engine (Smart Dispatch)

#### 6.1 Matching Logic

Filter drivers by:
- Within radius (≤ 10 km)
- Capacity ≥ order weight
- Good rating

Sort by:
- Distance to pickup
- Acceptance rate
- Rating

#### 6.2 Broadcast Strategy

**Model A — Uber-style (recommended for MVP)**
- Broadcast to top 10 drivers simultaneously
- First to accept wins

**Model B — Smart Assignment**
- Send to best driver first
- Timeout → next driver

---

### 7. Real-Time Tracking

#### 7.1 Tracking Flow

```
Driver app sends GPS every 5–10 sec
   ↓
Tracking Service updates location
   ↓
Buyer + Supplier see live map
```

#### 7.2 Status Updates

1. Driver assigned
2. Arriving at pickup
3. Picked up
4. In transit
5. Delivered

---

### 8. Supplier Integration

At the "Order Ready" stage, supplier clicks **[Order Ready for Pickup]**, which triggers a driver arrival notification.

---

### 9. Edge Cases

| Scenario | Resolution |
|---|---|
| No driver accepts | Auto-surge price increase, retry broadcast |
| Driver cancels | Re-broadcast, penalise driver rating |
| Overweight order | Split into multiple deliveries |
| Multi-supplier order | Separate deliveries per supplier (consolidation hub: Phase 2) |

---

### 10. Data Model Additions

```
Delivery:
  - id, order_id, driver_id
  - status, price, distance, weight

DriverLocation:
  - driver_id, lat, lng, timestamp
```

---

### 11. Notifications

| Recipient | Trigger |
|---|---|
| Driver | New job available, job cancelled |
| Buyer | Driver assigned, ETA updates |
| Supplier | Driver arriving, pickup confirmation |

---

### 12. Advanced Features (Phase 2+)

| Feature | Description |
|---|---|
| **Route Optimization** | Multiple deliveries per trip, cluster deliveries |
| **Scheduled Deliveries** | Book for a future date/time |
| **Fleet Mode** | Companies manage multiple drivers |
| **AI Pricing** | Predict demand, dynamic surge pricing |

---

### 13. UX Flow Summary

**Buyer:** Add to cart → Checkout → Select delivery → See price → Confirm → Track driver

**Driver:** Go online → Receive request → Accept → Navigate → Deliver → Earn

**Supplier:** Receive order → Prepare items → Mark ready → Hand to driver

---

### 14. Why This Is Powerful

1. **End-to-End Control** — Not just selling materials but delivering them
2. **Higher Revenue Streams** — Commission on materials + commission on delivery
3. **Stronger Network Effects** — More orders → more drivers → faster delivery → more users
4. **Data Advantage** — Delivery times, cost per km, regional logistics intelligence

---

## Part 3: Driver Mobile App — 63 Screens

### App Structure

| Section | Screens |
|---|---|
| Auth | 5 |
| Onboarding | 10 |
| Home | 6 |
| Job Flow | 12 |
| Navigation & Map | 4 |
| Earnings | 6 |
| Job History | 4 |
| Ratings & Feedback | 3 |
| Profile & Settings | 5 |
| Notifications | 3 |
| Support & Safety | 5 |
| **Total** | **63** |

---

### 1. Authentication (5 Screens)

1. **Welcome** — Logo, "Continue as Driver", language selector
2. **Phone Number Input** — Country code picker, input field
3. **OTP Verification** — 6-digit input, auto-read SMS
4. **Create Profile** — Name, profile photo upload
5. **Terms & Conditions** — Accept / Decline

---

### 2. Driver Onboarding (10 Screens)

1. Upload National ID / Passport
2. Upload Driver's License
3. Vehicle Selection — Bike / Pickup / Truck / Flatbed
4. Vehicle Details — Plate number, model, capacity (kg/tons)
5. Vehicle Photos — Front, back, side
6. Insurance Upload
7. Bank / Mobile Money Setup — EcoCash / Bank account
8. Availability Preferences — Working hours, zones
9. Background Check Status — Pending / Approved
10. Onboarding Complete — "Go Online"

---

### 3. Home — Core Driver Screen (6 Screens)

1. **Offline State** — "Go Online" button
2. **Online Idle** — Map view, "Waiting for jobs…"
3. **Incoming Job Request** — Pickup/dropoff, distance, weight, price, countdown timer (10–15 sec), Accept / Decline
4. **Job Accepted** — Job summary, "Navigate to pickup"
5. **No Jobs Available** — Suggest demand hotspots
6. **Surge Alert** — "High demand in your area (1.5× pricing)"

---

### 4. Job Flow (12 Screens)

1. **Job Details** — Supplier name, contact button, material details, weight breakdown
2. **Navigate to Pickup** — Map with route, ETA
3. **Arrived at Pickup** — "I have arrived" button
4. **Supplier Contact** — Call / Chat
5. **Pickup Confirmation** — Checklist (items verified, quantity correct), "Confirm Pickup"
6. **Upload Proof of Pickup** — Photo upload
7. **Navigate to Dropoff** — Map navigation
8. **In Transit** — Live tracking, customer contact
9. **Arrived at Dropoff** — "Arrived" button
10. **Delivery Confirmation** — Signature capture OR OTP
11. **Upload Proof of Delivery** — Photo
12. **Job Complete** — Earnings breakdown, rating prompt

---

### 5. Navigation & Map (4 Screens)

1. Full map navigation (turn-by-turn)
2. Multi-stop — Pickup → multiple dropoffs (Phase 2)
3. Route alternatives — Faster / shorter
4. Traffic alerts — Delays, rerouting

---

### 6. Earnings Module (6 Screens)

1. **Earnings Dashboard** — Today / This week / This month
2. **Earnings Breakdown** — Base fare, distance fee, weight fee, bonus
3. **Trip Detail** — Per-delivery breakdown
4. **Withdraw Earnings** — Choose method, confirm
5. **Incentives** — "Complete 10 trips → earn $20 bonus"
6. **Payment History** — Transactions list

---

### 7. Job History (4 Screens)

1. Completed jobs list
2. Past job detail (full breakdown)
3. Cancelled jobs + reasons
4. Performance stats — Acceptance rate, completion rate

---

### 8. Ratings & Feedback (3 Screens)

1. Customer rating input (1–5 stars, comment)
2. Driver rating view (average + reviews)
3. Feedback to platform (report issue)

---

### 9. Profile & Settings (5 Screens)

1. Profile overview — Photo, rating, vehicle
2. Edit profile
3. Vehicle management — Add / edit
4. Documents — Upload / update
5. Settings — Notifications, language, privacy

---

### 10. Notifications (3 Screens)

1. Notifications list
2. Notification detail
3. Push preferences

---

### 11. Support & Safety (5 Screens)

1. Help center (FAQs)
2. Contact support (chat / call)
3. Emergency / SOS button
4. Report issue (trip-based)
5. Safety tips

---

### Critical UX Patterns

| Pattern | Rationale |
|---|---|
| **One-tap accept** | Speed is everything — large accept button |
| **Countdown timer** | Creates urgency, reduces idle broadcasts |
| **Minimal input during jobs** | No typing — only taps |
| **Offline resilience** | Cache jobs, retry sync on reconnect |
| **Battery optimization** | GPS throttling when stationary |

---

### Mobile Tech Stack

- **Framework:** React Native / Flutter
- **Real-time:** WebSockets (NestJS Gateway)
- **Background GPS:** Native background location service
- **Events:** `NEW_JOB` → `JOB_ACCEPTED` → `LOCATION_UPDATE` → `JOB_COMPLETED`

---

## Part 4: Real-Time Dispatch System (WebSockets + Kafka)

### Architecture Overview

```
[ Buyer / Supplier App ]
        ↓
[ Order Service ]
        ↓
[ Delivery Service ]
        ↓
┌──────────────────────┐
│   Kafka (Event Bus)  │
└──────────────────────┘
        ↓
[ Dispatch ] → [ WebSocket Gateway ] → [ Driver Apps ]
[ Pricing ]
[ Notifications ]
```

**Design principle:**
- **Kafka** = brain (events, reliability, replay)
- **WebSockets** = nerves (real-time delivery to apps)

---

### Event Flow (End-to-End)

```
ORDER_CONFIRMED
   ↓
DELIVERY_REQUEST_CREATED
   ↓
DRIVER_MATCH_REQUESTED
   ↓
DELIVERY_REQUEST_BROADCASTED  (Dispatch → WebSocket → Drivers)
   ↓
DRIVER_ACCEPTED_JOB
   ↓
DELIVERY_ASSIGNED + DELIVERY_LOCKED  (atomic)
   ↓
LOCATION_UPDATE  (every 5–10 sec)
   ↓
DELIVERY_COMPLETED
   ↓
Payout + Rating trigger
```

---

### Kafka Design

#### Topics

| Topic | Purpose |
|---|---|
| `orders.events` | Order lifecycle |
| `delivery.requests` | Delivery creation and assignment |
| `driver.events` | Driver status and actions |
| `dispatch.events` | Dispatch outcomes |
| `tracking.events` | GPS location stream |
| `payments.events` | Escrow and payouts |
| `notifications.events` | All notification triggers |

#### Key Event Schemas

```json
// Delivery Request Created
{
  "event": "DELIVERY_REQUEST_CREATED",
  "delivery_id": "uuid",
  "pickup": { "lat": -17.82, "lng": 31.05, "address": "..." },
  "dropoff": { "lat": -17.80, "lng": 31.03, "address": "..." },
  "weight": 1200
}

// Driver Accepted
{
  "event": "DRIVER_ACCEPTED_JOB",
  "driver_id": "uuid",
  "delivery_id": "uuid"
}

// Location Update
{
  "event": "LOCATION_UPDATE",
  "driver_id": "uuid",
  "lat": -17.82,
  "lng": 31.05,
  "timestamp": 1710000000
}
```

#### Partitioning Strategy

Partition by `delivery_id` — ensures events for one delivery are ordered and prevents race conditions.

---

### WebSocket Gateway Design

#### Connection Endpoints

- **Driver:** `/ws/driver/{driver_id}`
- **Buyer:** `/ws/delivery/{delivery_id}`
- **Supplier:** `/ws/supplier/{supplier_id}`

#### Inbound (Driver → Server)

```json
{ "type": "LOCATION_UPDATE", "lat": -17.82, "lng": 31.05 }
{ "type": "JOB_ACCEPT", "delivery_id": "uuid" }
{ "type": "STATUS_UPDATE", "status": "picked_up" }
```

---

### Dispatch Engine

#### Driver Matching Steps

1. **Geo search** (Redis) — find drivers within radius
2. **Filter** — capacity ≥ weight, status = online
3. **Score** — rank by distance + rating + acceptance rate
4. **Broadcast** — send to top N drivers via WebSocket
5. **Wait** — 10-second acceptance window
6. **Lock** — first accept wins, atomic Redis lock

#### Locking Mechanism (Critical)

```
SET lock:delivery:{delivery_id} {driver_id} NX PX 30000
```

- `NX` — only if key does not exist
- `PX 30000` — expires in 30 seconds
- Success → assign driver; Fail → already taken

---

### Performance Strategy

| Layer | Role |
|---|---|
| **Redis** | Driver locations (geo), active jobs, distributed locks |
| **WebSocket scaling** | Load balancer → multiple WS servers → shared Redis Pub/Sub |
| **Kafka scaling** | Multiple partitions, consumer groups per service |

---

### Failure Handling

| Failure | Response |
|---|---|
| Driver disconnects | Heartbeat miss → mark offline → reassign if in-job |
| No driver accepts | Increase fare (auto-surge), re-broadcast with wider radius |
| Duplicate accept | Atomic Redis SETNX prevents double assignment |
| System crash | Kafka replay ensures no lost events |

---

## Part 5: Redis Schema

### Geo-Spatial (Driver Location)

```
# Store
GEOADD geo:drivers:{city} {lng} {lat} {driver_id}

# Query nearby (within 10km)
GEORADIUS geo:drivers:harare 31.05 -17.82 10 km WITHDIST

# Partition by zone (scale)
geo:drivers:harare:north
geo:drivers:harare:south
```

---

### Driver State

```
driver:{driver_id}:status       →  "online" | "offline" | "busy"
driver:{driver_id}              →  { vehicle_type, capacity, rating, acceptanceRate }

drivers:online                  →  SET of online driver IDs
drivers:available               →  SET of online + not on a job
```

---

### Distributed Locks (Critical — Prevents Double Assignment)

```
# Acquire (atomic, 30s expiry)
SET lock:delivery:{delivery_id} {token} NX PX 30000

# Safe release — Lua script
if redis.call("GET", key) == token then
  return redis.call("DEL", key)
end
```

---

### Active Delivery State

```
delivery:{delivery_id}                  →  { driver_id, status, pickup_lat, pickup_lng }
driver:{driver_id}:current_delivery     →  delivery_id
deliveries:active                       →  SET of active delivery IDs
```

---

### Driver Sessions (Real-Time Presence)

```
# Heartbeat with auto-expiry — refreshed every 10s
SET session:driver:{driver_id} { socket_id, last_seen, status } EX 30
# No heartbeat within 30s → driver auto-marked offline
```

---

### Rate Limiting

```
# Max 10 accept attempts per minute per driver
rate:driver:{id}:accept  →  INCR + EXPIRE 60
```

---

### Full Key Reference

```
# Geo
geo:drivers:{city}

# Driver
driver:{id}
driver:{id}:status
driver:{id}:location
driver:{id}:current_delivery

# Sessions
session:driver:{id}

# Deliveries
delivery:{id}
delivery:{id}:status
deliveries:active

# Locks
lock:delivery:{id}

# Sets
drivers:online
drivers:available

# Queues
queue:delivery:broadcast
queue:driver:{id}

# Rate limiting
rate:driver:{id}:accept
```

---

### Best Practices

1. **Never trust Redis alone** — always confirm in PostgreSQL after assignment
2. **Use TTL everywhere** — `session:*` 30s, `locks` 30s, `location` 60s
3. **Keep values small** — store IDs, not large payloads
4. **Use pipelines** — batch Redis operations to reduce round trips
5. **Monitor memory** — geo + session data can grow fast

---

## Part 6: Driver Matching Algorithm (Production-Ready)

### Matching Goals

- Find eligible drivers in < 100ms
- Prioritise best driver, not just closest
- Avoid spamming all drivers
- Prevent double assignment
- Handle failures + retries

### Scoring Function

```
score =
  (0.5 × normalizedDistance)   -- distance weight
+ (0.2 × rating / 5)           -- quality signal
+ (0.2 × acceptanceRate)       -- reliability signal
- (0.1 × cancellations)        -- penalty

normalizedDistance = 1 - (distance / maxRadius)
```

### Implementation (Node.js)

```typescript
async function matchDrivers(delivery) {
  const { id: deliveryId, pickupLat, pickupLng, weight } = delivery;

  // Step 1: Geo search — nearby drivers within 10km
  const nearbyDrivers = await redis.georadius(
    `geo:drivers:harare`,
    pickupLng, pickupLat, 10, 'km',
    'WITHDIST', 'COUNT', 50
  );

  if (!nearbyDrivers.length) return handleNoDrivers(delivery);

  // Step 2: Fetch driver details in parallel
  const drivers = await Promise.all(
    nearbyDrivers.map(async ([driverId, distance]) => {
      const [meta, status] = await Promise.all([
        redis.get(`driver:${driverId}`),
        redis.get(`driver:${driverId}:status`)
      ]);
      if (!meta || status !== 'online') return null;
      const driver = JSON.parse(meta);
      if (driver.capacity < weight) return null;
      return {
        driverId,
        distance: parseFloat(distance),
        rating: driver.rating,
        acceptanceRate: driver.acceptanceRate ?? 0.9,
        cancellations: driver.cancellations ?? 0,
      };
    })
  );

  const eligible = drivers.filter(Boolean);
  if (!eligible.length) return handleNoDrivers(delivery);

  // Step 3: Score + sort + broadcast top 5
  const scored = eligible
    .map(d => ({ ...d, score: computeScore(d) }))
    .sort((a, b) => b.score - a.score);

  await broadcastToDrivers(scored.slice(0, 5), delivery);
  await waitForAcceptance(deliveryId, scored.slice(0, 5));
}

function computeScore(driver) {
  return (
    0.5 * (1 - driver.distance / 10) +
    0.2 * driver.rating / 5 +
    0.2 * driver.acceptanceRate -
    0.1 * driver.cancellations
  );
}

async function lockDelivery(deliveryId: string, driverId: string) {
  const result = await redis.set(
    `lock:delivery:${deliveryId}`,
    driverId, 'NX', 'PX', 30000
  );
  return result === 'OK';
}

async function retryMatching(deliveryId: string) {
  const delivery = await getDelivery(deliveryId);
  delivery.searchRadius = (delivery.searchRadius ?? 10) + 5;
  return matchDrivers(delivery);
}
```

### Edge Cases

| Case | Handling |
|---|---|
| Multiple simultaneous accepts | Atomic `SET NX` lock — first wins |
| Driver doesn't respond | Timeout → retry with expanded radius |
| Driver disconnects mid-job | Reassign delivery |
| No drivers available | Trigger surge pricing, expand radius |

---

## Part 7: API Specification (REST + WebSocket)

### Design Principles

- **REST** = state changes & persistence
- **WebSockets** = real-time push events
- **Kafka** = internal async event backbone

---

### Authentication

```http
POST /auth/login
{
  "phone": "+2637XXXXXXX",
  "otp": "123456"
}

Response: { "access_token": "jwt", "role": "driver|buyer|supplier" }

All requests: Authorization: Bearer <token>
```

---

### Buyer APIs

```http
GET  /products?category=cement&lat=-17.82&lng=31.05
POST /cart                       -- add item
POST /orders                     -- checkout (delivery_required: bool)
GET  /orders                     -- list own orders
GET  /orders/:id
```

**Checkout Response:**
```json
{
  "order_id": "uuid",
  "delivery_id": "uuid",
  "estimated_delivery_price": 40.50
}
```

---

### Delivery APIs

```http
POST  /deliveries                -- create (internal, triggered by order)
GET   /deliveries/:id            -- status + driver info + ETA
POST  /deliveries/:id/cancel
```

---

### Driver APIs

```http
POST /drivers/status                       -- { "status": "online" }
POST /drivers/location                     -- { "lat", "lng" }
POST /drivers/jobs/:delivery_id/accept
POST /drivers/jobs/:delivery_id/reject
POST /drivers/jobs/:delivery_id/status     -- { "status": "picked_up|in_transit|delivered" }
```

---

### Supplier APIs

```http
POST /suppliers/orders/:order_id/ready
GET  /suppliers/orders
```

---

### Ratings API

```http
POST /ratings
{ "delivery_id": "uuid", "rating": 5, "comment": "Great service" }
```

---

### WebSocket Contracts

**Connections:**
- Driver: `/ws/driver?token=JWT`
- Buyer: `/ws/buyer?token=JWT`

**Server → Driver events:**
```json
{ "type": "NEW_JOB",      "data": { "delivery_id", "pickup", "dropoff", "distance", "weight", "price", "expires_in": 10 } }
{ "type": "JOB_EXPIRED",  "delivery_id": "uuid" }
{ "type": "JOB_CONFIRMED","delivery_id": "uuid" }
```

**Server → Buyer events:**
```json
{ "type": "DRIVER_ASSIGNED",  "data": { "driver": { "id", "name", "rating" } } }
{ "type": "LOCATION_UPDATE",  "data": { "lat": -17.82, "lng": 31.05 } }
{ "type": "DELIVERY_STATUS",  "status": "picked_up" }
```

**Server → Supplier events:**
```json
{ "type": "DRIVER_ARRIVING", "eta": "5 min" }
```

---

### Event Naming Standard

```
DELIVERY_REQUEST_CREATED
DELIVERY_BROADCASTED
DRIVER_ACCEPTED_JOB
DELIVERY_ASSIGNED
DELIVERY_PICKED_UP
DELIVERY_COMPLETED
LOCATION_UPDATED
```

---

### Security

| Concern | Implementation |
|---|---|
| **Idempotency** | `Idempotency-Key` header on `POST /drivers/jobs/:id/accept` |
| **Rate limiting** | Accept job: max 10/min; Location updates: 1 per 5 sec |
| **RBAC** | Role-scoped endpoint access via JWT claims |

---

### Error Response Format

```json
{
  "error": "DELIVERY_ALREADY_ASSIGNED",
  "message": "This job has already been taken"
}
```

---

## Part 8: Database Schema (PostgreSQL)

### Design Principles

- Normalise core entities
- Denormalise for read-heavy analytics paths
- UUIDs for all IDs (distributed-safe)
- Separate transactional data from analytics-ready fields

---

### Users & Roles

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY,
  phone      VARCHAR(20) UNIQUE NOT NULL,
  name       TEXT,
  email      TEXT,
  role       TEXT CHECK (role IN ('buyer', 'supplier', 'driver', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profiles (
  user_id       UUID PRIMARY KEY REFERENCES users(id),
  avatar_url    TEXT,
  rating        DECIMAL(2,1) DEFAULT 5.0,
  total_ratings INT DEFAULT 0
);
```

---

### Suppliers

```sql
CREATE TABLE suppliers (
  id            UUID PRIMARY KEY,
  user_id       UUID REFERENCES users(id),
  business_name TEXT,
  verified      BOOLEAN DEFAULT FALSE,
  address       TEXT,
  lat           DECIMAL,
  lng           DECIMAL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE supplier_products (
  id                 UUID PRIMARY KEY,
  supplier_id        UUID REFERENCES suppliers(id),
  product_id         UUID REFERENCES products(id),
  price              DECIMAL,
  stock_quantity     INT,
  min_order_qty      INT,
  delivery_time_days INT,
  created_at         TIMESTAMP DEFAULT NOW()
);
```

---

### Products (Global Catalog)

```sql
CREATE TABLE products (
  id             UUID PRIMARY KEY,
  name           TEXT,
  category       TEXT,       -- cement, steel, bricks, electrical, etc.
  unit           TEXT,       -- kg, ton, piece
  specifications JSONB,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

---

### Cart & Orders

```sql
CREATE TABLE carts (
  id         UUID PRIMARY KEY,
  user_id    UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart_items (
  id                  UUID PRIMARY KEY,
  cart_id             UUID REFERENCES carts(id),
  supplier_product_id UUID REFERENCES supplier_products(id),
  quantity            INT
);

CREATE TABLE orders (
  id           UUID PRIMARY KEY,
  user_id      UUID REFERENCES users(id),
  total_amount DECIMAL,
  status       TEXT CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id                  UUID PRIMARY KEY,
  order_id            UUID REFERENCES orders(id),
  supplier_product_id UUID REFERENCES supplier_products(id),
  quantity            INT,
  price               DECIMAL
);

-- Split per supplier for independent fulfillment
CREATE TABLE supplier_orders (
  id          UUID PRIMARY KEY,
  order_id    UUID REFERENCES orders(id),
  supplier_id UUID REFERENCES suppliers(id),
  status      TEXT CHECK (status IN ('pending', 'accepted', 'ready', 'fulfilled'))
);
```

---

### Delivery System

```sql
CREATE TABLE deliveries (
  id           UUID PRIMARY KEY,
  order_id     UUID REFERENCES orders(id),
  driver_id    UUID REFERENCES users(id),
  pickup_lat   DECIMAL,
  pickup_lng   DECIMAL,
  dropoff_lat  DECIMAL,
  dropoff_lng  DECIMAL,
  total_weight DECIMAL,
  distance_km  DECIMAL,
  price        DECIMAL,
  status       TEXT CHECK (status IN (
    'pending', 'broadcasting', 'assigned',
    'picked_up', 'in_transit', 'delivered', 'cancelled'
  )),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Full event history (append-only)
CREATE TABLE delivery_events (
  id          UUID PRIMARY KEY,
  delivery_id UUID REFERENCES deliveries(id),
  event_type  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

### Drivers

```sql
CREATE TABLE drivers (
  id             UUID PRIMARY KEY,
  user_id        UUID REFERENCES users(id),
  vehicle_type   TEXT,
  capacity_kg    DECIMAL,
  license_number TEXT,
  verified       BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE driver_vehicles (
  id           UUID PRIMARY KEY,
  driver_id    UUID REFERENCES drivers(id),
  plate_number TEXT,
  model        TEXT,
  type         TEXT,
  capacity_kg  DECIMAL
);

-- Historical GPS trail (partition by month for performance)
CREATE TABLE driver_locations (
  id          UUID PRIMARY KEY,
  driver_id   UUID REFERENCES drivers(id),
  lat         DECIMAL,
  lng         DECIMAL,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

---

### Ratings

```sql
CREATE TABLE ratings (
  id           UUID PRIMARY KEY,
  delivery_id  UUID REFERENCES deliveries(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id   UUID REFERENCES users(id),
  rating       INT CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

---

### RFQ System

```sql
CREATE TABLE rfqs (
  id         UUID PRIMARY KEY,
  buyer_id   UUID REFERENCES users(id),
  status     TEXT CHECK (status IN ('open', 'closed', 'awarded')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rfq_items (
  id         UUID PRIMARY KEY,
  rfq_id     UUID REFERENCES rfqs(id),
  product_id UUID REFERENCES products(id),
  quantity   INT
);

CREATE TABLE rfq_bids (
  id                 UUID PRIMARY KEY,
  rfq_id             UUID REFERENCES rfqs(id),
  supplier_id        UUID REFERENCES suppliers(id),
  total_price        DECIMAL,
  delivery_time_days INT,
  status             TEXT CHECK (status IN ('submitted', 'accepted', 'rejected'))
);
```

---

### Payments & Driver Earnings

```sql
CREATE TABLE payments (
  id         UUID PRIMARY KEY,
  order_id   UUID REFERENCES orders(id),
  amount     DECIMAL,
  status     TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  method     TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE driver_earnings (
  id          UUID PRIMARY KEY,
  driver_id   UUID REFERENCES drivers(id),
  delivery_id UUID REFERENCES deliveries(id),
  amount      DECIMAL,
  commission  DECIMAL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

### Price Intelligence

```sql
CREATE TABLE price_history (
  id          UUID PRIMARY KEY,
  product_id  UUID REFERENCES products(id),
  supplier_id UUID REFERENCES suppliers(id),
  price       DECIMAL,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

---

### Indexing Strategy

```sql
CREATE INDEX idx_products_category         ON products(category);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_deliveries_status         ON deliveries(status);
CREATE INDEX idx_driver_locations_driver   ON driver_locations(driver_id);
CREATE INDEX idx_price_history_product     ON price_history(product_id);
```

---

### Scaling Strategy

1. **Partition large tables** by date — `driver_locations`, `delivery_events`
2. **Read replicas** for analytics and price intelligence queries
3. **CQRS pattern (Phase 2)** — writes to PostgreSQL, reads from optimised materialised views

---

## Part 9: UI System & Screen Catalogue (200+ Screens)

### Design System Tokens

```
Colors:
  Primary:    Deep Blue  #1E3A8A
  Secondary:  Orange     #F97316
  Background: Light Gray #F9FAFB
  Surface:    White      #FFFFFF
  Text:       Dark Gray  #111827
  Success:    Green      #10B981
  Warning:    Amber      #F59E0B
  Error:      Red        #EF4444

Typography:  Bold headings / Medium body / Semi-bold buttons
Components:  12–16px radius, soft card shadows, large tap targets (mobile-first)
Layout:      Grid-based, generous spacing, sticky bottom actions on mobile
```

---

### Buyer App — 70+ Screens

**Home & Discovery (10)**
1. Home dashboard — categories, featured materials, promotions
2. Category listing (cement, steel, electrical)
3. Subcategory grid with filters
4. Search results + filters (price, distance, rating)
5. Product listing — multiple suppliers
6. Product detail — supplier comparison table
7. Supplier profile preview modal
8. Recently viewed
9. Saved / favourites
10. Price trends chart

**Shopping Flow (15)**
11. Add to cart confirmation modal
12. Cart grouped by supplier
13. Cart edit (quantity adjust)
14. Compare suppliers (side-by-side)
15. Checkout step 1 — address
16. Checkout step 2 — delivery option
17. Delivery price breakdown
18. Payment method selection
19. Order review summary
20. Order confirmation success
21. Order failed
22. Apply coupon
23. Bulk discount suggestion modal
24. Save cart for later
25. Reorder previous items

**Orders & Tracking (15):**
26–40 — Order list, order detail, delivery tracking map, status timeline, driver profile, contact driver, cancel flow, return/refund, invoice, download receipt, delivery complete, rate delivery, report issue, reorder, notification centre

**RFQ System (10):**
41–50 — Create RFQ (multi-item), item builder, summary preview, submitted success, bids list, compare bids, supplier bid detail, chat, award confirmation, convert to order

**Profile & Settings (10):**
51–60 — Profile overview, edit profile, saved addresses, payment methods, notification settings, security, language, help centre, support chat, logout confirmation

---

### Supplier Portal — 60+ Screens

**Dashboard (10):** Sales analytics, inventory alerts, price competitiveness, demand heatmap, revenue breakdown, top products, AI recommendations

**Product Management (15):** Product list, add/edit form, image upload, bulk CSV import, tiered pricing UI, inventory management, SKU linking to global catalog

**Orders (10):** Order list/detail, accept/reject, mark ready, invoice generation, disputes

**RFQ Management (10):** RFQ inbox, bid submission form, pricing breakdown, win/loss analytics, convert to order

**Settings (5):** Business profile, verification status, payment setup, team management, notifications

---

### Driver App — 50+ Screens

Screens 111–140 — See [Part 3: Driver Mobile App](#part-3-driver-mobile-app--63-screens) for full breakdown.

---

### Admin Dashboard — 40+ Screens

**Platform Control (10):** User management, supplier/driver verification panels, orders monitoring, live delivery map, dispute resolution, fraud alerts, revenue dashboard

**System Config (10):** Pricing rules, surge control, commission settings, category management, product moderation, feature flags, API monitoring, logs viewer

---

### Component Design Prompts

**Product Card**
> Product image, product name, price range (multiple suppliers), rating, "Compare Prices" CTA. Clean modern card layout.

**Delivery Tracking Screen**
> Map view with driver route, driver info card, ETA display, status timeline (picked up → in transit → delivered), call/message driver buttons.

**Supplier Dashboard**
> Revenue chart, orders count, inventory alert indicators, price competitiveness badge. Card-based layout.

---

### Master Figma Prompt

```
Design a complete multi-sided construction marketplace platform:

1. Buyer app — Amazon-style marketplace for building materials with
   price comparison and multi-supplier cart
2. Supplier portal — inventory management, pricing, RFQ bidding
3. Driver app — Uber-style delivery system with live tracking
4. Admin dashboard — platform control and analytics

Style: Modern, clean, industrial-tech feel
Colors: Deep Blue primary (#1E3A8A), Orange accent (#F97316)
Typography: Bold headings, high readability for field users (contractors, drivers)

Screens to include:
- Mobile-first consumer flows
- Real-time delivery tracking maps
- Data-rich dashboards with charts
- Multi-step checkout
- RFQ bidding and comparison flows
- Driver job acceptance with countdown timer

Generate all screens with a consistent reusable component library and design tokens.
```

---

## Related Documents

- [sprint-10-logistics.md](sprint-10-logistics.md) — Backend implementation spec (NestJS, Prisma, APIs)
- [sprint-07-contractor-supplier.md](sprint-07-contractor-supplier.md) — Contractor & supplier marketplace (completed)
- [sprint-08-boq-system.md](sprint-08-boq-system.md) — BOQ system (feeds supplier pricing data)
