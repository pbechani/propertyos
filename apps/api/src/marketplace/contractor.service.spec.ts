import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ContractorService } from './contractor.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { PrismaService as DatabaseService } from '../database';

const mockPrisma = {
  contractorProfile: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  contractorPortfolioItem: {
    create: jest.fn(),
  },
};

const mockAudit = { log: jest.fn() };

describe('ContractorService', () => {
  let service: ContractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorService,
        { provide: DatabaseService, useValue: mockPrisma },
        { provide: MarketplaceAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ContractorService>(ContractorService);
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    it('creates a contractor profile successfully', async () => {
      mockPrisma.contractorProfile.findFirst.mockResolvedValue(null);
      const fakeProfile = { id: 'profile-1', businessName: 'Test Co' };
      mockPrisma.contractorProfile.create.mockResolvedValue(fakeProfile);

      const result = await service.createProfile(
        { userId: 'user-1', businessName: 'Test Co' },
        'user-1',
      );

      expect(result).toEqual(fakeProfile);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'contractor.profile.created' }),
      );
    });

    it('throws ConflictException when profile already exists', async () => {
      mockPrisma.contractorProfile.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createProfile({ userId: 'user-1' }, 'user-1'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.contractorProfile.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns a profile with portfolio', async () => {
      const fakeProfile = { id: 'profile-1', portfolio: [] };
      mockPrisma.contractorProfile.findUnique.mockResolvedValue(fakeProfile);

      const result = await service.findById('profile-1');
      expect(result).toEqual(fakeProfile);
    });

    it('throws NotFoundException when profile does not exist', async () => {
      mockPrisma.contractorProfile.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates a profile successfully', async () => {
      const existing = { id: 'p1', businessName: 'Old', specializations: [] };
      mockPrisma.contractorProfile.findUnique.mockResolvedValue(existing);
      const updated = { ...existing, businessName: 'New' };
      mockPrisma.contractorProfile.update.mockResolvedValue(updated);

      const result = await service.updateProfile(
        'p1',
        { businessName: 'New' },
        'user-1',
      );
      expect(result.businessName).toBe('New');
    });

    it('throws NotFoundException when profile does not exist', async () => {
      mockPrisma.contractorProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.updateProfile('bad-id', {}, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addPortfolioItem', () => {
    it('adds a portfolio item successfully', async () => {
      mockPrisma.contractorProfile.findUnique.mockResolvedValue({ id: 'p1' });
      const fakeItem = { id: 'item-1', projectTitle: 'Bridge Work' };
      mockPrisma.contractorPortfolioItem.create.mockResolvedValue(fakeItem);

      const result = await service.addPortfolioItem(
        'p1',
        { projectTitle: 'Bridge Work' },
        'user-1',
      );
      expect(result).toEqual(fakeItem);
    });

    it('throws NotFoundException when contractor profile not found', async () => {
      mockPrisma.contractorProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.addPortfolioItem('bad', { projectTitle: 'X' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
