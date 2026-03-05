# Sprint 11 — Risk Analytics & AI Engine (Enhanced)
**Addendum to sprint-11-risk-analytics-ai.md**

This file documents the additional specs from the AI Real Estate PM Blueprint that were not covered in the original sprint-11. Read sprint-11-risk-analytics-ai.md first; this file only describes additions and extensions.

---

## Additional Deliverables

- [ ] NL-to-SQL query engine using LangChain SQL Agent + Claude/GPT-4
- [ ] Dynamic property pricing engine (XGBoost regression — Phases 1 & 2)
- [ ] Churn prediction model (identify at-risk platform users/contractors)
- [ ] Fraud pattern detection rules engine (rules + ML ensemble)
- [ ] Risk score versioning and audit trail
- [ ] A/B test harness for model comparison

---

## 1. NL-to-SQL Engine (LangChain SQL Agent)

From AI Blueprint: NL-to-SQL using LangChain + Claude 3 Sonnet or GPT-4.

### Architecture
```
User query (natural language)
    ↓
Preprocessing: expand abbreviations, detect intent
    ↓
LangChain SQL Agent
    ├── Table context injection (schema introspection — safe schemas only)
    ├── Few-shot examples (10 selected SA real estate question→SQL pairs)
    └── SQL generation
    ↓
SQL Safety Validator (AST parse, whitelist check)
    ↓
Read-only DB connection (pg user with SELECT only, no DML grants)
    ↓
Results → NL explanation generation (LLM summarise step)
    ↓
Response + logs
```

### LangChain Implementation
```typescript
import { createSqlAgent, SqlToolkit } from 'langchain/agents/toolkits';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { DataSource } from 'typeorm';

// Analyst-only read replica connection
const readOnlyDs = new DataSource({
  type: 'postgres',
  url: process.env.ANALYTICS_DB_READONLY_URL,
  schema: 'analytics',       // restrict to analytics + property aggregates
});

const llm = new ChatOpenAI({ modelName: 'gpt-4', temperature: 0 });
const toolkit = new SqlToolkit(readOnlyDs, llm);
const agent = createSqlAgent(llm, toolkit, {
  prefix: `You are a real estate market analyst AI for the South African property market.
  Only query the analytics, property, and rental schemas.
  NEVER expose individual person data. Always aggregate.
  Return concise SQL and a short explanation.`,
});
```

### SQL Safety Validator
```typescript
import { parse } from 'pgsql-parser';

const FORBIDDEN_STATEMENTS = ['InsertStmt', 'UpdateStmt', 'DeleteStmt', 
                              'DropStmt', 'TruncateStmt', 'AlterTableStmt',
                              'CreateStmt', 'GrantStmt'];

function validateSQL(sql: string): { safe: boolean; reason?: string } {
  const ast = parse(sql);
  for (const stmt of ast) {
    const stmtType = Object.keys(stmt)[0];
    if (FORBIDDEN_STATEMENTS.includes(stmtType)) {
      return { safe: false, reason: `Forbidden statement type: ${stmtType}` };
    }
  }
  // Deny any schema not in allow-list
  if (/\bidentity\.\b|\bfinancial\.events\b/i.test(sql)) {
    return { safe: false, reason: 'Forbidden schema access detected' };
  }
  return { safe: true };
}
```

---

## 2. Dynamic Pricing Engine

### Extended `analytics.pricing_runs`
```sql
-- Each time the pricing model runs for a listing (sale or rental)
CREATE TABLE analytics.pricing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type VARCHAR(20) NOT NULL,     -- sale, rental
  listing_id UUID NOT NULL,
  model_version VARCHAR(20) NOT NULL,    -- "v1_rules", "v2_xgboost"
  
  -- Inputs
  features JSONB NOT NULL,               -- {bedrooms, sqm, suburb, age, amenities, ...}
  
  -- Outputs
  suggested_price NUMERIC(18,2),
  confidence_score NUMERIC(4,3),
  price_range JSONB,                     -- {p10, p50, p90}
  
  -- Comparables used
  comparable_ids JSONB DEFAULT '[]',
  comparables_radius_km NUMERIC(4,1),
  
  -- ML metadata
  shap_values JSONB,                     -- feature importance for this prediction
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON analytics.pricing_runs (listing_type, listing_id, created_at DESC);
```

### Phase 1: Rules-Based Pricing
```typescript
function ruleBasedSalePrice(features: ListingFeatures, comparables: Comparable[]): PricingOutput {
  const medianPricePerSqm = median(comparables.map(c => c.price_per_sqm));
  let basePrice = medianPricePerSqm * features.sqm;
  
  // Adjustments
  if (features.hasPool) basePrice *= 1.04;
  if (features.garages > 2) basePrice *= 1.02;
  if (features.daysOnMarket > 60) basePrice *= 0.97;   // price pressure
  if (features.viewCount > 100 && features.enquiries < 5) basePrice *= 0.95;  // traffic but no interest
  
  return { suggestedPrice: Math.round(basePrice / 5000) * 5000, method: 'comparable_median' };
}
```

### Phase 2: XGBoost Regression (ML Service)
```
POST /internal/ml/price-predict
Body: { listing_type, features }
Response: { price, confidence, shap_values }

Cloud: Python FastAPI microservice
Model: XGBoostRegressor trained on 3+ years historical sales
Features: [bedrooms, bathrooms, sqm, suburb_code, property_age, amenity_score, days_on_market, 
           suburb_median_price_per_sqm, absorption_rate, seasonality_index]
Retrain: monthly with new comparable sales data
```

---

## 3. Churn Prediction Model

Identify contractors, agents, and buyers who are at risk of abandoning the platform.

### `analytics.user_engagement_scores`
```sql
CREATE TABLE analytics.user_engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES identity.users(id),
  user_role VARCHAR(50),
  
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Feature signals (last 30 days)
  logins_30d SMALLINT DEFAULT 0,
  actions_30d SMALLINT DEFAULT 0,       -- any meaningful platform action
  listings_created_30d SMALLINT DEFAULT 0,
  bids_submitted_30d SMALLINT DEFAULT 0,
  messages_sent_30d SMALLINT DEFAULT 0,
  days_since_last_login SMALLINT,
  
  -- Score
  churn_risk_score NUMERIC(4,3),         -- 0 = low risk, 1 = likely to churn
  churn_risk_label VARCHAR(20),          -- low, medium, high, critical
  
  -- Model
  model_version VARCHAR(20)
);
CREATE INDEX ON analytics.user_engagement_scores (churn_risk_label, user_role);
```

### Triggers for Churn Intervention
| Risk Level | Action |
|-----------|--------|
| `medium` | Send re-engagement email |
| `high` | Trigger in-app notification with personalised prompt |
| `critical` | Flag for manual account manager follow-up |

---

## 4. Fraud Pattern Detection (Enhanced)

Extends Sprint 11's existing risk scoring with additional detection patterns:

### Additional Fraud Signals
```typescript
const ADDITIONAL_FRAUD_RULES: FraudRule[] = [
  // Listing fraud
  {
    id: 'LISTING_PRICE_ANOMALY',
    description: 'Listing price > 40% below comparable suburb median',
    score: 60,
    category: 'listing_fraud',
  },
  // Double listing
  {
    id: 'DUPLICATE_ADDRESS_LISTING',
    description: 'Same property address listed by different agents simultaneously',
    score: 80,
    category: 'double_listing',
  },
  // Identity fraud
  {
    id: 'ID_NUMBER_REUSE',
    description: 'Same SA ID number used across multiple accounts',
    score: 100,
    category: 'identity_fraud',
  },
  // Payment fraud
  {
    id: 'BANKING_DETAIL_CHANGE_PRE_PAYMENT',
    description: 'Conveyancer banking details changed within 48h of transfer payment',
    score: 95,
    category: 'payment_fraud',
    alert: 'CRITICAL — possible property email fraud (PEF)',
  },
];
```

### Property Email Fraud (PEF) Alert
A critical SA-specific fraud pattern: attackers intercept conveyancer emails and substitute banking details just before transfer payments are made. Detection:
```typescript
// Trigger on: financial account detail change for conveyancer accounts
// Action: immediate notification to all sale parties + 48h payment hold
function onConveyancerBankDetailsChange(userId: string, saleId: string): void {
  emitCriticalAlert('POTENTIAL_PEF', { userId, saleId });
  holdEscrowRelease(saleId, '48h');
  notifyAllSaleParties(saleId, 'BANKING_DETAIL_CHANGE_ALERT');
}
```

---

## 5. A/B Test Harness

For comparing model versions before full rollout:

### `analytics.ab_tests`
```sql
CREATE TABLE analytics.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(100) UNIQUE NOT NULL,
  model_type VARCHAR(50),         -- pricing, fraud, churn
  variant_a VARCHAR(50),          -- e.g. "v1_rules"
  variant_b VARCHAR(50),          -- e.g. "v2_xgboost"
  traffic_split_pct SMALLINT DEFAULT 50,  -- % of traffic on variant B
  status VARCHAR(20) DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  winner VARCHAR(20),
  notes TEXT
);
```

---

## API Endpoint Additions

```
POST /api/v1/analytics/nl-query                    [admin, analyst]
GET  /api/v1/analytics/nl-query/history             [admin — all; analyst — own]

POST /api/v1/analytics/price-predict               [agent, valuer, admin]
GET  /api/v1/analytics/pricing-runs/:listingId     [owner, agent, admin]

GET  /api/v1/analytics/churn-risk                  [admin]
GET  /api/v1/analytics/fraud-signals?minScore=     [admin, compliance]
GET  /api/v1/analytics/ab-tests                    [admin]
```

---

## Acceptance Criteria

- [ ] NL-to-SQL rejects any query with DML statements (returns 422 with reason)
- [ ] NL-to-SQL queries never expose data from `identity.*` or `financial.events`
- [ ] Pricing engine Phase 1 produces price within 15% of manual comparable analysis
- [ ] Churn score computed nightly for all active platform users
- [ ] Property Email Fraud (PEF) trigger fires when conveyancer bank details change within sale context
- [ ] A/B test framework supports controlled rollout of model versions

---

## Dependencies
- sprint-11-risk-analytics-ai.md (base AI Engine sprint)
- Sprint 17 (Market Intelligence — shares analytics schema, NL-to-SQL endpoint)

## Blocks
- Sprint 16 (Dynamic pricing used in rental listing suggestions)
- Sprint 17 (NL-to-SQL architecture shared — avoid duplication; use same endpoint)
