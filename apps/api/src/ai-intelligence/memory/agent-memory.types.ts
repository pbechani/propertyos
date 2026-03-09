// ─────────────────────────────────────────────────────────────────────────────
// AI Memory Architecture — shared type definitions
// Short-term memory: ephemeral, TTL-bounded, session-scoped.
// Long-term memory:  persistent across sessions, company/agent-scoped.
// ─────────────────────────────────────────────────────────────────────────────

/** A single short-term memory entry with expiry tracking. */
export type ShortTermEntry = {
  value: unknown;
  /** Unix epoch ms after which the entry is considered stale and evicted. */
  expiresAt: number;
  storedAt: number;
  accessCount: number;
};

/** A single long-term memory entry persisted across sessions. */
export type LongTermEntry = {
  agentName: string;
  companyId: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
};

/** A read-only snapshot of an agent's memory state. */
export type AgentMemorySnapshot = {
  agentName: string;
  companyId: string;
  shortTermCount: number;
  longTermCount: number;
  shortTermKeys: string[];
  longTermKeys: string[];
};

/**
 * A recorded reasoning step stored in an agent's context window.
 * Agents can read back their own prior reasoning to maintain coherence
 * across multi-step workflows.
 */
export type ReasoningStep = {
  stepId: string;
  agentName: string;
  companyId: string;
  query: string;
  intent: string;
  timestamp: Date;
  outcome: 'success' | 'fallback' | 'error';
  summary: string;
};
