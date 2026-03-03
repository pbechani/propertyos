import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesAuditService } from './sales-audit.service';
import { PrismaService } from '../database';

describe('SalesService', () => {
  let service: SalesService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRaw: jest.fn(),
  };
  const mockAudit = { log: jest.fn() };

  const agentId = 'agent-uuid-0001';
  const sellerId = 'seller-uuid-0001';
  const buyerId = 'buyer-uuid-0001';
  const propertyId = 'prop-uuid-0001';
  const saleId = 'sale-uuid-0001';

  const baseSale = {
    id: saleId,
    property_id: propertyId,
    sale_reference: 'SALE-20260302-ABCD',
    seller_id: sellerId,
    buyer_id: buyerId,
    agent_id: agentId,
    buyer_conveyancer_id: null,
    seller_conveyancer_id: null,
    agreed_price: '500000',
    currency: 'ZAR',
    deposit_amount: null,
    status: 'active',
    current_stage: 1,
    country: 'ZA',
    company_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SalesAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(SalesService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── initiateSale ───────────────────────────────────────

  describe('initiateSale', () => {
    const dto = {
      propertyId,
      sellerId,
      agreedPrice: 500000,
      currency: 'ZAR',
    };

    it('creates a sale and initialises 14 stage rows', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId, agent_id: agentId }]) // property check
        .mockResolvedValueOnce([baseSale]);                               // INSERT sale
      mockPrisma.$executeRaw.mockResolvedValue(1);                        // generate_series insert

      const result = await service.initiateSale(agentId, ['agent'], dto);

      expect(result).toEqual(baseSale);
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'sale.initiated' }),
      );
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.initiateSale(agentId, ['agent'], dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when agent does not own the listing', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: propertyId, agent_id: 'other-agent' }]);

      await expect(service.initiateSale(agentId, ['agent'], dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('admin can initiate sale for any listing', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId, agent_id: 'other-agent' }])
        .mockResolvedValueOnce([baseSale]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      const result = await service.initiateSale('admin-uuid', ['admin'], dto);
      expect(result).toEqual(baseSale);
    });
  });

  // ─── getSale ────────────────────────────────────────────

  describe('getSale', () => {
    it('returns sale with stages for a participant', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseSale])  // findSaleOrThrow
        .mockResolvedValueOnce([{ stage_number: 1, status: 'in_progress' }]); // stages

      const result = await service.getSale(saleId, agentId, ['agent']) as any;

      expect(result.id).toBe(saleId);
      expect(result.stages).toBeDefined();
    });

    it('throws ForbiddenException for a non-participant', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseSale]);

      await expect(service.getSale(saleId, 'stranger-uuid', ['buyer'])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException for unknown sale', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.getSale(saleId, agentId, ['agent'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── cancelSale ─────────────────────────────────────────

  describe('cancelSale', () => {
    it('cancels an active sale', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseSale])
        .mockResolvedValueOnce([{ ...baseSale, status: 'cancelled' }]);

      const result = await service.cancelSale(saleId, agentId, ['agent']) as any;
      expect(result.status).toBe('cancelled');
    });

    it('throws ConflictException for completed sale', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...baseSale, status: 'completed' }]);

      await expect(service.cancelSale(saleId, agentId, ['agent'])).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ForbiddenException for buyer role', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseSale]);

      await expect(service.cancelSale(saleId, buyerId, ['buyer'])).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── assignConveyancer ──────────────────────────────────

  describe('assignConveyancer', () => {
    const convDto = { buyerConveyancerId: 'conv-uuid-0001' };

    it('assigns a buyer conveyancer', async () => {
      const updatedSale = { ...baseSale, buyer_conveyancer_id: convDto.buyerConveyancerId };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseSale])
        .mockResolvedValueOnce([updatedSale]);

      const result = await service.assignConveyancer(saleId, agentId, ['agent'], convDto) as any;
      expect(result.buyer_conveyancer_id).toBe(convDto.buyerConveyancerId);
    });
  });

  // ─── assertParticipant ──────────────────────────────────

  describe('assertParticipant', () => {
    it('allows admin through regardless of participation', () => {
      expect(() =>
        service.assertParticipant(baseSale, 'random-uuid', ['admin']),
      ).not.toThrow();
    });

    it('throws ForbiddenException for non-participant', () => {
      expect(() =>
        service.assertParticipant(baseSale, 'stranger-uuid', ['buyer']),
      ).toThrow(ForbiddenException);
    });

    it('allows sale parties through', () => {
      expect(() =>
        service.assertParticipant(baseSale, agentId, ['agent']),
      ).not.toThrow();
    });
  });
});
