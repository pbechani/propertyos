# Sprint 10 — Logistics & Transport Marketplace
**Phase 10 | Weeks 56–60**

## Goal
Build the truck operator marketplace with real-time GPS tracking, delivery booking (buyer and supplier-initiated), escrow-backed payments, geo-tagged proof of delivery, and operator performance management.

---

## Deliverables Checklist
- [ ] Truck operator profiles (KYC, vehicle registration, insurance)
- [ ] Buyer-initiated delivery booking
- [ ] Supplier-initiated delivery booking (book on buyer's behalf)
- [ ] Operator quote submission + comparison
- [ ] Real-time GPS tracking (TomTom / Google Maps)
- [ ] ETA calculation with traffic awareness
- [ ] Geo-tagged proof of delivery (photo + signature)
- [ ] Escrow-backed delivery payments (release on delivery confirmed)
- [ ] Safety & compliance tracking (license/insurance expiry)
- [ ] Two-way operator ratings

---

## Data Models

### `logistics.operator_profiles`
```sql
CREATE TABLE logistics.operator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES identity.users(id),
  business_name VARCHAR(255),
  registration_number VARCHAR(100),
  service_areas JSONB DEFAULT '[]',  -- [{country, region, city}]
  rating NUMERIC(3,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  on_time_percentage NUMERIC(5,2),
  verification_status VARCHAR(20) DEFAULT 'pending',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `logistics.vehicles`
```sql
CREATE TABLE logistics.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES logistics.operator_profiles(id),
  vehicle_type VARCHAR(30) NOT NULL, -- flatbed, tipper, closed_body, crane_truck, pickup
  make VARCHAR(100),
  model VARCHAR(100),
  year SMALLINT,
  license_plate VARCHAR(30) NOT NULL,
  payload_capacity_kg NUMERIC(10,2),
  volume_capacity_m3 NUMERIC(8,2),
  registration_document_url TEXT,
  registration_expiry DATE,
  inspection_certificate_url TEXT,
  inspection_expiry DATE,
  insurance_certificate_url TEXT,
  insurance_expiry DATE,
  photos JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `logistics.delivery_requests`
```sql
CREATE TABLE logistics.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES construction.projects(id),
  order_id UUID REFERENCES marketplace.orders(id),
  requester_id UUID REFERENCES identity.users(id),      -- buyer or supplier
  request_type VARCHAR(20) NOT NULL, -- buyer_initiated, supplier_initiated
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(9,6),
  pickup_lng NUMERIC(9,6),
  delivery_address TEXT NOT NULL,
  delivery_lat NUMERIC(9,6),
  delivery_lng NUMERIC(9,6),
  vehicle_type_required VARCHAR(30),
  load_description TEXT,
  load_weight_kg NUMERIC(10,2),
  load_volume_m3 NUMERIC(8,2),
  is_fragile BOOLEAN DEFAULT FALSE,
  requested_pickup_date TIMESTAMPTZ,
  deadline_delivery_at TIMESTAMPTZ,
  estimated_distance_km NUMERIC(8,2),
  status VARCHAR(20) DEFAULT 'quoting', -- quoting, assigned, pickup, in_transit, delivered, cancelled, disputed
  selected_quote_id UUID,
  escrow_account_id UUID REFERENCES financial.accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `logistics.delivery_quotes`
```sql
CREATE TABLE logistics.delivery_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES logistics.delivery_requests(id),
  operator_id UUID REFERENCES identity.users(id),
  vehicle_id UUID REFERENCES logistics.vehicles(id),
  quoted_amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  estimated_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'submitted', -- submitted, accepted, rejected, expired
  valid_until TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `logistics.active_deliveries`
```sql
CREATE TABLE logistics.active_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES logistics.delivery_requests(id),
  operator_id UUID REFERENCES identity.users(id),
  vehicle_id UUID REFERENCES logistics.vehicles(id),
  status VARCHAR(20) NOT NULL, -- en_route_pickup, at_pickup, loaded, in_transit, at_delivery, completed
  current_lat NUMERIC(9,6),
  current_lng NUMERIC(9,6),
  current_speed_kmh NUMERIC(6,2),
  bearing_degrees NUMERIC(6,2),
  eta TIMESTAMPTZ,
  distance_remaining_km NUMERIC(8,2),
  location_updated_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `logistics.location_history`
```sql
CREATE TABLE logistics.location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES logistics.active_deliveries(id),
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  speed_kmh NUMERIC(6,2),
  bearing_degrees NUMERIC(6,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
-- Partition by month for performance
CREATE INDEX ON logistics.location_history (delivery_id, recorded_at);
```

### `logistics.delivery_proofs`
```sql
CREATE TABLE logistics.delivery_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES logistics.active_deliveries(id),
  proof_type VARCHAR(20) NOT NULL, -- photo, signature, barcode
  file_url TEXT,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  geo_verified BOOLEAN DEFAULT FALSE,  -- within 100m of delivery address
  recipient_name VARCHAR(255),
  condition_on_delivery VARCHAR(20), -- intact, damaged, partial
  damage_notes TEXT,
  submitted_by UUID REFERENCES identity.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `logistics.operator_ratings`
```sql
CREATE TABLE logistics.operator_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES logistics.active_deliveries(id),
  rated_by UUID REFERENCES identity.users(id),
  rated_entity_id UUID REFERENCES identity.users(id),
  entity_type VARCHAR(20) NOT NULL, -- operator, buyer
  timeliness_score SMALLINT CHECK (timeliness_score BETWEEN 1 AND 5),
  professionalism_score SMALLINT CHECK (professionalism_score BETWEEN 1 AND 5),
  vehicle_condition_score SMALLINT CHECK (vehicle_condition_score BETWEEN 1 AND 5),
  communication_score SMALLINT CHECK (communication_score BETWEEN 1 AND 5),
  overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
    (timeliness_score + professionalism_score + vehicle_condition_score + communication_score)::NUMERIC / 4
  ) STORED,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### Operators
```
POST  /api/v1/logistics/operators/profile
GET   /api/v1/logistics/operators?type=tipper&country=ZW&region=Harare
GET   /api/v1/logistics/operators/:id
POST  /api/v1/logistics/operators/vehicles
PATCH /api/v1/logistics/operators/vehicles/:id
```

### Delivery Requests
```
POST  /api/v1/logistics/requests                   [buyer, supplier]
GET   /api/v1/logistics/requests                   [own requests]
GET   /api/v1/logistics/requests/:id
PATCH /api/v1/logistics/requests/:id/cancel        [requester]
GET   /api/v1/logistics/requests/:id/quotes        [requester]
POST  /api/v1/logistics/requests/:id/quotes/:quoteId/accept
```

### Operator Actions
```
GET  /api/v1/logistics/operator/available-requests  — nearby open requests
POST /api/v1/logistics/requests/:id/quote           [operator]
```

### Live Tracking
```
POST /api/v1/logistics/deliveries/:id/location      [operator] — update GPS position
GET  /api/v1/logistics/deliveries/:id/tracking      [delivery parties] — current location + ETA
GET  /api/v1/logistics/deliveries/:id/route         — planned route + live position
```

### Delivery Completion
```
POST /api/v1/logistics/deliveries/:id/proof         [operator] — upload delivery proof
POST /api/v1/logistics/deliveries/:id/confirm       [buyer] — confirm receipt
```

### Ratings
```
POST /api/v1/logistics/deliveries/:id/rate          [buyer / operator]
GET  /api/v1/logistics/operators/:id/ratings
```

---

## Real-Time Tracking Architecture
- Operator mobile app sends GPS update every **10 seconds** when delivery is active
- Location pushed via **WebSocket** to buyer's browser/app
- Fallback: buyer polls `GET /deliveries/:id/tracking` every 15 seconds
- ETA calculated using TomTom Distance Matrix API (traffic-aware)
- Geo-fence alert if operator deviates > 2km from planned route

---

## Compliance Expiry Monitoring
Daily cron job checks:
- Vehicle registration expiry (alert 30 days before, suspend on expiry)
- Driver license expiry (alert 60 days before, suspend on expiry)
- Insurance expiry (alert 30 days before, suspend on expiry)
- Inspector license expiry (same logic)

Alerts sent via email + SMS to operator and platform admin.

---

## Acceptance Criteria
- [ ] Buyer creates delivery request → operators in area receive notification
- [ ] Operator submits quote, buyer accepts → escrow funded
- [ ] Live GPS tracking visible to buyer in real time
- [ ] ETA updates with traffic (TomTom API)
- [ ] Delivery proof photo geo-verified against delivery address (< 100m)
- [ ] Escrow released automatically on buyer confirmation
- [ ] Dispute filed if buyer claims non-delivery → escrow held pending resolution
- [ ] Operator rating updates their overall profile score
- [ ] Operator suspended automatically if insurance expires

---

## Dependencies
- Sprint 02 (truck_operator role + KYC)
- Sprint 05 (escrow for delivery payments)
- Sprint 07 (supplier orders that need delivery)

## Blocks
- Sprint 11 (logistics delivery data feeds into analytics)
