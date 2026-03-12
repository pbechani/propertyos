-- Tracks whether a listing's agent has been platform-suspended.
-- When an agent is suspended:
--   • Non-self-company listings: agent_suspended = true  → buyers cannot contact / interact.
--   • Self-company listings    : agent_suspended = true  → status also set to 'inactive' (hidden from search).
-- On reinstatement, self-company inactive listings whose agent_suspended flag is set are restored to
-- 'active', then agent_suspended is cleared across all of the agent's listings.

ALTER TABLE property.properties
  ADD COLUMN agent_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index: only index listings that are currently suspended → low-cardinality, stays lean.
CREATE INDEX idx_properties_agent_suspended
  ON property.properties (agent_id, agent_suspended)
  WHERE agent_suspended = TRUE;
