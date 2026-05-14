import { AgentMemoryService } from './agent-memory.service';

describe('AgentMemoryService', () => {
  let service: AgentMemoryService;

  beforeEach(() => {
    service = new AgentMemoryService();
  });

  // ── Short-term memory ────────────────────────────────────────────────────

  describe('short-term memory', () => {
    it('stores and retrieves a value', () => {
      service.storeShortTerm('AgentA', 'company-1', 'key', { foo: 'bar' });
      expect(service.getShortTerm('AgentA', 'company-1', 'key')).toEqual({ foo: 'bar' });
    });

    it('returns null for unknown key', () => {
      expect(service.getShortTerm('AgentA', 'company-1', 'nonexistent')).toBeNull();
    });

    it('returns null for expired entry', () => {
      service.storeShortTerm('AgentA', 'company-1', 'expiring', 'value', -1); // already expired
      expect(service.getShortTerm('AgentA', 'company-1', 'expiring')).toBeNull();
    });

    it('clears session entries without affecting other agents', () => {
      service.storeShortTerm('AgentA', 'company-1', 'k1', 'v1');
      service.storeShortTerm('AgentB', 'company-1', 'k2', 'v2');
      service.clearShortTermSession('AgentA', 'company-1');
      expect(service.getShortTerm('AgentA', 'company-1', 'k1')).toBeNull();
      expect(service.getShortTerm('AgentB', 'company-1', 'k2')).toBe('v2');
    });

    it('evicts expired entries via purgeExpiredShortTerm', () => {
      service.storeShortTerm('AgentA', 'company-1', 'stale', 'val', -1);
      service.storeShortTerm('AgentA', 'company-1', 'fresh', 'val', 60_000);
      const evicted = service.purgeExpiredShortTerm();
      expect(evicted).toBe(1);
      expect(service.getShortTerm('AgentA', 'company-1', 'fresh')).toBe('val');
    });
  });

  // ── Long-term memory ─────────────────────────────────────────────────────

  describe('long-term memory', () => {
    it('stores and retrieves a long-term value', () => {
      service.storeLongTerm('AgentA', 'company-1', 'pref', { theme: 'dark' });
      expect(service.getLongTerm<{ theme: string }>('AgentA', 'company-1', 'pref')).toEqual({ theme: 'dark' });
    });

    it('returns null for unknown long-term key', () => {
      expect(service.getLongTerm('AgentA', 'company-1', 'nope')).toBeNull();
    });

    it('updates existing long-term entry preserving createdAt', () => {
      service.storeLongTerm('AgentA', 'company-1', 'k', 'v1');
      const first = service.getLongTerm('AgentA', 'company-1', 'k');
      service.storeLongTerm('AgentA', 'company-1', 'k', 'v2');
      expect(service.getLongTerm('AgentA', 'company-1', 'k')).toBe('v2');
      expect(first).toBe('v1');
    });

    it('deletes a long-term entry', () => {
      service.storeLongTerm('AgentA', 'company-1', 'del', 'x');
      expect(service.deleteLongTerm('AgentA', 'company-1', 'del')).toBe(true);
      expect(service.getLongTerm('AgentA', 'company-1', 'del')).toBeNull();
    });
  });

  // ── Reasoning buffer ─────────────────────────────────────────────────────

  describe('reasoning buffer', () => {
    it('records reasoning steps', () => {
      service.addReasoningStep('AgentA', 'company-1', {
        query: 'show hot leads',
        intent: 'leads_hot',
        outcome: 'success',
        summary: 'Found 5 hot leads',
      });
      const history = service.getReasoningHistory('AgentA', 'company-1');
      expect(history).toHaveLength(1);
      expect(history[0].intent).toBe('leads_hot');
      expect(history[0].stepId).toBeDefined();
    });

    it('caps history at the limit parameter', () => {
      for (let i = 0; i < 15; i++) {
        service.addReasoningStep('AgentA', 'company-1', {
          query: `q${i}`,
          intent: `intent${i}`,
          outcome: 'success',
          summary: `step ${i}`,
        });
      }
      const history = service.getReasoningHistory('AgentA', 'company-1', 5);
      expect(history).toHaveLength(5);
    });
  });

  // ── Snapshot ─────────────────────────────────────────────────────────────

  describe('snapshot', () => {
    it('returns accurate key counts', () => {
      service.storeShortTerm('AgentA', 'company-1', 's1', 1);
      service.storeShortTerm('AgentA', 'company-1', 's2', 2);
      service.storeLongTerm('AgentA', 'company-1', 'l1', 3);
      const snap = service.getSnapshot('AgentA', 'company-1');
      expect(snap.shortTermCount).toBe(2);
      expect(snap.longTermCount).toBe(1);
      expect(snap.shortTermKeys).toContain('s1');
      expect(snap.longTermKeys).toContain('l1');
    });
  });

  // ── Store sizes ───────────────────────────────────────────────────────────

  it('reports correct store sizes', () => {
    service.storeShortTerm('X', 'c', 'k', 1);
    service.storeLongTerm('X', 'c', 'k', 2);
    service.addReasoningStep('X', 'c', { query: 'q', intent: 'i', outcome: 'success', summary: 's' });
    const sizes = service.getStoreSizes();
    expect(sizes.shortTerm).toBe(1);
    expect(sizes.longTerm).toBe(1);
    expect(sizes.reasoningSteps).toBe(1);
  });
});
