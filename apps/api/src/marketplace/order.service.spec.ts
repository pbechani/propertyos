import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderService } from './order.service';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { PrismaService as DatabaseService } from '../database';
import { ORDER_STATUS } from './marketplace.constants';

const mockPrisma = {
  supplierProfile: {
    findUnique: jest.fn(),
  },
  marketplaceOrder: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  deliveryConfirmation: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAudit = { log: jest.fn() };

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: DatabaseService, useValue: mockPrisma },
        { provide: MarketplaceAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates an order with generated reference when supplier exists', async () => {
      mockPrisma.supplierProfile.findUnique.mockResolvedValue({ id: 'sup-1' });
      const fakeOrder = { id: 'ord-1', orderReference: 'ORD-2025-XXXXXXXX' };
      mockPrisma.marketplaceOrder.create.mockResolvedValue(fakeOrder);

      const result = await service.create(
        { supplierId: 'sup-1', totalAmount: 1000, currency: 'USD' },
        'buyer-1',
      );
      expect(result.orderReference).toMatch(/^ORD-\d{4}-/);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'order.placed' }),
      );
    });

    it('throws NotFoundException when supplier not found', async () => {
      mockPrisma.supplierProfile.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ supplierId: 'bad', totalAmount: 100, currency: 'USD' }, 'buyer-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('returns order with delivery confirmation', async () => {
      const fakeOrder = { id: 'ord-1', deliveryConfirmation: null };
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(fakeOrder);
      const result = await service.findById('ord-1');
      expect(result).toEqual(fakeOrder);
    });

    it('throws NotFoundException for unknown order', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(null);
      await expect(service.findById('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmOrder', () => {
    it('confirms a PLACED order', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: ORDER_STATUS.PLACED,
      });
      const confirmed = { id: 'ord-1', status: ORDER_STATUS.CONFIRMED };
      mockPrisma.marketplaceOrder.update.mockResolvedValue(confirmed);

      const result = await service.confirmOrder('ord-1', 'actor-1');
      expect(result.status).toBe(ORDER_STATUS.CONFIRMED);
    });

    it('throws NotFoundException for unknown order', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(null);
      await expect(service.confirmOrder('bad', 'actor-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when order is not in PLACED state', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: ORDER_STATUS.DELIVERED,
      });
      await expect(service.confirmOrder('ord-1', 'actor-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('shipOrder', () => {
    it('ships a CONFIRMED order', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: ORDER_STATUS.CONFIRMED,
      });
      const shipped = { id: 'ord-1', status: ORDER_STATUS.SHIPPED };
      mockPrisma.marketplaceOrder.update.mockResolvedValue(shipped);

      const result = await service.shipOrder('ord-1', {}, 'actor-1');
      expect(result.status).toBe(ORDER_STATUS.SHIPPED);
    });

    it('throws BadRequestException when order not confirmed or preparing', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: ORDER_STATUS.PLACED,
      });
      await expect(service.shipOrder('ord-1', {}, 'actor-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmDelivery', () => {
    it('uses a transaction to update order and create delivery confirmation', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: ORDER_STATUS.SHIPPED,
      });
      const updatedOrder = { id: 'ord-1', status: ORDER_STATUS.DELIVERED };
      mockPrisma.$transaction.mockResolvedValue([updatedOrder, {}]);

      const result = await service.confirmDelivery(
        'ord-1',
        { condition: 'good', proofPhotoUrl: 'https://example.com/photo.jpg' },
        'buyer-1',
      );
      expect(result.status).toBe(ORDER_STATUS.DELIVERED);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('throws BadRequestException when order not shipped', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: ORDER_STATUS.CONFIRMED,
      });
      await expect(
        service.confirmDelivery('ord-1', { condition: 'good' }, 'buyer-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelOrder', () => {
    it('throws NotFoundException for unknown order', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue(null);
      await expect(service.cancelOrder('bad', 'actor-1')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when order cannot be cancelled', async () => {
      mockPrisma.marketplaceOrder.findUnique.mockResolvedValue({
        id: 'ord-1',
        status: ORDER_STATUS.DELIVERED,
      });
      await expect(service.cancelOrder('ord-1', 'actor-1')).rejects.toThrow(BadRequestException);
    });
  });
});
