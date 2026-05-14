import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// AI Observability System
//
// Every agent execution generates a structured trace.  Traces capture:
//   • Identity:    traceId, agentName, action, companyId, userId
//   • Timing:      startedAt, completedAt, durationMs
//   • Status:      running → success | failed
//   • I/O summary: truncated input & output text (no PII stored)
//   • Cost:        estimated token cost (pre-LLM: query complexity proxy)
//   • Reasoning:   which intent was matched and why
//
// Metrics are aggregated in-memory for the Command Center dashboard.
// In production, traces would be streamed to an observability backend
// (e.g., OpenTelemetry → Grafana / Datadog / Jaeger).
// ─────────────────────────────────────────────────────────────────────────────

export type TraceStatus = 'running' | 'success' | 'failed';

export type AgentTrace = {
  traceId: string;
  agentName: string;
  action: string;
  companyId: string;
  userId?: string;
  /** Truncated input for audit — never store full PII. */
  inputSummary?: string;
  /** Truncated output description. */
  outputSummary?: string;
  /** Which intent was matched (e.g., "tasks_overdue"). */
  matchedIntent?: string;
  /** Confidence score 0-1 of the intent match. */
  intentConfidence?: number;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: TraceStatus;
  /** Estimated tokens consumed (query complexity estimation before LLM). */
  estimatedTokens?: number;
  /** Estimated cost in USD (model-dependent pricing). */
  estimatedCostUsd?: number;
  error?: string;
  /** Extra structured metadata from the agent. */
  metadata?: Record<string, unknown>;
};

export type AgentMetrics = {
  agentName: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  totalEstimatedCostUsd: number;
  callsLast24h: number;
};

export type ObservabilityReport = {
  generatedAt: Date;
  totalTraces: number;
  activeTraces: number;
  successRate: number;
  avgDurationMs: number;
  totalEstimatedCostUsd: number;
  agentMetrics: AgentMetrics[];
  recentTraces: AgentTrace[];
};

/** Pricing constants — update when real LLM is integrated. */
const COST_PER_TOKEN_USD = 0.000_002; // ~$0.002 / 1K tokens (GPT-4o estimate)
const TOKENS_PER_CHAR = 0.25; // rough 4 chars → 1 token heuristic

/** Keep the most recent N traces in memory. */
const MAX_TRACE_BUFFER = 500;

@Injectable()
export class AiObservabilityService {
  private readonly logger = new Logger(AiObservabilityService.name);

  /** Circular trace buffer — most recent MAX_TRACE_BUFFER traces. */
  private readonly traces: AgentTrace[] = [];

  // ── Trace lifecycle ────────────────────────────────────────────────────────

  /**
   * Begin a new trace for an agent invocation.
   * @returns The `traceId` — pass to `endTrace` / `failTrace`.
   */
  startTrace(opts: {
    agentName: string;
    action: string;
    companyId: string;
    userId?: string;
    inputSummary?: string;
    matchedIntent?: string;
    intentConfidence?: number;
  }): string {
    const traceId = randomUUID();

    // Estimate tokens from input length (no real LLM yet)
    const tokens = opts.inputSummary
      ? Math.ceil(opts.inputSummary.length * TOKENS_PER_CHAR)
      : 0;

    const trace: AgentTrace = {
      traceId,
      status: 'running',
      startedAt: new Date(),
      estimatedTokens: tokens,
      estimatedCostUsd: tokens * COST_PER_TOKEN_USD,
      ...opts,
    };
    this.appendTrace(trace);
    return traceId;
  }

  /**
   * Mark a trace as successfully completed and record output metadata.
   */
  endTrace(
    traceId: string,
    opts: {
      outputSummary?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): void {
    const trace = this.findTrace(traceId);
    if (!trace) return;
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - trace.startedAt.getTime();

    // Add output tokens to cost estimate
    const outputTokens = opts.outputSummary
      ? Math.ceil(opts.outputSummary.length * TOKENS_PER_CHAR)
      : 0;

    Object.assign(trace, {
      status: 'success' as TraceStatus,
      completedAt,
      durationMs,
      estimatedTokens: (trace.estimatedTokens ?? 0) + outputTokens,
      estimatedCostUsd:
        ((trace.estimatedTokens ?? 0) + outputTokens) * COST_PER_TOKEN_USD,
      ...opts,
    });
  }

  /**
   * Mark a trace as failed with an error message.
   */
  failTrace(traceId: string, error: Error | string): void {
    const trace = this.findTrace(traceId);
    if (!trace) return;
    const completedAt = new Date();
    Object.assign(trace, {
      status: 'failed' as TraceStatus,
      completedAt,
      durationMs: completedAt.getTime() - trace.startedAt.getTime(),
      error: typeof error === 'string' ? error : error.message,
    });
    this.logger.warn(
      `Trace failed [${trace.agentName}.${trace.action}] traceId=${traceId}: ${trace.error}`,
    );
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /**
   * Retrieve the most recent traces, optionally filtered by company or agent.
   */
  getRecentTraces(opts: {
    companyId?: string;
    agentName?: string;
    limit?: number;
    status?: TraceStatus;
  } = {}): AgentTrace[] {
    const { companyId, agentName, limit = 50, status } = opts;
    return this.traces
      .filter(
        (t) =>
          (!companyId || t.companyId === companyId) &&
          (!agentName || t.agentName === agentName) &&
          (!status || t.status === status),
      )
      .slice(-limit)
      .reverse(); // newest first
  }

  /**
   * Compute per-agent metrics for the Command Center dashboard.
   */
  getMetrics(companyId?: string): ObservabilityReport {
    const relevant = companyId
      ? this.traces.filter((t) => t.companyId === companyId)
      : this.traces;

    const finished = relevant.filter((t) => t.status !== 'running');
    const successes = finished.filter((t) => t.status === 'success');
    const active = relevant.filter((t) => t.status === 'running');
    const durations = finished.map((t) => t.durationMs ?? 0).sort((a, b) => a - b);
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length)
      : 0;
    const p95DurationMs = durations.length
      ? (durations[Math.floor(durations.length * 0.95)] ?? 0)
      : 0;
    const totalCostUsd = finished.reduce((s, t) => s + (t.estimatedCostUsd ?? 0), 0);

    const dayAgo = Date.now() - 24 * 60 * 60_000;

    // Per-agent breakdown
    const byAgent = new Map<string, AgentTrace[]>();
    for (const t of finished) {
      const arr = byAgent.get(t.agentName) ?? [];
      arr.push(t);
      byAgent.set(t.agentName, arr);
    }
    const agentMetrics: AgentMetrics[] = [...byAgent.entries()].map(([name, traces]) => {
      const ok = traces.filter((t) => t.status === 'success');
      const ds = traces.map((t) => t.durationMs ?? 0).sort((a, b) => a - b);
      return {
        agentName: name,
        totalCalls: traces.length,
        successCalls: ok.length,
        failedCalls: traces.length - ok.length,
        successRate: traces.length ? Math.round((ok.length / traces.length) * 100) : 100,
        avgDurationMs: ds.length
          ? Math.round(ds.reduce((s, v) => s + v, 0) / ds.length)
          : 0,
        p95DurationMs: ds.length ? (ds[Math.floor(ds.length * 0.95)] ?? 0) : 0,
        totalEstimatedCostUsd: traces.reduce((s, t) => s + (t.estimatedCostUsd ?? 0), 0),
        callsLast24h: traces.filter((t) => t.startedAt.getTime() > dayAgo).length,
      };
    });

    return {
      generatedAt: new Date(),
      totalTraces: finished.length,
      activeTraces: active.length,
      successRate: finished.length ? Math.round((successes.length / finished.length) * 100) : 100,
      avgDurationMs,
      totalEstimatedCostUsd: Math.round(totalCostUsd * 100_000) / 100_000,
      agentMetrics,
      recentTraces: this.getRecentTraces({ companyId, limit: 20 }),
    };
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private appendTrace(trace: AgentTrace): void {
    this.traces.push(trace);
    if (this.traces.length > MAX_TRACE_BUFFER) this.traces.shift();
  }

  private findTrace(traceId: string): AgentTrace | undefined {
    // Search from newest (most recent traces more likely to be updated)
    for (let i = this.traces.length - 1; i >= 0; i--) {
      if (this.traces[i].traceId === traceId) return this.traces[i];
    }
    return undefined;
  }
}
