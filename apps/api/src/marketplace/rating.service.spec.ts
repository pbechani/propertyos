import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RatingService } from './rating.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { PrismaService as DatabaseService } from '../database';

const mockPrisma = {
  marketplaceRating: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  contractorProfile: {
    updateMany: jest.fn(),
  },
  supplierProfile: {
    updateMany: jest.fn(),
  },
};

const mockAudit = { log: jest.fn() };

describe('RatingService', () => {
  let service: RatingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        { provide: DatabaseService, useValue: mockPrisma },
        { provide: MarketplaceAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a rating and recalculates contractor reputation', async () => {
      const fakeRating = {
        id: 'r-1',
        raterId: 'user-1',
        ratedEntityId: 'contractor-1',
        entityType: 'contractor',
        overallScore: 4.5,
      };
      mockPrisma.marketplaceRating.create.mockResolvedValue(fakeRating);
      mockPrisma.marketplaceRating.aggregate.mockResolvedValue({
        _avg: { overallScore: 4.5 },
      });
      mockPrisma.contractorProfile.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.create(
        {
          ratedEntityId: 'contractor-1',
          entityType: 'contractor',
          overallScore: 4.5,
        },
        'user-1',
      );

      expect(result).toEqual(fakeRating);
      expect(mockPrisma.contractorProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'contractor-1' },
          data: { reputationScore: 4.5 },
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'rating.submitted' }),
      );
    });

    it('creates a rating and recalculates supplier reputation', async () => {
      const fakeRating = {
        id: 'r-2',
        raterId: 'user-2',
        ratedEntityId: 'supplier-1',
        entityType: 'supplier',
        overallScore: 3.8,
      };
      mockPrisma.marketplaceRating.create.mockResolvedValue(fakeRating);
      mockPrisma.marketplaceRating.aggregate.mockResolvedValue({
        _avg: { overallScore: 3.8 },
      });
      mockPrisma.supplierProfile.updateMany.mockResolvedValue({ count: 1 });

      await service.create(
        { ratedEntityId: 'supplier-1', entityType: 'supplier', overallScore: 3.8 },
        'user-2',
      );

      expect(mockPrisma.supplierProfile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'supplier-1' } }),
      );
    });

    it('throws BadRequestException when rater and rated entity are the same', async () => {
      await expect(
        service.create(
          { ratedEntityId: 'user-1', entityType: 'contractor', overallScore: 5 },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.marketplaceRating.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEntity', () => {
    it('returns paginated published ratings for an entity', async () => {
      mockPrisma.marketplaceRating.findMany.mockResolvedValue([{ id: 'r-1' }]);
      mockPrisma.marketplaceRating.count.mockResolvedValue(1);

      const result = await service.findByEntity('entity-1', 'contractor');
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('returns empty results when no ratings exist', async () => {
      mockPrisma.marketplaceRating.findMany.mockResolvedValue([]);
      mockPrisma.marketplaceRating.count.mockResolvedValue(0);

      const result = await service.findByEntity('entity-2', 'supplier');
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });
});
