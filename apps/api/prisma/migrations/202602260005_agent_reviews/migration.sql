-- Migration: 202602260005_agent_reviews
-- Creates property.agent_reviews for live client review storage.

CREATE TABLE IF NOT EXISTS property.agent_reviews (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID          NOT NULL,
  reviewer_id     UUID,                                        -- nullable: logged-in user
  reviewer_name   VARCHAR(120),
  reviewer_email  VARCHAR(255),
  rating          SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  property_type   VARCHAR(50),
  property_id     UUID,                                        -- optional: linked listing
  status          VARCHAR(20)   NOT NULL DEFAULT 'published'   -- published | hidden | flagged
    CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Fast lookup of all published reviews for an agent, newest first
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent
  ON property.agent_reviews (agent_id, created_at DESC);

-- Lookup by reviewer when they are a logged-in user
CREATE INDEX IF NOT EXISTS idx_agent_reviews_reviewer
  ON property.agent_reviews (reviewer_id)
  WHERE reviewer_id IS NOT NULL;
