import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { PrismaService as DatabaseService } from '../database';

const mockPrisma = {
  supplierProfile: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  supplierProduct: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

const mockAudit = { log: jest.fn() };

describe('SupplierService', () => {
  let service: SupplierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        { provide: DatabaseService, useValue: mockPrisma },
        { provide: MarketplaceAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    it('creates a supplier profile successfully', async () => {
      mockPrisma.supplierProfile.findFirst.mockResolvedValue(null);
      const fakeProfile = { id: 'sp-1', businessName: 'Supplies Ltd' };
      mockPrisma.supplierProfile.create.mockResolvedValue(fakeProfile);

      const result = await service.createProfile(
        { userId: 'user-1', businessName: 'Supplies Ltd' },
        'user-1',
      );

      expect(result).toEqual(fakeProfile);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'supplier.profile.created' }),
      );
    });

    it('throws ConflictException when a profile already exists', async () => {
      mockPrisma.supplierProfile.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createProfile({ userId: 'user-1', businessName: 'Test' }, 'user-1'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.supplierProfile.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns profile with available products', async () => {
      const fakeProfile = { id: 'sp-1', products: [] };
      mockPrisma.supplierProfile.findUnique.mockResolvedValue(fakeProfile);

      const result = await service.findById('sp-1');
      expect(result).toEqual(fakeProfile);
    });

    it('throws NotFoundException when profile not found', async () => {
      mockPrisma.supplierProfile.findUnique.mockResolvedValue(null);
      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const existing = { id: 'sp-1', businessName: 'Old', deliveryAreas: [] };
      mockPrisma.supplierProfile.findUnique.mockResolvedValue(existing);
      const updated = { ...existing, businessName: 'New' };
      mockPrisma.supplierProfile.update.mockResolvedValue(updated);

      const result = await service.updateProfile('sp-1', { businessName: 'New' }, 'user-1');
      expect(result.businessName).toBe('New');
    });

    it('throws NotFoundException for unknown supplier', async () => {
      mockPrisma.supplierProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.updateProfile('bad', {}, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProduct', () => {
    it('creates a product under an existing supplier', async () => {
      mockPrisma.supplierProfile.findUnique.mockResolvedValue({ id: 'sp-1' });
      const fakeProduct = { id: 'prod-1', productName: 'Cement' };
      mockPrisma.supplierProduct.create.mockResolvedValue(fakeProduct);

      const result = await service.createProduct(
        'sp-1',
        { productName: 'Cement', category: 'materials', unitPrice: 10, unit: 'bag', currency: 'USD' },
        'user-1',
      );
      expect(result).toEqual(fakeProduct);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'supplier.product.created' }),
      );
    });

    it('throws NotFoundException when supplier not found', async () => {
      mockPrisma.supplierProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.createProduct('bad', { productName: 'X', category: 'c', unit: 'bag', unitPrice: 10, currency: 'USD' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProduct', () => {
    it('updates product successfully', async () => {
      const existing = { id: 'prod-1', productName: 'Cement', mediaUrls: [] };
      mockPrisma.supplierProduct.findUnique.mockResolvedValue(existing);
      mockPrisma.supplierProduct.update.mockResolvedValue({ ...existing, unitPrice: 15 });

      const result = await service.updateProduct('prod-1', { unitPrice: 15 }, 'user-1');
      expect(result.unitPrice).toBe(15);
    });

    it('throws NotFoundException for unknown product', async () => {
      mockPrisma.supplierProduct.findUnique.mockResolvedValue(null);
      await expect(
        service.updateProduct('bad', {}, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findProducts', () => {
    it('returns paginated products filtered by category', async () => {
      mockPrisma.supplierProduct.findMany.mockResolvedValue([{ id: 'p1' }]);
      mockPrisma.supplierProduct.count.mockResolvedValue(1);

      const result = await service.findProducts({ category: 'cement', page: 1, limit: 20 });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });
});
