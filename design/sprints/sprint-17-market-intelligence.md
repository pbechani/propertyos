# Sprint 17 — Market Intelligence & Analytics
**Phase 4A | Weeks 28–34 (after Sprint 11 AI Engine is stable)**

## Goal
Build the Market Intelligence module: real-time property price indices, absorption rate tracking, comparable sales engine, investment yield calculator, neighbourhood trend analytics, and an NL-to-SQL query interface for sophisticated market queries. Combines the AI Blueprint's analytics engine with platform guide Domain 13 (Market Intelligence).

---

## Deliverables Checklist
- [ ] Comparable sales database and search engine
- [ ] Automated Valuation Model (AVM) — rule-based Phase 1, ML Phase 2
- [ ] Property price index (median, per-sqm, suburb, property type)
- [ ] Absorption rate tracker (days on market, list-to-sale ratio)
- [ ] Investment yield calculator (gross & net)
- [ ] Neighbourhood score card (amenities, schools, crime, transport)
- [ ] Market trend reports (monthly, quarterly — PDF generation)
- [ ] NL-to-SQL query engine for authenticated analysts / admin
- [ ] Public market insights dashboard (filtered, non-PII)
- [ ] Agent market report generator (sharable CMA-style report)
- [ ] Buyer market comparison widget (price per suburb)

---

## Data Models

### `analytics.comparable_sales`
```sql
-- Authoritative record of completed sales used as comparables
CREATE TABLE analytics.comparable_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  source VARCHAR(30) NOT NULL,           -- "platform" (from our sales.property_sales) | "deeds_office" | "manual"
  sale_id UUID,                          -- reference if source = platform
  
  -- Property
  property_type VARCHAR(30) NOT NULL,    -- house, apartment, townhouse, land, commercial
  suburb VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(50),
  country CHAR(2) DEFAULT 'ZA',
  coordinates JSONB,                     -- {lat, lng}
  
  -- Property specs
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  gross_floor_area_sqm NUMERIC(8,2),
  stand_size_sqm NUMERIC(10,2),
  
  -- Transaction
  sale_price NUMERIC(18,2) NOT NULL,
  currency CHAR(3) DEFAULT 'ZAR',
  sale_date DATE NOT NULL,
  
  -- Calculated
  price_per_sqm NUMERIC(12,2),
  days_on_market INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON analytics.comparable_sales (suburb, property_type, sale_date DESC);
CREATE INDEX ON analytics.comparable_sales (city, sale_date DESC);
```

### `analytics.price_index_snapshots`
```sql
-- Rolled-up price indices — recalculated nightly
CREATE TABLE analytics.price_index_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  snapshot_date DATE NOT NULL,
  granularity VARCHAR(20) NOT NULL,      -- suburb, city, province, national
  area_name VARCHAR(100) NOT NULL,
  property_type VARCHAR(30),             -- NULL means all types
  
  -- Price metrics
  median_price NUMERIC(18,2),
  mean_price NUMERIC(18,2),
  median_price_per_sqm NUMERIC(12,2),
  
  -- Volume
  total_transactions INTEGER,
  total_volume NUMERIC(22,2),
  
  -- Time-on-market
  avg_days_on_market NUMERIC(6,1),
  median_days_on_market NUMERIC(6,1),
  
  -- List-to-sale
  avg_list_to_sale_ratio NUMERIC(6,4),   -- sale price / listing price
  
  -- YoY / QoQ change
  yoy_change_pct NUMERIC(7,4),
  qoq_change_pct NUMERIC(7,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date, granularity, area_name, COALESCE(property_type, 'all'))
);
CREATE INDEX ON analytics.price_index_snapshots (area_name, granularity, snapshot_date DESC);
```

### `analytics.absorption_rates`
```sql
-- How quickly inventory is absorbed (sold) in a market
CREATE TABLE analytics.absorption_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  area_name VARCHAR(100) NOT NULL,
  granularity VARCHAR(20) NOT NULL,
  property_type VARCHAR(30),
  
  new_listings INTEGER NOT NULL,
  sales_completed INTEGER NOT NULL,
  active_listings_end_of_period INTEGER,
  
  absorption_rate NUMERIC(5,4),          -- sales / active_listings (monthly)
  months_of_supply NUMERIC(6,2),         -- 1 / absorption_rate
  market_type VARCHAR(20),               -- sellers_market (<3 months), balanced (3-6), buyers_market (>6)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `analytics.avms`
```sql
-- Automated Valuation Model run results
CREATE TABLE analytics.avms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  run_date DATE NOT NULL,
  
  estimated_value NUMERIC(18,2) NOT NULL,
  confidence_score NUMERIC(4,3),         -- 0.0–1.0
  value_range_low NUMERIC(18,2),
  value_range_high NUMERIC(18,2),
  currency CHAR(3) DEFAULT 'ZAR',
  
  -- Methodology
  method VARCHAR(30),                    -- comparable_sales, income_approach, regression
  comparables_used INTEGER,
  comparables_radius_km NUMERIC(4,1),
  
  -- Model
  model_version VARCHAR(20),
  features_snapshot JSONB,               -- snapshot of inputs
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON analytics.avms (property_id, run_date DESC);
```

### `analytics.neighbourhood_scores`
```sql
CREATE TABLE analytics.neighbourhood_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suburb VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country CHAR(2) DEFAULT 'ZA',
  
  -- Scores (0–100)
  schools_score SMALLINT,
  transport_score SMALLINT,
  amenities_score SMALLINT,
  safety_score SMALLINT,
  healthcare_score SMALLINT,
  environment_score SMALLINT,
  overall_score SMALLINT,
  
  -- Sources
  data_sources JSONB DEFAULT '[]',
  last_refreshed TIMESTAMPTZ,
  
  UNIQUE(suburb, city, country),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `analytics.investment_analyses`
```sql
CREATE TABLE analytics.investment_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES property.properties(id),
  created_by UUID REFERENCES identity.users(id),
  
  purchase_price NUMERIC(18,2) NOT NULL,
  bond_amount NUMERIC(18,2),
  interest_rate NUMERIC(6,4),
  term_years SMALLINT,
  
  -- Revenue
  monthly_rental_income NUMERIC(10,2),
  vacancy_rate_pct NUMERIC(5,2) DEFAULT 7,  -- typical 7% vacancy assumed
  
  -- Expenses
  monthly_rates NUMERIC(8,2),
  monthly_levies NUMERIC(8,2),
  monthly_insurance NUMERIC(8,2),
  maintenance_reserve_pct NUMERIC(5,2) DEFAULT 1, -- 1% of value p.a.
  
  -- Yields (calculated)
  gross_rental_yield NUMERIC(5,4),              -- annual rent / purchase price
  net_rental_yield NUMERIC(5,4),                -- (annual rent - expenses) / purchase price
  cash_on_cash_return NUMERIC(5,4),             -- (annual net income - bond) / deposit
  cap_rate NUMERIC(5,4),                        -- NOI / purchase price
  
  -- Capital growth projection
  assumed_growth_pct NUMERIC(5,2),
  projected_value_5yr NUMERIC(18,2),
  projected_value_10yr NUMERIC(18,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `analytics.nl_query_logs`
```sql
-- Audit trail for NL-to-SQL queries
CREATE TABLE analytics.nl_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queried_by UUID REFERENCES identity.users(id),
  user_role VARCHAR(50),
  
  natural_language_query TEXT NOT NULL,
  generated_sql TEXT,
  sql_was_safe BOOLEAN,                  -- passed SQL safety validator
  result_row_count INTEGER,
  execution_ms INTEGER,
  
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## NL-to-SQL Query Engine

From AI Blueprint — uses LangChain SQL Agent:

```typescript
// NL-to-SQL pipeline using LangChain + Claude 3 Sonnet
interface NLQueryRequest {
  question: string;               // e.g. "What is the average price per sqm in Sandton for 3-bed apartments sold in 2024?"
  userId: string;
  allowedSchemas: string[];       // RBAC — restrict which schemas are queryable
}

interface NLQueryResponse {
  question: string;
  generatedSQL: string;
  results: Record<string, unknown>[];
  explanation: string;            // human-readable answer
  chartSuggestion?: 'bar' | 'line' | 'scatter' | 'table';
}

// Safety pipeline (non-negotiable):
// 1. SQL validated — no INSERT/UPDATE/DELETE/DROP/TRUNCATE allowed
// 2. Query limited to analytics.* and read-only views; never identity.* 
// 3. Row-level result cap: 10,000 rows max
// 4. Timeout: 30s
// 5. Every query logged to analytics.nl_query_logs with user ID

const SAFE_SCHEMAS_FOR_NL_QUERY = [
  'analytics',
  'property',         // listings only — no private owner info
  'rental',           // aggregate only — not individual tenants
];
```

---

## Market Report Generator

```typescript
// Generates PDF market reports for agents to share with clients
interface MarketReportRequest {
  suburb: string;
  propertyType: string;
  generatedBy: string;        // agent user ID
  includeComparables: boolean;
}

// Output: PDF with:
// - Median price trend (12 months)
// - Sales volumes (bar chart)
// - Days on market trend
// - Active listings vs sold ratio
// - Top comparable sales
// - Agent branding
```

---

## Computations Run Nightly (Cron Jobs)

```
@Cron('0 2 * * *')  // 2 AM daily
async function refreshMarketIndices(): Promise<void> {
  await recomputePriceIndexSnapshots();
  await recomputeAbsorptionRates();
  await refreshAVMsForActiveListings();
  await refreshNeighbourhoodScores();
}
```

---

## API Endpoints

### Price Index & Trends
```
GET /api/v1/market/price-index?suburb=&type=&period=   [public — aggregated, no PII]
GET /api/v1/market/absorption-rates?suburb=&type=      [public]
GET /api/v1/market/comparable-sales?suburb=&type=&from=&to= [authenticated]
```

### AVM
```
POST /api/v1/market/avm                                [agent, valuer, admin]
GET  /api/v1/market/avm/:propertyId/latest             [agent, valuer, landlord(owner)]
```

### Investment Analysis
```
POST /api/v1/market/investment-analysis                [authenticated]
GET  /api/v1/market/investment-analysis/:id            [creator only]
GET  /api/v1/market/investment-analysis/me             [authenticated — own analyses]
```

### Neighbourhood
```
GET /api/v1/market/neighbourhood/:suburb/:city         [public]
```

### Reports
```
POST /api/v1/market/reports/generate                   [agent, admin]
GET  /api/v1/market/reports/:id/download               [requester, admin]
```

### NL-to-SQL (authenticated, restricted roles only)
```
POST /api/v1/market/nl-query                           [admin, analyst, agent — limited schema access per role]
GET  /api/v1/market/nl-query/history                   [admin — full; agents — own]
```

---

## Acceptance Criteria

- [ ] Comparable sales search returns properties within configurable radius
- [ ] Price index snapshots computed nightly; < 24h data latency
- [ ] AVM request returns estimate with confidence score and comparables list
- [ ] Absorption rate displayed as "buyers market" / "balanced" / "sellers market" label
- [ ] Investment yield calculator produces correct gross/net yield matching manual formula
- [ ] NL-to-SQL engine rejects any query containing DML (INSERT/UPDATE/DELETE/DROP)
- [ ] NL-to-SQL queries scoped to safe schemas only — no access to identity.*, financial.events
- [ ] All NL-to-SQL queries logged with user ID and generated SQL
- [ ] Market report generated as downloadable PDF with agent branding
- [ ] No PII exposed in public market endpoints (no addresses, no names — only aggregates)

---

## Security Notes
- NL-to-SQL must use parameterised query execution, NOT raw string injection into Postgres
- All SQL generated by LLM must be parsed and validated by a whitelist SQL AST checker before execution
- Public endpoints return only aggregated, non-identifying data

---

## Dependencies
- Sprint 03 (property listings — source data)
- Sprint 04 (sales.property_sales — source for comparables)
- Sprint 11 (AI/LLM gateway — NL-to-SQL + AVM ML)
- Sprint 13 (valuation comparables — feeds analytics.comparable_sales)
- Sprint 16 (rental listings — source for rental yield benchmarks)

## Blocks
- Nothing downstream — this is a read-heavy analytics module
