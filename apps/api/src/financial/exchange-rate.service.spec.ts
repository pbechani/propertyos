// ─────────────────────────────────────────────────────────────────────────────
// Sprint 05 — ExchangeRateService Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExchangeRateService } from './exchange-rate.service';
import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;
  let module: TestingModule;

  const mockRedis = { getJson: jest.fn(), setJson: jest.fn() };
  const mockPrisma = { exchangeRateSnapshot: { create: jest.fn() } };
  const mockConfig = { get: jest.fn() };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ExchangeRateService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: RedisService, useValue: mockRedis },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ExchangeRateService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getRate', () => {
    it('returns 1 when from === to', async () => {
      const rate = await service.getRate('USD', 'USD');
      expect(rate).toBe(1);
      expect(mockRedis.getJson).not.toHaveBeenCalled();
    });

    it('returns cached rate when available', async () => {
      mockRedis.getJson.mockResolvedValue({ rate: 18.5 });
      const rate = await service.getRate('USD', 'ZAR');
      expect(rate).toBe(18.5);
      expect(mockRedis.setJson).not.toHaveBeenCalled();
    });

    it('fetches from OER when cache is empty and persists snapshot', async () => {
      mockConfig.get.mockReturnValue('test-app-id');
      mockRedis.getJson.mockResolvedValue(null);
      mockPrisma.exchangeRateSnapshot.create.mockResolvedValue({});

      // Mock global fetch
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ rates: { ZAR: 18.5 } }),
      });
      global.fetch = mockFetch as any;

      const rate = await service.getRate('USD', 'ZAR');
      expect(rate).toBe(18.5);
      expect(mockRedis.setJson).toHaveBeenCalledWith(
        'fx_rate:USD:ZAR',
        { rate: 18.5 },
        3600,
      );
      expect(mockPrisma.exchangeRateSnapshot.create).toHaveBeenCalled();
    });

    it('falls back to 1 when OER key is not configured', async () => {
      mockConfig.get.mockReturnValue('');
      mockRedis.getJson.mockResolvedValue(null);
      const rate = await service.getRate('USD', 'ZAR');
      expect(rate).toBe(1);
    });

    it('falls back to 1 when OER fetch fails', async () => {
      mockConfig.get.mockReturnValue('test-app-id');
      mockRedis.getJson.mockResolvedValue(null);
      global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as any;
      mockPrisma.exchangeRateSnapshot.create.mockResolvedValue({});
      const rate = await service.getRate('USD', 'ZAR');
      expect(rate).toBe(1);
    });
  });

  describe('convert', () => {
    it('converts amount using exchange rate', async () => {
      jest.spyOn(service, 'getRate').mockResolvedValue(18.5);
      const result = await service.convert(100, 'USD', 'ZAR');
      expect(result).toBe(1850);
    });
  });
});
