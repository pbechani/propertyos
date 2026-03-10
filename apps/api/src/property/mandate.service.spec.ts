import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
    brokerage_id: null,
    mandate_type: 'sole',
    status: 'pending',
    commission_rate: '5',
    commission_vat_inclusive: false,
    start_date: new Date('2026-06-01'),
    end_date: new Date('2026-12-01'),
    auto_renewal: false,
    terms_document_url: null,
    cancellation_reason: null,
    created_at: new Date(),
    signed_by_agent_at: null,
    signed_by_seller_at: null,
    seller_name: null,
    seller_email: null,
    seller_phone: null,
    seller_is_platform_user: true,
    agreement_document_url: null,
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

  describe('markSellerSignedOffline', () => {
    const offlineSellerMandate = {
      ...baseMandate,
      status: 'pending_signature',
      seller_is_platform_user: false,
      seller_name: 'John Smith',
    };
    const dto = { documentUrl: 'https://storage.example.com/signed-agreement.pdf' };

    it('records offline seller signature and activates when agent already signed', async () => {
      const agentSignedMandate = { ...offlineSellerMandate, signed_by_agent_at: new Date() };
      const afterSellerSign = { ...agentSignedMandate, signed_by_seller_at: new Date(), agreement_document_url: dto.documentUrl };
      const activated = { ...afterSellerSign, status: 'active' };

      mockPrisma.$queryRaw.mockResolvedValueOnce([agentSignedMandate]); // findMandateOrThrow
      mockPrisma.$queryRaw.mockResolvedValueOnce([afterSellerSign]);     // UPDATE signed_by_seller_at
      mockPrisma.$queryRaw.mockResolvedValueOnce([activated]);           // UPDATE status active

      const result = await service.markSellerSignedOffline(propertyId, mandateId, dto, agentId);

      expect(result).toMatchObject({ status: 'active', agreement_document_url: dto.documentUrl });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'mandate.seller_signed_offline' }),
      );
    });

    it('records offline seller signature (does not activate if agent has not yet signed)', async () => {
      const afterSellerSign = { ...offlineSellerMandate, signed_by_seller_at: new Date(), agreement_document_url: dto.documentUrl };

      mockPrisma.$queryRaw.mockResolvedValueOnce([offlineSellerMandate]); // findMandateOrThrow
      mockPrisma.$queryRaw.mockResolvedValueOnce([afterSellerSign]);       // UPDATE signed_by_seller_at — agent not signed, no activation

      const result = await service.markSellerSignedOffline(propertyId, mandateId, dto, agentId);

      expect(result).toMatchObject({ status: 'pending_signature', agreement_document_url: dto.documentUrl });
    });

    it('throws BadRequestException if seller is a platform user', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...offlineSellerMandate, seller_is_platform_user: true }]);

      await expect(
        service.markSellerSignedOffline(propertyId, mandateId, dto, agentId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if seller has already signed', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{
        ...offlineSellerMandate,
        signed_by_seller_at: new Date(),
      }]);

      await expect(
        service.markSellerSignedOffline(propertyId, mandateId, dto, agentId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException if caller is not the mandate agent', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([offlineSellerMandate]); // agent_id !== differentAgentId

      await expect(
        service.markSellerSignedOffline(propertyId, mandateId, dto, 'different-agent-id'),
      ).rejects.toThrow(ForbiddenException);
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
