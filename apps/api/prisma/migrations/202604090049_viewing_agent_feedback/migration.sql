-- Add agent_feedback JSONB column to property.viewings
ALTER TABLE property.viewings
  ADD COLUMN IF NOT EXISTS agent_feedback JSONB;

-- Partial index to efficiently query viewings that have feedback
CREATE INDEX IF NOT EXISTS idx_viewings_agent_feedback
  ON property.viewings ((agent_feedback IS NOT NULL))
  WHERE agent_feedback IS NOT NULL;
