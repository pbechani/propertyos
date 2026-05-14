# Sprint 12 — AI Design Assistant & Advanced Features (Enhanced)
**Addendum to sprint-12-ai-design-advanced.md**

This file documents the additional specs from the AI Real Estate PM Blueprint that were not covered in the original sprint-12. Read sprint-12-ai-design-advanced.md first; this file only describes additions and extensions.

---

## Additional Deliverables

- [ ] IoT Safety Monitoring module (edge inference → cloud alert pipeline)
- [ ] Predictive maintenance engine (Prophet anomaly detection, TimescaleDB hypertables)
- [ ] ML-based cost estimation for construction BOQ (replaces/extends heuristic pricing)
- [ ] AI tenant chatbot (rental module FAQ + maintenance dispatch)
- [ ] AI contract review (flag non-standard clauses in uploaded contracts)

---

## 1. IoT Safety Monitoring

From AI Blueprint Module 5 (Safety Monitoring System):

### Architecture
```
Construction Site / Building
    └── IP Cameras (RTSP streams) + IoT Sensors
          ↓ (RTSP → NVIDIA Jetson Orin edge device)
          ↓ YOLOv8 inference (PPE detection, trespassing, fire/smoke)
          ↓ Alert if critical event detected (confidence > 0.85)
          ↓ → RabbitMQ: safety.alert_detected
                ↓
          Cloud Alert Processor (NestJS subscriber)
                ↓ Stores alert + screenshot frame
                ↓ Notifies project manager + safety officer
                ↓ Triggers incident report creation
```

### Phase 1 (No hardware): Accept alerts via API (manual or third-party camera systems can post)
### Phase 2: Native Jetson SDK integration + model hosting

### `construction.safety_cameras`
```sql
CREATE TABLE construction.safety_cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.development_projects(id),
  camera_label VARCHAR(100) NOT NULL,
  location_description VARCHAR(255),
  rtsp_url TEXT,                         -- stored encrypted; never returned in API response
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_active BOOLEAN DEFAULT TRUE,
  edge_device_id VARCHAR(100),           -- Jetson unit serial
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `construction.safety_alerts`
```sql
CREATE TABLE construction.safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.development_projects(id),
  camera_id UUID REFERENCES construction.safety_cameras(id),
  
  alert_type VARCHAR(50) NOT NULL,       -- no_ppe, trespassing, fire, smoke, fall
  severity VARCHAR(20) NOT NULL,         -- low, medium, high, critical
  
  confidence_score NUMERIC(4,3),
  frame_url TEXT,                        -- screenshot stored in S3 (presigned URL for viewing)
  
  detected_at TIMESTAMPTZ NOT NULL,
  acknowledged_by UUID REFERENCES identity.users(id),
  acknowledged_at TIMESTAMPTZ,
  
  status VARCHAR(20) DEFAULT 'open',     -- open, acknowledged, resolved, false_positive
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON construction.safety_alerts (project_id, severity, status, detected_at DESC);
```

### Safety Alert API
```
POST /api/v1/construction/:projectId/safety-alerts      [internal; edge device auth via API key]
GET  /api/v1/construction/:projectId/safety-alerts      [project_manager, safety_officer, admin]
PATCH /api/v1/construction/safety-alerts/:id/acknowledge [project_manager, safety_officer]
POST  /api/v1/construction/safety-alerts/:id/resolve    [project_manager]
```

### Detection Classes (YOLOv8 custom model)
| Class | Severity | Trigger |
|-------|---------|---------|
| `no_hard_hat` | medium | PPE violation |
| `no_vest` | medium | PPE violation |
| `no_harness` (at height) | high | Fall risk |
| `trespassing` | high | Perimeter breach |
| `fire` | critical | Immediate alert |
| `smoke` | critical | Immediate alert + IoT sensor cross-check |
| `fall_detected` | critical | Immediate alert + emergency contact |

---

## 2. Predictive Maintenance Engine

From AI Blueprint Module 5 — extends Sprint 16's rental maintenance module with ML.

### TimescaleDB Hypertables (Phase 4+ prerequisite: TimescaleDB extension)
```sql
-- IoT sensor readings — time-series table
-- Enable: CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE TABLE rental.iot_readings (
  property_id UUID NOT NULL,
  sensor_id VARCHAR(100) NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,      -- water_flow, electricity_kwh, hvac_temp, humidity, co2
  value NUMERIC(12,4) NOT NULL,
  unit VARCHAR(20),                      -- litres/min, kWh, celsius, pct, ppm
  recorded_at TIMESTAMPTZ NOT NULL,
  
  PRIMARY KEY (sensor_id, recorded_at)
);
SELECT create_hypertable('rental.iot_readings', 'recorded_at');

-- Continuous aggregate: hourly rollup
CREATE MATERIALIZED VIEW rental.iot_hourly_avg
WITH (timescaledb.continuous) AS
  SELECT sensor_id, sensor_type, property_id,
         time_bucket('1 hour', recorded_at) AS hour,
         AVG(value) AS avg_value,
         MAX(value) AS max_value,
         MIN(value) AS min_value
  FROM rental.iot_readings
  GROUP BY sensor_id, sensor_type, property_id, hour;
```

### `rental.maintenance_predictions`
```sql
CREATE TABLE rental.maintenance_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  
  predicted_issue_type VARCHAR(50),      -- pipe_leak, hvac_failure, electrical_fault, mould_risk
  predicted_within_days SMALLINT,        -- e.g. 14 (predicted within 2 weeks)
  
  confidence_score NUMERIC(4,3),
  evidence JSONB,                        -- what signals drove this prediction
  
  -- Prophet model metadata
  model_name VARCHAR(50),               -- e.g. "prophet_water_pressure_v1"
  anomaly_detected_at TIMESTAMPTZ,
  sigma_deviation NUMERIC(6,3),         -- how many σ above normal
  
  -- Action taken
  maintenance_request_id UUID REFERENCES rental.maintenance_requests(id),
  action_status VARCHAR(20) DEFAULT 'pending',  -- pending, work_order_created, resolved, no_action
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Anomaly Detection Pipeline
```typescript
// Prophet-based anomaly detection (runs as Python microservice)
interface AnomalyDetectionInput {
  sensorId: string;
  sensorType: string;
  historicalReadings: { timestamp: string; value: number }[]; // 90 days
}

interface AnomalyDetectionOutput {
  anomalyDetected: boolean;
  sigmaDeviation: number;
  trend: 'stable' | 'degrading' | 'critical';
  predictedIssueType?: string;
  confidenceScore: number;
}

// Phase 1: Rule-based anomaly detection (no ML dependency)
const ANOMALY_RULES = {
  water_flow: { suddenDropPct: 30, suddenSpikePct: 200 },   // pipe burst or leak
  electricity_kwh: { spikeMultiplier: 3 },                  // appliance fault
  humidity: { sustainedHighPct: 85, durationHours: 48 },    // mould risk
};
```

---

## 3. ML Cost Estimation for BOQ

Extends Sprint 08 BOQ System. Currently Sprint 08 uses a materials catalog with manual pricing. This enhancement adds ML prediction for complete cost estimation.

### `construction.cost_estimates`
```sql
CREATE TABLE construction.cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES construction.development_projects(id),
  boq_id UUID,                              -- references construction BOQ if linked
  
  estimate_method VARCHAR(30),              -- ml_model, comparable_project, manual
  model_version VARCHAR(20),
  
  -- Inputs
  project_type VARCHAR(50),
  gross_floor_area_sqm NUMERIC(10,2),
  specification_tier VARCHAR(20),           -- budget, standard, premium
  location_factor NUMERIC(5,3),            -- regional cost multiplier
  
  -- Output
  estimated_total NUMERIC(18,2),
  cost_per_sqm NUMERIC(10,2),
  confidence_interval JSONB,               -- {p10, p50, p90}
  
  -- Breakdown
  materials_estimate NUMERIC(18,2),
  labour_estimate NUMERIC(18,2),
  preliminaries_estimate NUMERIC(18,2),
  profit_contingency_estimate NUMERIC(18,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Training Data Source
- Completed projects in `construction.*` (actuals vs estimate)
- Sprint 08 BOQ line items aggregated by project type + spec tier
- BCIS (Building Cost Information Service) benchmarks if licensed

---

## 4. AI Tenant Chatbot

From AI Blueprint Module 6: Conversational AI for tenant self-service.

### Capabilities
```
Tenant asks: "How do I submit a maintenance request?"
Bot: "To submit a maintenance request, tap the 'Maintenance' tab in your Tenant Portal..."

Tenant asks: "Is my January rent overdue?"
Bot: [queries rental.rent_payments for this tenant] → "Your January payment of R8,500 is due on 1 Jan. It is currently marked as paid. Would you like a receipt?"

Tenant asks: "I have a leaking tap"
Bot: "I'll create a maintenance request for you. What room is the leak in? [plumbing category, priority: medium]"
→ Creates maintenance_request record automatically
```

### Architecture
```
Tenant message (web/mobile/WhatsApp)
    ↓
AI Gateway (Sprint 11) → LLM (Claude 3 Haiku — fast, low-cost for chat)
    ↓ function_calling enabled
    ├── get_payment_status(leaseId, month)     [read-only financial queries]
    ├── create_maintenance_request(leaseId, ...) [write action — confirmation required]
    ├── get_lease_summary(leaseId)
    └── lookup_faq(question)                   [RAG over lease + policy docs]
    ↓
Response rendered in chat UI
```

### Security: Tenant chatbot ONLY has access to data scoped to their own leaseId. No cross-tenant data access possible.

---

## 5. AI Contract Review

From AI Blueprint: Review uploaded contracts (OTP, lease, service agreements) for non-standard or risky clauses.

### `ai_engine.contract_reviews`
```sql
CREATE TABLE ai_engine.contract_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES identity.users(id),
  contract_type VARCHAR(50),             -- otp, lease, service_agreement, mandate
  document_url TEXT NOT NULL,
  
  -- Analysis
  analysis_status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, complete, failed
  risk_score SMALLINT,                   -- 0–100 overall risk
  risk_level VARCHAR(20),                -- low, medium, high
  
  findings JSONB DEFAULT '[]',           -- [{clause, type, risk_level, explanation, suggestion}]
  
  missing_standard_clauses JSONB DEFAULT '[]',  -- standard clauses that are absent
  
  -- Model
  llm_model VARCHAR(50),
  processing_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Review Pipeline
```
Document uploaded → OCR extraction → chunk into clauses
    ↓
LLM (Claude 3 Sonnet) prompt:
  "You are a South African property law expert. Review this clause and identify:
   1. Risk level (low/medium/high)
   2. Whether it complies with standard SA property law
   3. Non-standard deviations from NCA/CPA/Rental Housing Act
   4. Suggested revision"
    ↓
Structured output parsed → stored in findings JSONB
    ↓
PDF report generated with colour-coded risk highlights
```

---

## API Endpoint Additions

```
# Safety Monitoring
POST /api/v1/construction/:projectId/safety-cameras     [admin, developer]
GET  /api/v1/construction/:projectId/safety-cameras     [project_manager]
POST /api/v1/construction/:projectId/safety-alerts      [edge device — API key auth]
GET  /api/v1/construction/:projectId/safety-alerts      [project_manager, admin]
PATCH /api/v1/construction/safety-alerts/:id            [project_manager]

# Predictive Maintenance
GET  /api/v1/rental/properties/:propId/maintenance-predictions [landlord, agent, admin]

# BOQ ML Estimation
POST /api/v1/construction/cost-estimate                 [developer, quantity_surveyor, admin]

# Tenant Chatbot
POST /api/v1/rental/chat                                [tenant — own lease scope only]

# Contract Review
POST /api/v1/ai/contract-review                         [agent, conveyancer, buyer, landlord, admin]
GET  /api/v1/ai/contract-review/:id                     [uploader, admin]
GET  /api/v1/ai/contract-review/:id/download-report     [uploader, admin]
```

---

## Acceptance Criteria

- [ ] Safety alerts API accepts POST from edge devices authenticated via project-scoped API key
- [ ] Critical alerts (fire, fall_detected) trigger immediate push notification to project manager
- [ ] IoT readings hypertable created and continuous aggregate materialised view working
- [ ] Anomaly detection rule engine (Phase 1) fires for humidity > 85% sustained 48h
- [ ] Predictive maintenance creates work order (maintenance_request) automatically on critical anomaly
- [ ] ML cost estimator returns estimate breakdown (materials / labour / prelim / contingency)
- [ ] Tenant chatbot scoped to own lease — cannot access other tenants' data
- [ ] Contract review finds and flags > 85% of known non-standard clauses in test set
- [ ] RTSP camera URLs stored encrypted; never returned in API responses

---

## Security Notes
- Camera RTSP credentials must be stored with KMS encryption (Vault), never in plain environment variables
- Tenant chatbot function_calls must include leaseId as a mandatory parameter validated server-side — LLM cannot bypass this
- Contract review documents stored in S3 with expiry presigned URLs; deleted after 90 days by lifecycle policy

---

## Dependencies
- sprint-12-ai-design-advanced.md (base sprint)
- Sprint 11 Enhanced (AI Gateway — required for all LLM calls)
- Sprint 06 (construction projects — safety alerts reference projects)
- Sprint 16 (rental — IoT readings and maintenance predictions sit in rental schema)
- Sprint 08 (BOQ system — cost estimator extends it)
