import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MandateService } from './mandate.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('MandateService', () => {
  let service: MandateService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = { log: jest.fn() };

  const agentId = '11111111-1111-1111-1111-111111111111';
  const ownerId = '22222222-2222-2222-2222-222222222222';
  const propertyId = '33333333-3333-3333-3333-333333333333';
  const mandateId = '44444444-4444-4444-4444-444444444444';

  const baseMandate = {
    id: mandateId,
    property_id: propertyId,
    agent_id: agentId,
    owner_id: ownerId,
    mandate_type: 'exclusive',
    status: 'pending',
    commission_rate: 5,
    start_date: new Date('2026-06-01'),
    expiry_date: new Date('2026-12-01'),
    created_at: new Date(),
    updated_at: new Date(),
    agent_signed_at: null,
    owner_signed_at: null,
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        MandateService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(MandateService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('creates an open mandate (no uniqueness check needed)', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: propertyId }]); // property exists
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseMandate]);         // INSERT returns new mandate

      const result = await service.create(propertyId, agentId, {
        mandateType: 'open',
        commissionRate: 5,
        startDate: '2026-06-01',
        endDate: '2026-12-01',
      });

      expect(result).toMatchObject({ id: mandateId });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'mandate.created' }),
      );
    });

    it('throws ConflictException if an active sole mandate already exists', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: propertyId }]); // property exists
      // Existing sole active mandate
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'existing-id', mandate_type: 'sole', status: 'active' },
      ]);

      await expect(
        service.create(propertyId, agentId, {
          mandateType: 'sole',
          commissionRate: 5,
          startDate: '2026-06-01',
          endDate: '2026-12-01',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2); // property check + sole check
    });
  });

  describe('sign', () => {
    const pendingSignatureMandate = { ...baseMandate, status: 'pending_signature' };

    it('updates agent signature and activates when both parties have signed', async () => {
      // Both already signed after this update
      const afterSign = {
        ...pendingSignatureMandate,
        signed_by_agent_at: new Date(),
        signed_by_seller_at: new Date(),
      };
      mockPrisma.$queryRaw.mockResolvedValueOnce([pendingSignatureMandate]); // findMandateOrThrow
      mockPrisma.$queryRaw.mockResolvedValueOnce([afterSign]);                // UPDATE signed_by_agent_at
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...afterSign, status: 'active' }]); // UPDATE status active

      const result = await service.sign(propertyId, mandateId, 'agent', agentId, 'agent', { party: 'agent' });

      expect(result).toMatchObject({ status: 'active' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'mandate.signed' }),
      );
    });

    it('throws NotFoundException if mandate not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // not found

      await expect(
        service.sign(propertyId, mandateId, 'agent', agentId, 'agent', { party: 'agent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if mandate is not in pending_signature state', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseMandate]); // status: 'pending'

      await expect(
        service.sign(propertyId, mandateId, 'seller', ownerId, 'buyer_seller', { party: 'seller' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('cancels a mandate successfully', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseMandate]); // findMandateOrThrow
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...baseMandate, status: 'cancelled' },
      ]);

      const result = await service.cancel(propertyId, mandateId, agentId, 'agent', {
        reason: 'Owner requested cancellation',
      });

      expect(result).toMatchObject({ status: 'cancelled' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'mandate.cancelled' }),
      );
    });

    it('throws NotFoundException if mandate not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.cancel(propertyId, mandateId, agentId, 'agent', { reason: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
