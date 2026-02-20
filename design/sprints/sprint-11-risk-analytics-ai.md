# Sprint 11 — Risk Analytics & AI Engine
**Phases 11 & 12 | Weeks 61–80**

## Goal
Build the risk scoring engine, predictive analytics, and the full AI infrastructure layer (LLM gateway, document AI, RAG system, legal compliance engine). This is the intelligence backbone of the platform.

---

## Deliverables Checklist

### Phase 11: Risk & Analytics (Weeks 61–68)
- [ ] Contractor risk scoring (0–100)
- [ ] Property risk scoring (0–100)
- [ ] Project health scoring (0–100)
- [ ] Transaction & login anomaly detection
- [ ] Predictive analytics (cost overruns, delays, contractor performance)
- [ ] Platform admin analytics dashboard
- [ ] User analytics dashboards (project owners, contractors, suppliers)
- [ ] Automated weekly/monthly reports
- [ ] Data export (CSV, PDF, API)

### Phase 12: AI Engine (Weeks 69–80)
- [ ] LLM gateway (unified OpenAI / Anthropic / Google API)
- [ ] Vector database setup (embeddings + semantic search)
- [ ] Document AI (OCR, classification, key-value extraction)
- [ ] Computer vision (floor plan recognition, progress verification, quality detection)
- [ ] Legislation corpus ingestion + RAG pipeline
- [ ] AI legal compliance chatbot
- [ ] Voice-to-text (Whisper integration)
- [ ] AI model observability (performance, drift, cost tracking)

---

## Part A: Risk & Analytics

### Data Models

### `analytics.risk_scores`
```sql
CREATE TABLE analytics.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(30) NOT NULL, -- contractor, property, project, supplier
  entity_id UUID NOT NULL,
  score NUMERIC(5,2) NOT NULL,        -- 0-100 (100 = highest risk)
  risk_level VARCHAR(10) NOT NULL,    -- low, medium, high, critical
  score_components JSONB,             -- {completion_rate: 0.9, budget_adherence: 0.85, ...}
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ             -- recalculate after this time
);
CREATE INDEX ON analytics.risk_scores (entity_type, entity_id, computed_at DESC);
```

### `analytics.anomaly_alerts`
```sql
CREATE TABLE analytics.anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,    -- transaction_anomaly, login_anomaly, price_anomaly, activity_anomaly
  severity VARCHAR(10) NOT NULL,      -- low, medium, high, critical
  entity_type VARCHAR(30),
  entity_id UUID,
  description TEXT NOT NULL,
  details JSONB,
  status VARCHAR(20) DEFAULT 'open',  -- open, acknowledged, resolved, false_positive
  acknowledged_by UUID REFERENCES identity.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `analytics.predictions`
```sql
CREATE TABLE analytics.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type VARCHAR(50) NOT NULL, -- cost_overrun, delay, contractor_failure, material_price
  entity_type VARCHAR(30),
  entity_id UUID,
  predicted_value NUMERIC,
  confidence NUMERIC(5,4),              -- 0-1
  prediction_data JSONB,
  model_version VARCHAR(50),
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

---

### Risk Scoring Algorithms

#### Contractor Risk Score
```typescript
interface ContractorRiskInput {
  completionRate: number;          // % projects completed
  budgetAdherenceRate: number;     // % projects within 10% of budget
  onTimeRate: number;              // % projects on time
  disputeRate: number;             // disputes / total_projects
  avgRating: number;               // 1-5
  kycVerified: boolean;
  yearsOnPlatform: number;
}

function contractorRiskScore(input: ContractorRiskInput): number {
  const weights = {
    completionRate: 0.25,
    budgetAdherenceRate: 0.20,
    onTimeRate: 0.20,
    disputeRate: 0.15,
    avgRating: 0.15,
    kycVerified: 0.05
  };
  const riskSignal =
    (1 - input.completionRate) * weights.completionRate +
    (1 - input.budgetAdherenceRate) * weights.budgetAdherenceRate +
    (1 - input.onTimeRate) * weights.onTimeRate +
    input.disputeRate * weights.disputeRate +
    ((5 - input.avgRating) / 4) * weights.avgRating +
    (input.kycVerified ? 0 : 1) * weights.kycVerified;
  return Math.round(riskSignal * 100);
}
```

#### Property Risk Score (0–100, higher = riskier)
| Factor | Weight | Signal |
|--------|--------|--------|
| Title verification status | 30% | unverified=1, pending=0.5, verified=0 |
| Fraud reports count | 25% | ≥3 reports = 1, 1 report = 0.33 |
| Ownership history changes | 15% | >5 transfers in 5 years = elevated |
| Location risk (high fraud area) | 20% | geo-based from historical fraud data |
| Documentation completeness | 10% | % required docs uploaded |

---

### Analytics API Endpoints
```
GET /api/v1/analytics/risk-score/:entityType/:entityId
GET /api/v1/analytics/anomaly-alerts            [admin]
PATCH /api/v1/analytics/anomaly-alerts/:id/acknowledge [admin]
GET /api/v1/analytics/platform/summary          [admin]
GET /api/v1/analytics/my/projects               [project_owner]
GET /api/v1/analytics/my/contractor-performance [contractor]
GET /api/v1/reports/weekly                      [admin — auto-generated]
GET /api/v1/reports/export?type=transactions&from=&to= [admin]
```

---

## Part B: AI Engine Infrastructure

### Data Models

### `ai_engine.llm_requests`
```sql
CREATE TABLE ai_engine.llm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_reference VARCHAR(50) UNIQUE NOT NULL,
  provider VARCHAR(20) NOT NULL,       -- openai, anthropic, google
  model VARCHAR(50) NOT NULL,
  use_case VARCHAR(100),               -- document_verification, legal_query, boq_generation
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  cost_usd NUMERIC(10,6),
  status VARCHAR(20) DEFAULT 'completed',
  error_message TEXT,
  requested_by UUID REFERENCES identity.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `ai_engine.document_extractions`
```sql
CREATE TABLE ai_engine.document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_url TEXT NOT NULL,
  document_type VARCHAR(50),          -- title_deed, contract, id_document, invoice, certificate
  raw_text TEXT,
  extracted_fields JSONB,             -- structured key-value pairs extracted
  confidence NUMERIC(5,4),
  extraction_model VARCHAR(100),
  extraction_status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `ai_engine.legislation_corpus`
```sql
CREATE TABLE ai_engine.legislation_corpus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_title VARCHAR(500) NOT NULL,
  document_type VARCHAR(50),          -- building_code, land_act, property_law, tax_law, zoning
  jurisdiction CHAR(2) NOT NULL,      -- country code
  region VARCHAR(100),
  effective_date DATE,
  source_url TEXT,
  content TEXT NOT NULL,
  chunk_index INTEGER,               -- chunk number within original document
  embedding VECTOR(1536),            -- OpenAI text-embedding-ada-002 dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable pgvector extension
CREATE INDEX ON ai_engine.legislation_corpus USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### `ai_engine.rag_queries`
```sql
CREATE TABLE ai_engine.rag_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  query_text TEXT NOT NULL,
  jurisdiction CHAR(2),
  retrieved_chunk_ids JSONB,          -- [{id, similarity_score}]
  generated_response TEXT,
  confidence VARCHAR(20),             -- high, medium, low
  llm_request_id UUID REFERENCES ai_engine.llm_requests(id),
  feedback_helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### LLM Gateway Architecture
```typescript
interface LLMGatewayRequest {
  prompt: string;
  systemPrompt?: string;
  useCase: string;
  preferredProvider?: 'openai' | 'anthropic' | 'google';
  maxTokens?: number;
  temperature?: number;
  userId?: string;
}

// Provider selection: try preferred → fallback to next → log failure
// Rate limits enforced per use_case
// All requests logged to ai_engine.llm_requests
```

### RAG Pipeline
```
User query → Embed query (text-embedding-ada-002)
           → Vector search in legislation_corpus (top 5 chunks, cosine similarity > 0.75)
           → Build context from retrieved chunks
           → LLM generates answer with citations
           → Response includes: answer, sources [{title, url, section}], confidence
           → Log to rag_queries table
```

### AI API Endpoints
```
POST /api/v1/ai/legal-query           — RAG-powered legal question answering
POST /api/v1/ai/compliance-check      — Check project against building codes
POST /api/v1/ai/document-analyze      — Extract info from uploaded document
POST /api/v1/ai/voice-to-text         — Transcribe audio (Whisper)
GET  /api/v1/ai/usage/me              [admin] — token usage + costs
```

---

## Acceptance Criteria

### Risk & Analytics
- [ ] Contractor risk score computed from live data within 60 seconds of trigger event
- [ ] Anomaly alert fires within 5 minutes of unusual transaction detected
- [ ] Platform admin dashboard loads in < 2 seconds with 6-month data
- [ ] Risk scores recalculate nightly for all active entities
- [ ] Weekly report auto-generated and emailed to admins every Monday 08:00

### AI Engine
- [ ] LLM gateway falls back to secondary provider within 2 seconds of primary failure
- [ ] Legal query returns answer with source citations in < 5 seconds
- [ ] Document OCR extracts title deed owner name with > 90% accuracy
- [ ] Vector search returns relevant legislation for any building-code query
- [ ] All LLM requests logged with token counts and cost estimates
- [ ] AI usage costs visible to admins in real time

---

## Dependencies
- Sprints 03–10 (data from all previous features feeds analytics)
- Sprint 01 (GPU compute / ML infrastructure)

## Blocks
- Sprint 12 (AI Design Assistant needs AI engine)
