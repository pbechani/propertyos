import { AiObservabilityService } from './ai-observability.service';

describe('AiObservabilityService', () => {
  let service: AiObservabilityService;

  beforeEach(() => {
    service = new AiObservabilityService();
  });

  // ── Trace lifecycle ───────────────────────────────────────────────────────

  describe('trace lifecycle', () => {
    it('returns a string traceId from startTrace', () => {
      const id = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'c1',
        inputSummary: 'q',
      });
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('endTrace sets status to success', () => {
      const id = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listToday',
        companyId: 'c1',
        inputSummary: 'q',
      });
      service.endTrace(id, { outputSummary: '3 tasks found' });
      const trace = service.getRecentTraces({ limit: 1 })[0];
      expect(trace.status).toBe('success');
      expect(trace.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('endTrace accumulates cost from output tokens', () => {
      const id = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'c1',
        inputSummary: 'q',
      });
      service.endTrace(id, { outputSummary: 'x'.repeat(400) });
      const trace = service.getRecentTraces({ limit: 1 })[0];
      expect(trace.estimatedCostUsd).toBeGreaterThan(0);
    });

    it('failTrace sets status to failed with error', () => {
      const id = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'c1',
        inputSummary: 'q',
      });
      service.failTrace(id, 'Prisma connection error');
      const trace = service.getRecentTraces({ limit: 1 })[0];
      expect(trace.status).toBe('failed');
      expect(trace.error).toContain('Prisma');
    });

    it('endTrace does not throw for unknown traceId', () => {
      expect(() => service.endTrace('nope', {})).not.toThrow();
    });

    it('failTrace does not throw for unknown traceId', () => {
      expect(() => service.failTrace('nope', 'err')).not.toThrow();
    });
  });

  // ── getRecentTraces ───────────────────────────────────────────────────────

  describe('getRecentTraces', () => {
    beforeEach(() => {
      const id1 = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'c1',
        inputSummary: 'q',
      });
      service.endTrace(id1, {});
      const id2 = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listToday',
        companyId: 'c2',
        inputSummary: 'q',
      });
      service.endTrace(id2, {});
    });

    it('limits results to the requested count', () => {
      expect(service.getRecentTraces({ limit: 1 })).toHaveLength(1);
    });

    it('filters by companyId', () => {
      const results = service.getRecentTraces({ companyId: 'c1' });
      expect(results.every((t) => t.companyId === 'c1')).toBe(true);
    });

    it('filters by status', () => {
      const fid = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'c1',
        inputSummary: 'q',
      });
      service.failTrace(fid, 'timeout');
      const failed = service.getRecentTraces({ status: 'failed' });
      expect(failed.every((t) => t.status === 'failed')).toBe(true);
    });
  });

  // ── getMetrics / ObservabilityReport ──────────────────────────────────────

  describe('getMetrics returns ObservabilityReport', () => {
    beforeEach(() => {
      const id1 = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'c1',
        inputSummary: 'show overdue tasks this week',
      });
      service.endTrace(id1, { outputSummary: '5 overdue tasks found' });

      const id2 = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listToday',
        companyId: 'c1',
        inputSummary: 'q',
      });
      service.failTrace(id2, 'db error');
    });

    it('has required top-level fields', () => {
      const r = service.getMetrics();
      expect(r).toHaveProperty('generatedAt');
      expect(r).toHaveProperty('totalTraces');
      expect(r).toHaveProperty('successRate');
      expect(r).toHaveProperty('avgDurationMs');
      expect(r).toHaveProperty('totalEstimatedCostUsd');
      expect(r).toHaveProperty('agentMetrics');
      expect(r).toHaveProperty('recentTraces');
    });

    it('totalTraces counts both successes and failures', () => {
      expect(service.getMetrics().totalTraces).toBeGreaterThanOrEqual(2);
    });

    it('filters recentTraces by companyId', () => {
      const oid = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'other',
        inputSummary: 'q',
      });
      service.endTrace(oid, {});
      const r = service.getMetrics('c1');
      expect(r.recentTraces.every((t) => t.companyId === 'c1')).toBe(true);
    });

    it('totalEstimatedCostUsd is greater than 0', () => {
      expect(service.getMetrics().totalEstimatedCostUsd).toBeGreaterThan(0);
    });

    it('agentMetrics contains TaskAgent entry', () => {
      const r = service.getMetrics();
      const m = r.agentMetrics.find((x) => x.agentName === 'TaskAgent');
      expect(m).toBeDefined();
      expect(m!.totalCalls).toBeGreaterThanOrEqual(1);
    });

    it('p95DurationMs >= avgDurationMs per agent', () => {
      for (const m of service.getMetrics().agentMetrics) {
        expect(m.p95DurationMs).toBeGreaterThanOrEqual(m.avgDurationMs);
      }
    });
  });

  // ── Buffer cap ────────────────────────────────────────────────────────────

  it('does not exceed 500-trace buffer cap', () => {
    for (let i = 0; i < 520; i++) {
      const id = service.startTrace({
        agentName: 'TaskAgent',
        action: 'listOverdue',
        companyId: 'c',
        inputSummary: 'q',
      });
      service.endTrace(id, {});
    }
    // Access private traces array to verify cap
    const internal: unknown[] = (service as any).traces;
    expect(internal.length).toBeLessThanOrEqual(500);
  });
});
