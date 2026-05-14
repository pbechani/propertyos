import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AgentMemorySnapshot,
  LongTermEntry,
  ReasoningStep,
  ShortTermEntry,
} from './agent-memory.types';

// ─────────────────────────────────────────────────────────────────────────────
// AgentMemoryService
//
// Two-tier memory architecture for AI agents:
//
//   Short-term  — ephemeral, TTL-bounded (default 5 min).  Cleared after
//                 expiry or explicit session close.  Backed by an in-process
//                 Map; in production this would live in Redis so memory
//                 survives pod restarts and is shared across replicas.
//
//   Long-term   — persistent across sessions.  Backed by an in-process Map
//                 for the MVP; in production this would persist to PostgreSQL
//                 (ai_engine.agent_memories) or a vector store (Pinecone /
//                 Weaviate) enabling semantic recall over historical context.
//
//   Reasoning   — a bounded circular buffer of the last N reasoning steps per
//                 agent × company pair.  Agents can replay prior reasoning to
//                 avoid contradictory answers and surface patterns.
// ─────────────────────────────────────────────────────────────────────────────

const SHORT_TERM_DEFAULT_TTL_MS = 5 * 60_000; // 5 minutes
const REASONING_BUFFER_SIZE = 50; // last 50 steps per agent×company

@Injectable()
export class AgentMemoryService {
  private readonly logger = new Logger(AgentMemoryService.name);

  /** Short-term store: `agentName::companyId::key → ShortTermEntry` */
  private readonly shortTerm = new Map<string, ShortTermEntry>();

  /** Long-term store: `agentName::companyId::key → LongTermEntry` */
  private readonly longTerm = new Map<string, LongTermEntry>();

  /** Reasoning buffer: `agentName::companyId → ReasoningStep[]` */
  private readonly reasoningBuffer = new Map<string, ReasoningStep[]>();

  // ── Key helpers ────────────────────────────────────────────────────────────

  private stKey(agentName: string, companyId: string, key: string): string {
    return `${agentName}::${companyId}::${key}`;
  }

  private bufferKey(agentName: string, companyId: string): string {
    return `${agentName}::${companyId}`;
  }

  // ── Short-term memory ──────────────────────────────────────────────────────

  /**
   * Store a value in short-term memory.
   * @param ttlMs Time-to-live in milliseconds (default 5 min).
   */
  storeShortTerm(
    agentName: string,
    companyId: string,
    key: string,
    value: unknown,
    ttlMs = SHORT_TERM_DEFAULT_TTL_MS,
  ): void {
    const mapKey = this.stKey(agentName, companyId, key);
    const existing = this.shortTerm.get(mapKey);
    this.shortTerm.set(mapKey, {
      value,
      expiresAt: Date.now() + ttlMs,
      storedAt: Date.now(),
      accessCount: existing?.accessCount ?? 0,
    });
  }

  /**
   * Retrieve a value from short-term memory.
   * Returns `null` if the key is missing or stale.
   */
  getShortTerm<T = unknown>(agentName: string, companyId: string, key: string): T | null {
    const mapKey = this.stKey(agentName, companyId, key);
    const entry = this.shortTerm.get(mapKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.shortTerm.delete(mapKey);
      return null;
    }
    // Update access count lazily
    this.shortTerm.set(mapKey, { ...entry, accessCount: entry.accessCount + 1 });
    return entry.value as T;
  }

  /** Remove all short-term entries for a given agent + company pair (session end). */
  clearShortTermSession(agentName: string, companyId: string): void {
    const prefix = `${agentName}::${companyId}::`;
    for (const k of this.shortTerm.keys()) {
      if (k.startsWith(prefix)) this.shortTerm.delete(k);
    }
  }

  // ── Long-term memory ───────────────────────────────────────────────────────

  /** Persistently store a value keyed by agent + company + semantic key. */
  storeLongTerm(agentName: string, companyId: string, key: string, value: unknown): void {
    const mapKey = this.stKey(agentName, companyId, key);
    const existing = this.longTerm.get(mapKey);
    this.longTerm.set(mapKey, {
      agentName,
      companyId,
      key,
      value,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
      accessCount: existing?.accessCount ?? 0,
    });
  }

  /** Retrieve a long-term value. Returns `null` if not found. */
  getLongTerm<T = unknown>(agentName: string, companyId: string, key: string): T | null {
    const mapKey = this.stKey(agentName, companyId, key);
    const entry = this.longTerm.get(mapKey);
    if (!entry) return null;
    this.longTerm.set(mapKey, { ...entry, accessCount: entry.accessCount + 1 });
    return entry.value as T;
  }

  /** Delete a specific long-term entry. */
  deleteLongTerm(agentName: string, companyId: string, key: string): boolean {
    return this.longTerm.delete(this.stKey(agentName, companyId, key));
  }

  // ── Reasoning buffer ───────────────────────────────────────────────────────

  /** Append a reasoning step to the agent's circular buffer. */
  addReasoningStep(
    agentName: string,
    companyId: string,
    step: Omit<ReasoningStep, 'stepId' | 'agentName' | 'companyId' | 'timestamp'>,
  ): void {
    const bk = this.bufferKey(agentName, companyId);
    const buf = this.reasoningBuffer.get(bk) ?? [];
    const newStep: ReasoningStep = {
      ...step,
      stepId: randomUUID(),
      agentName,
      companyId,
      timestamp: new Date(),
    };
    buf.push(newStep);
    // Trim to buffer size (oldest first)
    if (buf.length > REASONING_BUFFER_SIZE) buf.splice(0, buf.length - REASONING_BUFFER_SIZE);
    this.reasoningBuffer.set(bk, buf);
  }

  /** Retrieve the most recent reasoning steps (up to `limit`). */
  getReasoningHistory(agentName: string, companyId: string, limit = 10): ReasoningStep[] {
    const buf = this.reasoningBuffer.get(this.bufferKey(agentName, companyId)) ?? [];
    return buf.slice(-limit);
  }

  // ── Snapshot & housekeeping ────────────────────────────────────────────────

  /** Return a read-only snapshot of an agent's memory state. */
  getSnapshot(agentName: string, companyId: string): AgentMemorySnapshot {
    const prefix = `${agentName}::${companyId}::`;
    const stKeys = [...this.shortTerm.keys()]
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
    const ltKeys = [...this.longTerm.keys()]
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
    return {
      agentName,
      companyId,
      shortTermCount: stKeys.length,
      longTermCount: ltKeys.length,
      shortTermKeys: stKeys,
      longTermKeys: ltKeys,
    };
  }

  /**
   * Evict all expired short-term entries.
   * Call this from a scheduled job (e.g., every 10 min) to prevent memory leaks.
   * @returns Number of entries evicted.
   */
  purgeExpiredShortTerm(): number {
    let evicted = 0;
    const now = Date.now();
    for (const [k, v] of this.shortTerm.entries()) {
      if (now > v.expiresAt) {
        this.shortTerm.delete(k);
        evicted++;
      }
    }
    if (evicted > 0) this.logger.debug(`Purged ${evicted} expired short-term memory entries`);
    return evicted;
  }

  /** Total number of entries in each store (for metrics). */
  getStoreSizes(): { shortTerm: number; longTerm: number; reasoningSteps: number } {
    const reasoningSteps = [...this.reasoningBuffer.values()].reduce(
      (acc, buf) => acc + buf.length,
      0,
    );
    return { shortTerm: this.shortTerm.size, longTerm: this.longTerm.size, reasoningSteps };
  }
}
