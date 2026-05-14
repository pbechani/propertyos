-- Migration: 202604160050_anonymous_view_logs
-- Enables view_count to include anonymous (unauthenticated) visitors.
--
-- Problem: the previous view_count logic only incremented for authenticated users.
-- Anonymous browser visits from different IP addresses were silently ignored.
--
-- Solution: a lightweight deduplication table keyed on (property_id, ip_hash).
-- Before incrementing view_count for an anonymous visitor we check whether the
-- same IP hash appears in the last hour for this property.  If it does, we skip
-- the increment — this prevents Next.js SSR double-hits and rapidly refreshing
-- the same browser from inflating the counter while still recording each unique
-- IP as a genuine view.
--
-- ip_hash is a SHA-256 hex digest of the raw IP address, so no PII is stored.

CREATE TABLE IF NOT EXISTS property.anonymous_view_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID        NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
  ip_hash     TEXT        NOT NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup index: find recent entries for a given property + IP quickly.
CREATE INDEX IF NOT EXISTS idx_anon_view_logs_lookup
  ON property.anonymous_view_logs (property_id, ip_hash, viewed_at DESC);

-- Cleanup index: prune old rows without a sequential scan.
CREATE INDEX IF NOT EXISTS idx_anon_view_logs_viewed_at
  ON property.anonymous_view_logs (viewed_at);
