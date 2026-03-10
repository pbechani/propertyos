-- ─────────────────────────────────────────────────────────────────────────────
-- MindsDB Models: Sprint 11 — Risk Analytics & AI
--
-- Prerequisites: run 01_connect_postgres.sql first.
-- These models train lazily; MindsDB starts a background training job on first
-- CREATE MODEL. Re-run with CREATE OR REPLACE MODEL to retrain.
--
-- Training data expected in feature view tables (materialised by the NestJS
-- analytics module — see src/mindsdb/mindsdb.service.ts onModuleInit).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Property Valuation (regression) ──────────────────────────────────────
CREATE MODEL IF NOT EXISTS mindsdb.property_valuation
FROM pribec_postgres (
  SELECT
    p.asking_price,
    p.property_type,
    p.bedrooms,
    p.bathrooms,
    p.floor_area_sqm,
    p.land_area_sqm,
    p.latitude,
    p.longitude,
    p.year_built,
    p.listing_type
  FROM property.listings p
  WHERE p.status = 'sold'
    AND p.asking_price IS NOT NULL
)
PREDICT asking_price
USING
  engine     = 'lightwood',
  time_aim   = 60,
  tag        = 'v1';

-- ── 2. Contractor Risk Classification ────────────────────────────────────────
CREATE MODEL IF NOT EXISTS mindsdb.contractor_risk
FROM pribec_postgres (
  SELECT
    completion_rate,
    budget_adherence_rate,
    on_time_rate,
    dispute_rate,
    avg_rating,
    kyc_verified::int     AS kyc_verified,
    years_on_platform,
    total_projects,
    risk_level
  FROM analytics.contractor_risk_features
  WHERE risk_level IS NOT NULL
)
PREDICT risk_level
USING
  engine = 'lightwood',
  tag    = 'v1';

-- ── 3. Material Price Time-Series Forecast ───────────────────────────────────
CREATE MODEL IF NOT EXISTS mindsdb.material_price_forecast
FROM pribec_postgres (
  SELECT material_id, recorded_at, unit_price, region
  FROM marketplace.material_price_history
  WHERE unit_price IS NOT NULL
)
PREDICT unit_price
ORDER BY recorded_at
GROUP BY material_id, region
WINDOW  30
HORIZON 7
USING
  engine = 'statsforecast',
  tag    = 'v1';

-- ── 4. Construction Project Delay Prediction ─────────────────────────────────
CREATE MODEL IF NOT EXISTS mindsdb.project_delay_risk
FROM pribec_postgres (
  SELECT
    budget_total,
    current_spend_pct,
    contractor_risk_score,
    stages_completed,
    stages_total,
    days_elapsed,
    planned_duration_days,
    weather_risk_score,
    permit_delays_count,
    delayed::int AS delayed
  FROM construction.project_health_features
  WHERE delayed IS NOT NULL
)
PREDICT delayed
USING
  engine = 'lightwood',
  tag    = 'v1';
