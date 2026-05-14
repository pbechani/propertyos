-- Sprint 03 Enhanced: Property Marketplace — Extended Schema
-- Adds mandates, valuations, viewings, open houses, neighbourhood stats, syndication
-- Sprint file: design/sprints/sprint-03-property-marketplace_enhanced.md

-- ============================================================
-- 1. Extended columns on property.properties
-- ============================================================
ALTER TABLE property.properties
  ADD COLUMN IF NOT EXISTS property_subtype         VARCHAR(50),
  ADD COLUMN IF NOT EXISTS erf_size_sqm             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS floor_area_sqm           NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS garages                  SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carports                 SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_levy             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS monthly_rates            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS monthly_utilities        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS title_type               VARCHAR(30),
  ADD COLUMN IF NOT EXISTS zoning                   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS body_corporate_name      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pet_policy               VARCHAR(20),
  ADD COLUMN IF NOT EXISTS occupational_date        DATE,
  ADD COLUMN IF NOT EXISTS seller_approved_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_reference        VARCHAR(30);

-- Unique constraint on listing_reference (when set)
CREATE UNIQUE INDEX IF NOT EXISTS uq_properties_listing_reference
  ON property.properties (listing_reference)
  WHERE listing_reference IS NOT NULL;

-- ============================================================
-- 2. Listing state transitions (valid transitions seed)
-- ============================================================
CREATE TABLE IF NOT EXISTS property.listing_state_transitions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  from_state    VARCHAR(30)  NOT NULL,
  to_state      VARCHAR(30)  NOT NULL,
  allowed_roles JSONB        NOT NULL DEFAULT '[]',
  requires_event VARCHAR(100),
  UNIQUE(from_state, to_state)
);

COMMENT ON TABLE property.listing_state_transitions IS
  'Defines which state transitions are valid for a property listing and who can trigger them.';

INSERT INTO property.listing_state_transitions (from_state, to_state, allowed_roles, requires_event)
VALUES
  ('draft',               'pending_verification', '["agent","admin"]',            NULL),
  ('pending_verification','active',               '["admin"]',                    'verification_approved'),
  ('pending_verification','draft',                '["admin"]',                    'verification_rejected'),
  ('active',              'offer_received',       '["system"]',                   'offer_submitted'),
  ('offer_received',      'under_contract',       '["agent"]',                    'otp_signed'),
  ('offer_received',      'active',               '["agent"]',                    'offer_withdrawn'),
  ('under_contract',      'sold',                 '["system"]',                   'stage_14_completed'),
  ('under_contract',      'active',               '["admin"]',                    'sale_fell_through'),
  ('active',              'withdrawn',            '["agent","buyer_seller"]',     NULL),
  ('sold',                'archived',             '["system"]',                   NULL)
ON CONFLICT (from_state, to_state) DO NOTHING;

-- ============================================================
-- 3. Agent mandates
-- ============================================================
CREATE TABLE IF NOT EXISTS property.mandates (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id             UUID         NOT NULL,
  agent_id                UUID         NOT NULL,
  brokerage_id            UUID,
  mandate_type            VARCHAR(20)  NOT NULL CHECK (mandate_type IN ('sole','open')),
  commission_rate         NUMERIC(5,2) NOT NULL,
  commission_vat_inclusive BOOLEAN     DEFAULT FALSE,
  start_date              DATE         NOT NULL,
  end_date                DATE         NOT NULL,
  auto_renewal            BOOLEAN      DEFAULT FALSE,
  terms_document_url      TEXT,
  signed_by_seller_at     TIMESTAMPTZ,
  signed_by_agent_at      TIMESTAMPTZ,
  status                  VARCHAR(20)  NOT NULL DEFAULT 'pending_signature'
                            CHECK (status IN ('pending_signature','active','expired','cancelled')),
  cancellation_reason     TEXT,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE property.mandates IS
  'Sole and open mandate agreements between agents and property sellers.';

-- Prevent two active sole mandates for the same property
CREATE UNIQUE INDEX IF NOT EXISTS uq_sole_mandate_per_property
  ON property.mandates (property_id)
  WHERE mandate_type = 'sole' AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_mandates_property_status ON property.mandates (property_id, status);
CREATE INDEX IF NOT EXISTS idx_mandates_agent_status    ON property.mandates (agent_id, status);

-- ============================================================
-- 4. Property valuations
-- ============================================================
CREATE TABLE IF NOT EXISTS property.valuations (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID         NOT NULL,
  valuation_type      VARCHAR(20)  NOT NULL CHECK (valuation_type IN ('formal','cma')),
  valuer_id           UUID,
  estimated_value     NUMERIC(18,2) NOT NULL,
  market_low          NUMERIC(18,2),
  market_high         NUMERIC(18,2),
  currency            CHAR(3)      NOT NULL DEFAULT 'ZAR',
  valuation_date      DATE         NOT NULL,
  methodology         TEXT,
  comparables         JSONB        NOT NULL DEFAULT '[]',
  report_document_url TEXT,
  is_bank_accepted    BOOLEAN      DEFAULT FALSE,
  requesting_purpose  VARCHAR(50),
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_valuations_property_type
  ON property.valuations (property_id, valuation_type);

-- ============================================================
-- 5. Comparable sales
-- ============================================================
CREATE TABLE IF NOT EXISTS property.comparable_sales (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  address          TEXT         NOT NULL,
  city             VARCHAR(100),
  region           VARCHAR(100),
  country          CHAR(2)      NOT NULL,
  property_type    VARCHAR(30),
  property_subtype VARCHAR(50),
  bedrooms         SMALLINT,
  bathrooms        SMALLINT,
  floor_area_sqm   NUMERIC(10,2),
  erf_size_sqm     NUMERIC(10,2),
  sale_price       NUMERIC(18,2) NOT NULL,
  currency         CHAR(3)       NOT NULL,
  sale_date        DATE          NOT NULL,
  days_on_market   SMALLINT,
  lat              NUMERIC(9,6),
  lng              NUMERIC(9,6),
  data_source      VARCHAR(50),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparable_sales_country_region
  ON property.comparable_sales (country, region, sale_date);

-- ============================================================
-- 6. Viewings & Appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS property.viewings (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID         NOT NULL,
  agent_id         UUID         NOT NULL,
  buyer_id         UUID         NOT NULL,
  viewing_type     VARCHAR(20)  NOT NULL CHECK (viewing_type IN ('physical','virtual','open_house')),
  scheduled_at     TIMESTAMPTZ  NOT NULL,
  duration_minutes SMALLINT     DEFAULT 30,
  status           VARCHAR(20)  NOT NULL DEFAULT 'requested'
                     CHECK (status IN ('requested','confirmed','completed','no_show','cancelled')),
  virtual_link     TEXT,
  agent_notes      TEXT,
  buyer_feedback   JSONB,
  no_show_reason   TEXT,
  confirmed_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viewings_property_scheduled
  ON property.viewings (property_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_viewings_agent_scheduled
  ON property.viewings (agent_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_viewings_buyer
  ON property.viewings (buyer_id);

-- ============================================================
-- 7. Open Houses
-- ============================================================
CREATE TABLE IF NOT EXISTS property.open_houses (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID        NOT NULL,
  agent_id       UUID        NOT NULL,
  scheduled_at   TIMESTAMPTZ NOT NULL,
  end_at         TIMESTAMPTZ NOT NULL,
  max_attendees  SMALLINT,
  description    TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','active','completed','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_open_houses_property ON property.open_houses (property_id, scheduled_at);

CREATE TABLE IF NOT EXISTS property.open_house_registrations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  open_house_id  UUID        NOT NULL REFERENCES property.open_houses(id) ON DELETE CASCADE,
  buyer_id       UUID        NOT NULL,
  registered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attended       BOOLEAN,
  feedback       JSONB,
  UNIQUE (open_house_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_open_house_regs_oh ON property.open_house_registrations (open_house_id);

-- ============================================================
-- 8. Neighbourhood stats
-- ============================================================
CREATE TABLE IF NOT EXISTS property.neighbourhood_stats (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  suburb                VARCHAR(100) NOT NULL,
  city                  VARCHAR(100) NOT NULL,
  region                VARCHAR(100) NOT NULL,
  country               CHAR(2)      NOT NULL,
  avg_price_per_sqm     NUMERIC(10,2),
  median_sale_price     NUMERIC(18,2),
  avg_days_on_market    SMALLINT,
  yoy_price_change_pct  NUMERIC(5,2),
  demand_score          SMALLINT,
  school_rating         SMALLINT,
  infrastructure_score  SMALLINT,
  crime_index           SMALLINT,
  walkability_score     SMALLINT,
  last_calculated_at    TIMESTAMPTZ,
  data_sources          JSONB NOT NULL DEFAULT '[]',
  UNIQUE (suburb, city, country)
);

CREATE INDEX IF NOT EXISTS idx_neighbourhood_stats_location
  ON property.neighbourhood_stats (country, region, city);

-- ============================================================
-- 9. Syndication configuration & records
-- ============================================================
CREATE TABLE IF NOT EXISTS property.syndication_configs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_name          VARCHAR(100) NOT NULL,
  portal_api_endpoint  TEXT,
  auth_type            VARCHAR(20),
  credentials_secret_ref TEXT,
  supported_countries  JSONB NOT NULL DEFAULT '[]',
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS property.syndication_records (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID        NOT NULL,
  portal_id           UUID        NOT NULL REFERENCES property.syndication_configs(id),
  external_listing_id VARCHAR(255),
  external_url        TEXT,
  sync_status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (sync_status IN ('pending','synced','failed','paused')),
  last_synced_at      TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, portal_id)
);

CREATE INDEX IF NOT EXISTS idx_syndication_records_property
  ON property.syndication_records (property_id, sync_status);
