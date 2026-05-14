import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { MindsDBService } from './mindsdb.service';

// ─────────────────────────────────────────────────────────────────────────────
// MindsDB Service — Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_URL = 'http://localhost:47334';

/** Build a module with MindsDBService + a mock ConfigService */
async function createService(
  overrides: Record<string, unknown> = {},
): Promise<MindsDBService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      MindsDBService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, def?: unknown) =>
            ({ MINDSDB_URL: MOCK_URL, MINDSDB_TIMEOUT_MS: 5000, ...overrides })[key] ?? def,
        },
      },
    ],
  }).compile();

  const svc = module.get<MindsDBService>(MindsDBService);
  // Bypass onModuleInit in unit tests
  (svc as any).available = true;
  return svc;
}

/** Stub the private #query method to return controlled data */
function stubQuery(svc: MindsDBService, rows: Record<string, unknown>[]): jest.SpyInstance {
  return jest.spyOn(svc as any, 'query').mockResolvedValue(rows);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('MindsDBService', () => {
  afterEach(() => jest.restoreAllMocks());

  // ── predictPropertyValue ──────────────────────────────────────────────────

  describe('predictPropertyValue', () => {
    const baseParams = {
      propertyType: 'house',
      bedrooms: 3,
      bathrooms: 2,
      floorAreaSqm: 120,
      latitude: -26.2041,
      longitude: 28.0473,
    };

    it('returns predicted price and confidence on success', async () => {
      const svc = await createService();
      stubQuery(svc, [
        {
          asking_price: 1_500_000,
          asking_price_explain: JSON.stringify({ confidence: 0.87 }),
        },
      ]);

      const result = await svc.predictPropertyValue(baseParams);
      expect(result.predictedPrice).toBe(1_500_000);
      expect(result.confidence).toBeCloseTo(0.87);
    });

    it('returns confidence 0 when explain JSON is malformed', async () => {
      const svc = await createService();
      stubQuery(svc, [
        { asking_price: 900_000, asking_price_explain: 'not-json' },
      ]);

      const result = await svc.predictPropertyValue(baseParams);
      expect(result.confidence).toBe(0);
    });

    it('throws ServiceUnavailableException when MindsDB returns empty rows', async () => {
      const svc = await createService();
      stubQuery(svc, []);

      await expect(svc.predictPropertyValue(baseParams)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws on invalid propertyType containing SQL injection characters', async () => {
      const svc = await createService();
      const spy = stubQuery(svc, []);

      await expect(
        svc.predictPropertyValue({ ...baseParams, propertyType: "house'; DROP TABLE listings;--" }),
      ).rejects.toThrow(/disallowed characters/i);
      expect(spy).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailableException when service is not available', async () => {
      const svc = await createService();
      (svc as any).available = false;

      await expect(svc.predictPropertyValue(baseParams)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  // ── scoreContractorRisk ───────────────────────────────────────────────────

  describe('scoreContractorRisk', () => {
    const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

    it('returns riskLevel and confidence on success', async () => {
      const svc = await createService();
      stubQuery(svc, [
        {
          risk_level: 'low',
          risk_level_explain: JSON.stringify({ confidence: 0.92 }),
        },
      ]);

      const result = await svc.scoreContractorRisk(VALID_UUID);
      expect(result.riskLevel).toBe('low');
      expect(result.confidence).toBeCloseTo(0.92);
    });

    it('defaults to medium when risk_level is an unknown value', async () => {
      const svc = await createService();
      stubQuery(svc, [
        { risk_level: 'unknown_level', risk_level_explain: '{}' },
      ]);

      const result = await svc.scoreContractorRisk(VALID_UUID);
      expect(result.riskLevel).toBe('medium');
    });

    it('throws on invalid UUID', async () => {
      const svc = await createService();
      const spy = stubQuery(svc, []);

      await expect(svc.scoreContractorRisk('not-a-uuid')).rejects.toThrow(/UUID/i);
      expect(spy).not.toHaveBeenCalled();
    });

    it('throws ServiceUnavailableException when no rows returned', async () => {
      const svc = await createService();
      stubQuery(svc, []);

      await expect(svc.scoreContractorRisk(VALID_UUID)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  // ── forecastMaterialPrice ─────────────────────────────────────────────────

  describe('forecastMaterialPrice', () => {
    const MAT_ID = '550e8400-e29b-41d4-a716-446655440001';

    it('returns an array of forecast rows', async () => {
      const svc = await createService();
      stubQuery(svc, [
        { recorded_at: '2026-03-10T00:00:00Z', unit_price: 250.5 },
        { recorded_at: '2026-03-11T00:00:00Z', unit_price: 252.0 },
      ]);

      const rows = await svc.forecastMaterialPrice(MAT_ID, 'Gauteng');
      expect(rows).toHaveLength(2);
      expect(rows[0].unitPrice).toBe(250.5);
      expect(rows[1].recordedAt).toBe('2026-03-11T00:00:00Z');
    });

    it('returns empty array when no forecast rows exist', async () => {
      const svc = await createService();
      stubQuery(svc, []);

      const rows = await svc.forecastMaterialPrice(MAT_ID, 'Western Cape');
      expect(rows).toHaveLength(0);
    });

    it('throws on invalid UUID materialId', async () => {
      const svc = await createService();
      const spy = stubQuery(svc, []);

      await expect(
        svc.forecastMaterialPrice('bad-id', 'Gauteng'),
      ).rejects.toThrow(/UUID/i);
      expect(spy).not.toHaveBeenCalled();
    });

    it('throws on region containing SQL injection characters', async () => {
      const svc = await createService();
      const spy = stubQuery(svc, []);

      await expect(
        svc.forecastMaterialPrice(MAT_ID, "Gauteng' OR '1'='1"),
      ).rejects.toThrow(/disallowed characters/i);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── predictProjectDelay ───────────────────────────────────────────────────

  describe('predictProjectDelay', () => {
    const PROJ_ID = '550e8400-e29b-41d4-a716-446655440002';

    it('returns delayed=true with confidence', async () => {
      const svc = await createService();
      stubQuery(svc, [
        { delayed: 1, delayed_explain: JSON.stringify({ confidence: 0.78 }) },
      ]);

      const result = await svc.predictProjectDelay(PROJ_ID);
      expect(result.delayed).toBe(true);
      expect(result.confidence).toBeCloseTo(0.78);
    });

    it('returns delayed=false when model predicts 0', async () => {
      const svc = await createService();
      stubQuery(svc, [{ delayed: 0, delayed_explain: '{}' }]);

      const result = await svc.predictProjectDelay(PROJ_ID);
      expect(result.delayed).toBe(false);
    });

    it('throws ServiceUnavailableException when no rows returned', async () => {
      const svc = await createService();
      stubQuery(svc, []);

      await expect(svc.predictProjectDelay(PROJ_ID)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws on invalid UUID', async () => {
      const svc = await createService();
      const spy = stubQuery(svc, []);

      await expect(svc.predictProjectDelay('not-a-uuid')).rejects.toThrow(/UUID/i);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── isAvailable / availability guard ─────────────────────────────────────

  describe('availability', () => {
    it('isAvailable() returns true after successful init', async () => {
      const svc = await createService();
      (svc as any).available = true;
      expect(svc.isAvailable()).toBe(true);
    });

    it('isAvailable() returns false before init completes', async () => {
      const svc = await createService();
      (svc as any).available = false;
      expect(svc.isAvailable()).toBe(false);
    });
  });
});
