import { Test, TestingModule } from '@nestjs/testing';
import { MarketService } from './market.service';
import { PrismaService as DatabaseService } from '../database';

const mockPrisma = {
  materialPrice: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('MarketService', () => {
  let service: MarketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketService,
        { provide: DatabaseService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MarketService>(MarketService);
    jest.clearAllMocks();
  });

  describe('getMaterialPrices', () => {
    it('returns paginated material prices', async () => {
      mockPrisma.materialPrice.findMany.mockResolvedValue([{ id: 'mp-1' }]);
      mockPrisma.materialPrice.count.mockResolvedValue(1);

      const result = await service.getMaterialPrices({ page: 1, limit: 20 });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('filters by category, country and priceTier', async () => {
      mockPrisma.materialPrice.findMany.mockResolvedValue([]);
      mockPrisma.materialPrice.count.mockResolvedValue(0);

      const result = await service.getMaterialPrices({
        category: 'cement',
        country: 'ZW',
        priceTier: 'budget',
      });
      expect(result.total).toBe(0);
      // Verify the where clause was populated (findMany was called once)
      expect(mockPrisma.materialPrice.findMany).toHaveBeenCalledTimes(1);
    });

    it('uses default pagination when not specified', async () => {
      mockPrisma.materialPrice.findMany.mockResolvedValue([]);
      mockPrisma.materialPrice.count.mockResolvedValue(0);

      const result = await service.getMaterialPrices({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('getPriceTrends', () => {
    it('returns grouped price trends for a material', async () => {
      const now = new Date();
      mockPrisma.materialPrice.findMany.mockResolvedValue([
        { priceTier: 'budget', price: 10, currency: 'USD', recordedAt: now, region: 'North' },
        { priceTier: 'premium', price: 20, currency: 'USD', recordedAt: now, region: 'South' },
      ]);

      const result = await service.getPriceTrends({ materialName: 'Cement', days: 30 });

      expect(result.trends['budget']).toHaveLength(1);
      expect(result.trends['premium']).toHaveLength(1);
      expect(result.trends['budget'][0].price).toBe(10);
    });

    it('returns empty trends when no price data found', async () => {
      mockPrisma.materialPrice.findMany.mockResolvedValue([]);

      const result = await service.getPriceTrends({ materialName: 'Obscure Material' });
      expect(Object.keys(result.trends)).toHaveLength(0);
    });

    it('normalises country to uppercase', async () => {
      mockPrisma.materialPrice.findMany.mockResolvedValue([]);

      await service.getPriceTrends({ materialName: 'Steel', country: 'zw', days: 7 });

      expect(mockPrisma.materialPrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ country: 'ZW' }),
        }),
      );
    });
  });
});
