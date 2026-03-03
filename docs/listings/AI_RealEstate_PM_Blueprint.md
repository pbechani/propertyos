# AI-Powered Real Estate Property Management Platform
## Full Architecture Blueprint & Developer Roadmap

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Module Breakdown](#module-breakdown)
5. [Database Schema](#database-schema)
6. [AI/ML Layer Design](#aiml-layer-design)
7. [Build Sequence & Timeline](#build-sequence--timeline)
8. [Project Structure](#project-structure)
9. [Infrastructure & DevOps](#infrastructure--devops)
10. [API Design Principles](#api-design-principles)
11. [Security Considerations](#security-considerations)
12. [Recommended Tools & Services](#recommended-tools--services)

---

## System Overview

A full-stack, AI-powered real estate property management platform with the following capabilities:

- **Tenant & Site Management** — Core CRM for properties, units, tenants, leases
- **Document & Contract AI** — Automated lease abstraction and contract intelligence
- **Analytics & Reporting** — Portfolio dashboards and NL-to-SQL querying
- **Dynamic Pricing Engine** — ML-driven rent optimization
- **Predictive Maintenance** — IoT-integrated failure prediction
- **Cost Estimation & Budgeting** — CapEx planning and variance analysis
- **Scheduling & Timeline Prediction** — Lease renewal forecasting and crew optimization
- **Safety Monitoring** — Computer vision–based real-time site monitoring

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, excellent DX, React ecosystem |
| UI Components | Tailwind CSS + shadcn/ui | Composable, accessible, fast to build |
| Backend API | FastAPI (Python) | Native ML/AI integration, async, fast |
| Background Jobs | Celery + Redis | Reliable async task processing |
| Primary DB | PostgreSQL + pgvector | Relational + vector embeddings |
| Time-Series DB | TimescaleDB | IoT sensor data, hypertables |
| Cache | Redis | Sessions, queues, rate limiting |
| Document Storage | AWS S3 / GCS | Scalable blob storage for leases/docs |
| AI/LLM | Anthropic Claude API | Document AI, chatbots, NL-to-SQL |
| ML Framework | scikit-learn, XGBoost, Prophet | Pricing, maintenance, anomaly detection |
| ML Ops | MLflow | Experiment tracking, model registry |
| IoT Messaging | MQTT (Mosquitto) | Lightweight pub/sub for sensor data |
| Vision AI | YOLOv8 + OpenCV | Real-time safety monitoring |
| Containerization | Docker + Kubernetes | Orchestration and scaling |
| IaC | Terraform | Reproducible infrastructure |
| CI/CD | GitHub Actions | Automated testing and deployment |
| Monorepo | Turborepo | Shared packages, optimized builds |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│     Next.js 14 Web App    │    Mobile (React Native - future)       │
└────────────────┬────────────────────────────────────────────────────┘
                 │ HTTPS / WebSocket
┌────────────────▼────────────────────────────────────────────────────┐
│                          API GATEWAY                                │
│              FastAPI (REST) + WebSocket Server                      │
│         Auth (JWT + OAuth2) │ Rate Limiting │ CORS                  │
└────┬──────────┬──────────┬──────────┬──────────┬────────────────────┘
     │          │          │          │          │
┌────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──────────────┐
│Tenant │ │ Doc   │ │Analytics│ │Pricing│ │  Maintenance      │
│Service│ │ AI    │ │Service  │ │Engine │ │  Service          │
└────┬──┘ └────┬──┘ └────┬──┘ └────┬──┘ └────┬──────────────┘
     │          │          │          │          │
┌────▼──────────▼──────────▼──────────▼──────────▼────────────────────┐
│                        DATA LAYER                                   │
│   PostgreSQL + pgvector  │  TimescaleDB  │  Redis  │  S3/GCS        │
└──────────────────────────────────────────────────────────────────────┘
     │
┌────▼──────────────────────────────────────────────────────────────┐
│                     AI / ML SERVICES                              │
│  Claude API  │  XGBoost  │  Prophet  │  YOLOv8  │  MLflow        │
└──────────────────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────┐
│        IoT / EDGE LAYER         │
│  MQTT Broker │ NVIDIA Jetson    │
│  Sensors │ IP Cameras           │
└─────────────────────────────────┘
```

---

## Module Breakdown

### 1. Tenant & Site Management *(Foundation — Build First)*

The core relational layer. Everything else depends on this data model.

**Features:**
- Property → Unit → Tenant → Lease hierarchy
- Maintenance request ticketing with priority routing
- Tenant self-service portal (view lease, pay rent, submit requests)
- Communication center (email + SMS notifications via SendGrid/Twilio)
- Move-in / move-out workflows
- Occupancy tracking and vacancy calendar

**AI Integration:**
- Tenant chatbot (Claude API + RAG over property documents)
- Automated maintenance request classification (NLP routing)
- Churn risk scoring per tenant (likelihood of non-renewal)

**Key API Endpoints:**
```
GET    /api/properties
POST   /api/properties
GET    /api/properties/{id}/units
POST   /api/maintenance-requests
PATCH  /api/maintenance-requests/{id}/status
GET    /api/tenants/{id}/communications
POST   /api/chat/tenant              ← AI chatbot endpoint
```

---

### 2. Document & Contract AI *(Highest ROI — Build Second)*

Automated lease abstraction, clause extraction, compliance alerting, and semantic search.

**Features:**
- PDF/DOCX upload and secure storage
- AI-powered structured data extraction from leases
- Key date alerting (expiry, rent escalation, renewal windows)
- Semantic search across entire document library
- Clause comparison across multiple leases
- Red-flag detection for non-standard terms

**AI Pipeline:**
```
Upload → S3 Storage → Claude API (PDF extraction) → 
Structured JSON → PostgreSQL → pgvector embeddings → 
Semantic search index
```

**Extraction targets per lease:**
- Tenant name, contact details
- Unit address
- Lease start / end date
- Monthly rent amount
- Escalation clause (% or fixed)
- Security deposit amount
- Renewal option terms
- Pet policy, parking, utilities included
- Termination conditions
- Tenant obligations

**Sample Extraction Code:**
```python
async def extract_lease_data(pdf_bytes: bytes) -> dict:
    import anthropic, base64, json
    
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": base64.b64encode(pdf_bytes).decode()
                    }
                },
                {
                    "type": "text",
                    "text": """Extract the following from this lease and return ONLY valid JSON:
                    {
                      "tenant_name": "",
                      "monthly_rent": 0,
                      "lease_start": "YYYY-MM-DD",
                      "lease_end": "YYYY-MM-DD",
                      "security_deposit": 0,
                      "escalation_clause": "",
                      "renewal_option": "",
                      "red_flags": []
                    }"""
                }
            ]
        }]
    )
    return json.loads(response.content[0].text)
```

---

### 3. Analytics & Reporting

Portfolio-wide performance dashboards with AI-generated narrative summaries.

**Features:**
- KPI dashboards: Occupancy rate, NOI, rent collection rate, vacancy days
- Property-level and portfolio-level drill-down
- Natural language querying ("Show all units with rent below market rate")
- Automated monthly report generation (PDF)
- Variance analysis: budget vs. actual
- Trend analysis and forecasting

**NL-to-SQL Architecture:**
```python
# User types: "show me units vacant for more than 30 days in Building A"
# LangChain SQL Agent translates → SQL → executes → returns structured result

from langchain_community.agent_toolkits import create_sql_agent
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-opus-4-6")
agent = create_sql_agent(llm=llm, db=db, verbose=True)
result = agent.invoke({"input": user_query})
```

**Key Metrics to Track:**
- Gross Rental Income (GRI)
- Net Operating Income (NOI)
- Occupancy Rate (%)
- Average Days to Fill Vacancy
- Maintenance Cost per Unit
- Rent Collection Rate (%)
- Lease Renewal Rate (%)
- Tenant Satisfaction Score

---

### 4. Dynamic Pricing Engine

ML-driven rental price recommendations to maximize revenue while minimizing vacancy.

**Features:**
- Market comparable data ingestion
- Per-unit price recommendation with confidence interval
- Demand forecasting by area and season
- Vacancy risk scoring
- A/B testing framework for pricing strategies
- Override controls with reason tracking

**ML Model Design:**

*Input Features:*
- Unit size (sqm), bedrooms, bathrooms
- Floor level, view quality
- Amenities (parking, gym, pool, etc.)
- Location coordinates, walkability score
- Days since last price change
- Days currently vacant
- Local market vacancy rate
- Comparable unit prices (median, percentile)
- Time of year (seasonality)
- Building age and condition score

*Model:* XGBoost regression (predict optimal rent) + LightGBM (predict days to fill at given price)

*MLflow Workflow:*
```python
import mlflow
import xgboost as xgb

with mlflow.start_run():
    model = xgb.XGBRegressor(n_estimators=300, learning_rate=0.05)
    model.fit(X_train, y_train)
    mlflow.log_metric("rmse", rmse)
    mlflow.xgboost.log_model(model, "pricing_model")
```

*Retraining:* Monthly via Celery scheduled task using latest market data and rental outcomes.

---

### 5. Predictive Maintenance

IoT-integrated asset health monitoring and proactive maintenance scheduling.

**Features:**
- IoT sensor data ingestion (temperature, vibration, pressure, power draw)
- Real-time anomaly detection on sensor streams
- Asset health scoring per unit / building system
- Failure probability forecasting (30/60/90 day windows)
- Automated work order generation
- Vendor assignment and tracking
- Maintenance cost ledger

**IoT Stack:**
```
Sensors → MQTT (Mosquitto) → Redis Queue → 
Celery Worker → TimescaleDB → Anomaly Detector → 
Alert Engine → Work Order Service
```

**Anomaly Detection:**
```python
from prophet import Prophet
import pandas as pd

def detect_anomalies(sensor_df: pd.DataFrame, asset_id: str):
    df = sensor_df.rename(columns={"timestamp": "ds", "value": "y"})
    model = Prophet(interval_width=0.95)
    model.fit(df)
    forecast = model.predict(df)
    
    anomalies = df[
        (df["y"] > forecast["yhat_upper"]) | 
        (df["y"] < forecast["yhat_lower"])
    ]
    return anomalies
```

**Asset Types to Monitor:**
- HVAC systems (temperature, filter pressure, power draw)
- Elevators (vibration, door cycle count, motor temperature)
- Plumbing (water pressure, flow anomalies, leak sensors)
- Electrical (panel load, circuit breaker trips)
- Fire safety (smoke detector battery, suppression system pressure)

---

### 6. Cost Estimation & Budget Tracking

CapEx planning, maintenance cost forecasting, and budget variance analysis.

**Features:**
- Historical cost database by repair type and asset
- ML-based cost estimation for new repair requests
- Annual budget planning interface
- Budget vs. actual variance dashboard
- Capital improvement project tracking
- Contractor invoice processing (AI-extracted)

**Cost Estimation Model:**

Train a regression model on:
- Asset type + age
- Repair category (electrical, plumbing, structural, etc.)
- Unit size
- Historical labor and material costs
- Contractor rates by region

---

### 7. Scheduling & Timeline Prediction

Lease renewal forecasting, maintenance crew optimization, and inspection planning.

**Features:**
- Lease renewal prediction (churn model)
- Maintenance crew scheduling optimizer
- Move-in / move-out calendar
- Inspection scheduling
- Vendor availability management

**Renewal Prediction Features:**
- Months remaining on lease
- Rent increase applied at last renewal (%)
- Maintenance requests (count, avg resolution time)
- Payment history (late payments)
- Communication frequency
- Market rent vs. current rent gap

**Crew Scheduling:** Google OR-Tools constraint satisfaction for optimal technician routing across multiple properties.

---

### 8. Safety Monitoring *(Most Hardware-Dependent)*

Computer vision–based real-time monitoring integrated with IP cameras and access control.

**Features:**
- Live camera feed monitoring dashboard
- Unauthorized access detection
- Package theft / suspicious activity alerting
- Fire and smoke detection (visual)
- Incident log with video clip capture
- Access control integration (keycard / fob events)
- Audit trail for compliance

**Computer Vision Pipeline:**
```
IP Camera (RTSP stream) → 
OpenCV frame capture → 
YOLOv8 inference (edge device) → 
Incident classifier → 
Alert API → 
WebSocket push → 
Frontend dashboard
```

**Edge Deployment:** NVIDIA Jetson Orin Nano (or similar) for on-site inference to minimize latency and bandwidth.

**Detectable Events:**
- Person in restricted area
- Unattended packages
- Smoke / fire signatures
- Vehicle in no-parking zone
- After-hours activity
- Crowd gathering

---

## Database Schema

### Core Tables

```sql
-- Properties
CREATE TABLE properties (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    address     JSONB NOT NULL,
    type        VARCHAR(50),  -- residential, commercial, mixed
    owner_id    UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Units
CREATE TABLE units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    unit_number     VARCHAR(50) NOT NULL,
    floor           INTEGER,
    bedrooms        INTEGER,
    bathrooms       NUMERIC(3,1),
    area_sqm        NUMERIC(8,2),
    amenities       JSONB DEFAULT '[]',
    status          VARCHAR(50) DEFAULT 'vacant',  -- vacant, occupied, maintenance
    current_rent    NUMERIC(10,2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    first_name  VARCHAR(100),
    last_name   VARCHAR(100),
    email       VARCHAR(255) UNIQUE,
    phone       VARCHAR(50),
    id_document JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Leases
CREATE TABLE leases (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id             UUID REFERENCES units(id),
    tenant_id           UUID REFERENCES tenants(id),
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    monthly_rent        NUMERIC(10,2) NOT NULL,
    security_deposit    NUMERIC(10,2),
    escalation_rate     NUMERIC(5,2),
    status              VARCHAR(50) DEFAULT 'active',
    extracted_data      JSONB,    -- AI-extracted lease fields
    document_url        TEXT,     -- S3 URL
    embedding           vector(1536),   -- pgvector for semantic search
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Requests
CREATE TABLE maintenance_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID REFERENCES units(id),
    tenant_id       UUID REFERENCES tenants(id),
    category        VARCHAR(100),     -- plumbing, electrical, HVAC, etc.
    priority        VARCHAR(50),      -- low, medium, high, emergency
    description     TEXT,
    status          VARCHAR(50) DEFAULT 'open',
    assigned_to     UUID REFERENCES users(id),
    estimated_cost  NUMERIC(10,2),
    actual_cost     NUMERIC(10,2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

-- Assets (for predictive maintenance)
CREATE TABLE assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    unit_id         UUID REFERENCES units(id),
    asset_type      VARCHAR(100),
    manufacturer    VARCHAR(100),
    model           VARCHAR(100),
    install_date    DATE,
    warranty_expiry DATE,
    health_score    INTEGER DEFAULT 100,    -- 0-100
    last_serviced   DATE,
    metadata        JSONB
);

-- Sensor Readings (TimescaleDB hypertable)
CREATE TABLE sensor_readings (
    time        TIMESTAMPTZ NOT NULL,
    asset_id    UUID REFERENCES assets(id),
    metric      VARCHAR(100),
    value       NUMERIC(12,4),
    unit        VARCHAR(50)
);
SELECT create_hypertable('sensor_readings', 'time');

-- Pricing History
CREATE TABLE pricing_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id     UUID REFERENCES units(id),
    price       NUMERIC(10,2),
    recommended NUMERIC(10,2),
    source      VARCHAR(50),  -- manual, ml_model, market_comp
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## AI/ML Layer Design

### Service Architecture

```
/ai-services
  /document_extraction    ← Claude API lease parsing
  /pricing_engine         ← XGBoost pricing model
  /maintenance_predictor  ← Prophet + LSTM anomaly detection
  /nlp_query              ← LangChain NL-to-SQL
  /safety_vision          ← YOLOv8 inference server
  /tenant_chatbot         ← RAG chatbot with Claude
  /churn_predictor        ← Tenant renewal likelihood
```

### Model Versioning with MLflow

All ML models are tracked in MLflow with:
- Training dataset version
- Hyperparameters
- Evaluation metrics (RMSE, MAE, F1, etc.)
- Feature importance
- Model artifacts

Production models are promoted via a staging → production registry workflow.

---

## Build Sequence & Timeline

Build in this order to maximize early value delivery and data accumulation for later ML modules.

| Phase | Module | Duration | Dependency |
|---|---|---|---|
| 1 | Tenant & Site Management | Weeks 1–6 | None |
| 2 | Document & Contract AI | Weeks 4–8 | Phase 1 (overlaps) |
| 3 | Analytics & Reporting | Weeks 7–12 | Phases 1–2 |
| 4 | Dynamic Pricing | Weeks 10–16 | Phase 3 (needs data) |
| 5 | Predictive Maintenance | Weeks 14–20 | Phase 1 (needs history) |
| 6 | Cost Estimation | Weeks 18–22 | Phase 5 |
| 7 | Scheduling Optimization | Weeks 20–26 | Phases 4–6 |
| 8 | Safety Monitoring | Weeks 16–24 | Phase 1 (parallel) |

**Key principle:** The AI modules for pricing, maintenance prediction, and churn need 3–6 months of data before meaningful models can be trained. Build the data collection layer (phases 1–3) first, then train models on real data in phases 4–8.

---

## Project Structure

```
realestate-ai/                        ← Turborepo monorepo root
├── apps/
│   ├── web/                          ← Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   ├── (tenant-portal)/
│   │   │   └── (auth)/
│   │   ├── components/
│   │   └── lib/
│   ├── api/                          ← FastAPI backend
│   │   ├── routers/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   ├── ai-services/                  ← Python AI/ML microservices
│   │   ├── document_extraction/
│   │   ├── pricing_engine/
│   │   ├── maintenance_predictor/
│   │   ├── nlp_query/
│   │   └── safety_vision/
│   └── worker/                       ← Celery background jobs
├── packages/
│   ├── database/                     ← Prisma schema + migrations
│   ├── shared-types/                 ← TypeScript types
│   └── ui/                           ← Shared React components
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── turbo.json
└── package.json
```

---

## Infrastructure & DevOps

### Docker Compose (Development)

```yaml
services:
  postgres:
    image: timescale/timescaledb-ha:pg16
    environment:
      POSTGRES_DB: realestate
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mqtt:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "9001:9001"

  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.10.0
    ports:
      - "5000:5000"

  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres/realestate
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on: [postgres, redis]
    ports:
      - "8000:8000"

  web:
    build: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          pnpm install
          pnpm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: docker build -t api ./apps/api
      - name: Push to registry
        run: docker push $REGISTRY/api:$SHA
      - name: Deploy to Kubernetes
        run: kubectl apply -f infrastructure/kubernetes/
```

---

## API Design Principles

- **RESTful** for standard CRUD (properties, tenants, leases)
- **WebSocket** for real-time (safety alerts, chat, maintenance updates)
- **JWT Authentication** with refresh tokens
- **Role-Based Access Control (RBAC):** Super Admin > Property Manager > Maintenance Staff > Tenant
- **API versioning:** `/api/v1/...`
- **OpenAPI/Swagger** auto-generated docs via FastAPI
- **Pagination:** cursor-based for large datasets
- **Rate limiting:** per user + per IP via Redis

---

## Security Considerations

- All documents encrypted at rest in S3 (AES-256)
- Database connections over TLS only
- PII fields (SSN, ID numbers) encrypted in database using pgcrypto
- Camera feeds transmitted over RTSP with TLS / stored locally (not cloud)
- Multi-factor authentication for property managers
- Comprehensive audit logging for all data access
- GDPR/data protection compliance: data deletion workflows
- API key rotation for all external services
- Secrets managed via AWS Secrets Manager or HashiCorp Vault

---

## Recommended Tools & Services

| Category | Tool | Purpose |
|---|---|---|
| LLM API | Anthropic Claude | Document AI, chatbots, NL queries |
| ML Tracking | MLflow | Experiment tracking, model registry |
| Email | SendGrid | Transactional email to tenants |
| SMS | Twilio | Maintenance alerts, rent reminders |
| Payments | Stripe | Online rent collection |
| Storage | AWS S3 | Lease documents, media |
| Vision | YOLOv8 (Ultralytics) | Safety monitoring |
| IoT | Eclipse Mosquitto | MQTT broker |
| Edge AI | NVIDIA Jetson Orin | On-site camera inference |
| Scheduling | Google OR-Tools | Maintenance crew optimization |
| Search | pgvector | Semantic document search |
| Monitoring | Prometheus + Grafana | System observability |
| Error Tracking | Sentry | Application error tracking |
| Feature Flags | Unleash / LaunchDarkly | Gradual feature rollouts |

---

## Quick Start Checklist

- [ ] Scaffold monorepo with Turborepo
- [ ] Set up PostgreSQL + TimescaleDB + pgvector locally
- [ ] Configure Prisma schema for core tables
- [ ] Build tenant/unit/lease CRUD APIs (FastAPI)
- [ ] Integrate Anthropic API — test lease extraction
- [ ] Build Next.js dashboard shell with auth
- [ ] Set up Celery + Redis for background jobs
- [ ] Deploy staging environment with Docker Compose
- [ ] Set up MLflow for experiment tracking
- [ ] Begin collecting data for future ML model training

---

*Generated as part of AI Real Estate PM Platform blueprint — last updated March 2026*
