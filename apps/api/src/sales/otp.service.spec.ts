// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — OTP Service Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { SalesAuditService } from './sales-audit.service';
import { PrismaService } from '../database';

describe('OtpService', () => {
  let service: OtpService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };

  const saleId = 'sale-uuid-0001';
  const otpId = 'otp-uuid-0001';
  const actorId = 'agent-uuid-0001';
  const buyerId = 'buyer-uuid-0001';
  const sellerId = 'seller-uuid-0001';

  const baseSale = { id: saleId };

  const baseOtp = {
    id: otpId,
    saleId,
    otpReference: 'OTP-20260310-A1B2',
    version: 1,
    isCounterOffer: false,
    offeredPrice: 500000,
    currency: 'ZAR',
    status: 'pending',
    buyerSignedAt: null,
    sellerSignedAt: null,
    offerValidUntil: new Date(Date.now() + 86400000), // tomorrow
    buyerId,
    sellerId,
  };

  const mockPrisma = {
    propertySale: { findUnique: jest.fn() },
    offerToPurchase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    otpNegotiation: { create: jest.fn() },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SalesAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(OtpService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── createOtp ─────────────────────────────────────────────────────────────

  describe('createOtp', () => {
    const dto = {
      offeredPrice: 500000,
      buyerId,
      sellerId,
      offerValidUntil: new Date(Date.now() + 86400000).toISOString(),
    } as any;

    it('creates an OTP for an agent', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(baseSale);
      mockPrisma.offerToPurchase.create.mockResolvedValue(baseOtp);

      const result = await service.createOtp(saleId, actorId, ['agent'], dto);

      expect(result).toEqual(baseOtp);
      expect(mockPrisma.offerToPurchase.create).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp.created' }),
      );
    });

    it('throws ForbiddenException for non-agent/admin', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(baseSale);

      await expect(
        service.createOtp(saleId, buyerId, ['buyer'], dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when sale does not exist', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(null);

      await expect(
        service.createOtp(saleId, actorId, ['agent'], dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── listVersions ──────────────────────────────────────────────────────────

  describe('listVersions', () => {
    it('returns all OTP versions for a sale', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(baseSale);
      mockPrisma.offerToPurchase.findMany.mockResolvedValue([baseOtp]);

      const result = await service.listVersions(saleId);
      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when sale not found', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(null);
      await expect(service.listVersions(saleId)).rejects.toThrow(NotFoundException);
    });
  });

  // ── signOtp ───────────────────────────────────────────────────────────────

  describe('signOtp', () => {
    it('allows buyer to sign, sets buyerSignedAt', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue(baseOtp);
      const updated = { ...baseOtp, buyerSignedAt: new Date() };
      mockPrisma.offerToPurchase.update.mockResolvedValue(updated);

      const result = await service.signOtp(saleId, otpId, buyerId, ['buyer'], {
        signatureUrl: 'https://example.com/sig.png',
      });

      expect(result.buyerSignedAt).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp.signed' }),
      );
    });

    it('accepts OTP when both parties sign', async () => {
      const partialSigned = { ...baseOtp, buyerSignedAt: new Date() };
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue(partialSigned);
      const accepted = { ...partialSigned, sellerSignedAt: new Date(), status: 'accepted' };
      mockPrisma.offerToPurchase.update.mockResolvedValue(accepted);

      const result = await service.signOtp(saleId, otpId, sellerId, ['seller'], {
        signatureUrl: 'https://example.com/sig.png',
      });

      expect(result.status).toBe('accepted');
    });

    it('rejects signing when OTP status is not pending', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue({
        ...baseOtp,
        status: 'accepted',
      });

      await expect(
        service.signOtp(saleId, otpId, buyerId, ['buyer'], {
          signatureUrl: 'https://example.com/sig.png',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects signing when OTP is expired', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue({
        ...baseOtp,
        offerValidUntil: new Date(Date.now() - 86400000), // yesterday
      });

      await expect(
        service.signOtp(saleId, otpId, buyerId, ['buyer'], {
          signatureUrl: 'https://example.com/sig.png',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException for invalid role', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue(baseOtp);

      await expect(
        service.signOtp(saleId, otpId, 'conv-id', ['conveyancer'], {
          signatureUrl: 'https://example.com/sig.png',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when OTP not found', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue(null);

      await expect(
        service.signOtp(saleId, otpId, buyerId, ['buyer'], {
          signatureUrl: 'sig',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── withdrawOtp ───────────────────────────────────────────────────────────

  describe('withdrawOtp', () => {
    it('allows buyer to withdraw pending OTP', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue(baseOtp);
      const withdrawn = { ...baseOtp, status: 'withdrawn' };
      mockPrisma.offerToPurchase.update.mockResolvedValue(withdrawn);

      const result = await service.withdrawOtp(saleId, otpId, buyerId, ['buyer'], {
        reason: 'Changed mind',
      });

      expect(result.status).toBe('withdrawn');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp.withdrawn' }),
      );
    });

    it('rejects withdrawal of non-pending OTP', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue({
        ...baseOtp,
        status: 'accepted',
      });

      await expect(
        service.withdrawOtp(saleId, otpId, buyerId, ['buyer'], { reason: 'late' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects withdrawal by seller role', async () => {
      mockPrisma.offerToPurchase.findFirst.mockResolvedValue(baseOtp);

      await expect(
        service.withdrawOtp(saleId, otpId, sellerId, ['seller'], { reason: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── compareOffers ─────────────────────────────────────────────────────────

  describe('compareOffers', () => {
    it('returns pending offers for a sale', async () => {
      mockPrisma.propertySale.findUnique.mockResolvedValue(baseSale);
      mockPrisma.offerToPurchase.findMany.mockResolvedValue([baseOtp]);

      const result = await service.compareOffers(saleId);
      expect(result).toHaveLength(1);
    });
  });
});
