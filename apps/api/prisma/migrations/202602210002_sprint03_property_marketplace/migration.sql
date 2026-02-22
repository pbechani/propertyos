-- Sprint 03: Property Marketplace
-- Creates all property.* tables with PostGIS geo-search support

-- Enable PostGIS extension (requires postgis/postgis Docker image)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- property.properties
-- ============================================================
CREATE TABLE IF NOT EXISTS property.properties (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  property_type       VARCHAR(30) NOT NULL CHECK (property_type IN ('land', 'residential', 'commercial', 'off_plan')),
  status              VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'under_offer', 'sold', 'withdrawn')),
  price               NUMERIC(18,2) NOT NULL,
  currency            CHAR(3)     NOT NULL DEFAULT 'USD',
  area_sqm            NUMERIC(10,2),
  bedrooms            SMALLINT,
  bathrooms           SMALLINT,
  parking_spaces      SMALLINT,
  features            JSONB       DEFAULT '[]',
  agent_id            UUID,         -- application-layer ref to identity.users(id)
  owner_id            UUID,         -- application-layer ref to identity.users(id)
  verification_status VARCHAR(30) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'flagged')),
  verified_at         TIMESTAMPTZ,
  verified_by         UUID,         -- application-layer ref to identity.users(id)
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_agent       ON property.properties (agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status      ON property.properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_type        ON property.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_verification ON property.properties (verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_price       ON property.properties (price);

-- ============================================================
-- property.property_locations
-- ============================================================
CREATE TABLE IF NOT EXISTS property.property_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID UNIQUE REFERENCES property.properties(id) ON DELETE CASCADE,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city          VARCHAR(100),
  region        VARCHAR(100),
  country       CHAR(2) NOT NULL,
  postal_code   VARCHAR(20),
  latitude      NUMERIC(9,6),
  longitude     NUMERIC(9,6),
  geom          GEOMETRY(Point, 4326)
);

CREATE INDEX IF NOT EXISTS idx_property_locations_property ON property.property_locations (property_id);
CREATE INDEX IF NOT EXISTS idx_property_locations_geom     ON property.property_locations USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_property_locations_city     ON property.property_locations (LOWER(city));

-- ============================================================
-- property.property_media
-- ============================================================
CREATE TABLE IF NOT EXISTS property.property_media (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID      REFERENCES property.properties(id) ON DELETE CASCADE,
  media_type    VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  url           TEXT      NOT NULL,
  thumbnail_url TEXT,
  display_order SMALLINT  DEFAULT 0,
  is_primary    BOOLEAN   DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property ON property.property_media (property_id);

-- ============================================================
-- property.ownership_history
-- ============================================================
CREATE TABLE IF NOT EXISTS property.ownership_history (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID    REFERENCES property.properties(id) ON DELETE CASCADE,
  owner_id          UUID,   -- application-layer ref to identity.users(id)
  owner_name        VARCHAR(255),   -- for pre-platform historical records
  transfer_date     DATE,
  transfer_price    NUMERIC(18,2),
  transfer_currency CHAR(3),
  title_deed_url    TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ownership_history_property ON property.ownership_history (property_id);

-- ============================================================
-- property.verifications
-- ============================================================
CREATE TABLE IF NOT EXISTS property.verifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID REFERENCES property.properties(id) ON DELETE CASCADE,
  title_deed_url      TEXT,
  deed_number         VARCHAR(100),
  registry_reference  VARCHAR(100),
  status              VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id         UUID,   -- application-layer ref to identity.users(id)
  reviewer_notes      TEXT,
  reviewed_at         TIMESTAMPTZ,
  submitted_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_property ON property.verifications (property_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status   ON property.verifications (status);

-- ============================================================
-- property.inquiries
-- ============================================================
CREATE TABLE IF NOT EXISTS property.inquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID REFERENCES property.properties(id) ON DELETE CASCADE,
  buyer_id       UUID,   -- application-layer ref to identity.users(id)
  inquiry_type   VARCHAR(20) NOT NULL CHECK (inquiry_type IN ('viewing', 'offer', 'question')),
  message        TEXT,
  preferred_date TIMESTAMPTZ,
  status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  response       TEXT,
  responded_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property ON property.inquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer    ON property.inquiries (buyer_id);

-- ============================================================
-- property.saved_properties
-- ============================================================
CREATE TABLE IF NOT EXISTS property.saved_properties (
  user_id     UUID NOT NULL,   -- application-layer ref to identity.users(id)
  property_id UUID REFERENCES property.properties(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user ON property.saved_properties (user_id);

-- ============================================================
-- property.fraud_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS property.fraud_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID REFERENCES property.properties(id) ON DELETE CASCADE,
  reporter_id      UUID,   -- application-layer ref to identity.users(id)
  report_type      VARCHAR(50) NOT NULL CHECK (report_type IN ('double_sale', 'fake_title', 'non_existent', 'misrepresentation', 'other')),
  description      TEXT NOT NULL,
  evidence_urls    JSONB DEFAULT '[]',
  status           VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_investigation', 'resolved', 'dismissed')),
  resolver_id      UUID,   -- application-layer ref to identity.users(id)
  resolution_notes TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_reports_property ON property.fraud_reports (property_id);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_status   ON property.fraud_reports (status);

-- ============================================================
-- property.audit_logs  (property-specific audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS property.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      VARCHAR(100) NOT NULL,
  actor_id      UUID,
  actor_role    VARCHAR(50),
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id   UUID,
  payload       JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_audit_actor   ON property.audit_logs (actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_property_audit_resource ON property.audit_logs (resource_type, resource_id);

-- Append-only trigger for property audit logs
CREATE OR REPLACE FUNCTION property.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable — UPDATE and DELETE are not permitted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_update_property_audit_logs
  BEFORE UPDATE OR DELETE ON property.audit_logs
  FOR EACH ROW EXECUTE FUNCTION property.prevent_audit_modification();

-- Auto-update updated_at on properties
CREATE OR REPLACE FUNCTION property.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON property.properties
  FOR EACH ROW EXECUTE FUNCTION property.update_updated_at();
