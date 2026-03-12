// ─────────────────────────────────────────────────────────────────────────────
// Sprint 05 — EscrowService Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EscrowService } from './escrow.service';
import { AccountService } from './account.service';
import { LedgerService } from './ledger.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { FinancialAuditService } from './financial-audit.service';
import { PrismaService } from '../database';

describe('EscrowService', () => {
  let service: EscrowService;
  let module: TestingModule;

  const escrowAccId = 'escrow-acc-0001';
  const destAccId = 'dest-acc-0001';
  const buyerId = 'buyer-uuid-0001';
  const adminId = 'admin-uuid-0001';
  const releaseId = 'release-uuid-0001';
  const paymentReqId = 'payreq-uuid-0001';

  const baseEscrowAccount = { id: escrowAccId, accountType: 'escrow', currency: 'USD', status: 'active' };
  const baseRelease = {
    id: releaseId,
    escrowAccountId: escrowAccId,
    releaseAmount: 500,
    currency: 'USD',
    destinationAccountId: destAccId,
    status: 'pending',
    requestedBy: buyerId,
    requestedAt: new Date(),
    mfaVerified: false,
    buyerApprovedAt: null,
    adminApprovedAt: null,
    releasedAt: null,
  };

  const mockConfig = { get: jest.fn().mockReturnValue(10000) };
  const mockAccounts = {
    getAccountById: jest.fn(),
    computeBalance: jest.fn(),
    getPlatformAccount: jest.fn(),
  };
  const mockLedger = { recordEscrowDeposit: jest.fn(), recordEscrowRelease: jest.fn() };
  const mockGateway = {
    initiateCharge: jest.fn(),
    confirmPayment: jest.fn(),
    findByGatewayReference: jest.fn(),
  };
  const mockAudit = { log: jest.fn() };
  const mockPrisma = {
    paymentRequest: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    escrowRelease: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    financialAccount: { findMany: jest.fn() },
    ledgerEntry: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AccountService, useValue: mockAccounts },
        { provide: LedgerService, useValue: mockLedger },
        { provide: PaymentGatewayService, useValue: mockGateway },
        { provide: FinancialAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(EscrowService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── initiateDeposit ────────────────────────────────────────────────────────

  describe('initiateDeposit', () => {
    it('initiates a deposit to an escrow account', async () => {
      mockAccounts.getAccountById.mockResolvedValue(baseEscrowAccount);
      mockGateway.initiateCharge.mockResolvedValue({ paymentRequestId: paymentReqId });
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.initiateDeposit({
        escrowAccountId: escrowAccId,
        amount: 500,
        currency: 'USD',
        paymentMethod: 'stripe',
        initiatedBy: buyerId,
      });

      expect(result.paymentRequestId).toBe(paymentReqId);
      expect(mockGateway.initiateCharge).toHaveBeenCalled();
    });

    it('throws BadRequestException if target is not an escrow account', async () => {
      mockAccounts.getAccountById.mockResolvedValue({ ...baseEscrowAccount, accountType: 'buyer_wallet' });
      await expect(
        service.initiateDeposit({ escrowAccountId: escrowAccId, amount: 500, currency: 'USD', paymentMethod: 'stripe', initiatedBy: buyerId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('logs a high-value flag when amount exceeds threshold', async () => {
      mockAccounts.getAccountById.mockResolvedValue(baseEscrowAccount);
      mockGateway.initiateCharge.mockResolvedValue({ paymentRequestId: paymentReqId });
      mockAudit.log.mockResolvedValue(undefined);

      await service.initiateDeposit({
        escrowAccountId: escrowAccId,
        amount: 15000,
        currency: 'USD',
        paymentMethod: 'stripe',
        initiatedBy: buyerId,
      });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'high_value.flagged' }),
      );
    });
  });

  // ── requestRelease ─────────────────────────────────────────────────────────

  describe('requestRelease', () => {
    it('creates a pending release request', async () => {
      mockAccounts.getAccountById.mockResolvedValue(baseEscrowAccount);
      mockAccounts.computeBalance.mockResolvedValue(1000);
      mockPrisma.escrowRelease.create.mockResolvedValue(baseRelease);
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.requestRelease({
        escrowAccountId: escrowAccId,
        releaseAmount: 500,
        currency: 'USD',
        destinationAccountId: destAccId,
        requestedBy: buyerId,
      });

      expect(result.status).toBe('pending');
    });

    it('throws BadRequestException when balance is insufficient', async () => {
      mockAccounts.getAccountById.mockResolvedValue(baseEscrowAccount);
      mockAccounts.computeBalance.mockResolvedValue(100);
      await expect(
        service.requestRelease({
          escrowAccountId: escrowAccId,
          releaseAmount: 500,
          currency: 'USD',
          destinationAccountId: destAccId,
          requestedBy: buyerId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── buyerApproveRelease ────────────────────────────────────────────────────

  describe('buyerApproveRelease', () => {
    it('buyer approves their own release request', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue(baseRelease);
      mockPrisma.escrowRelease.update.mockResolvedValue({
        ...baseRelease,
        status: 'buyer_approved',
        buyerApprovedAt: new Date(),
      });
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.buyerApproveRelease(releaseId, buyerId);
      expect(result.status).toBe('buyer_approved');
    });

    it('throws ForbiddenException when a different buyer tries to approve', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue(baseRelease);
      await expect(service.buyerApproveRelease(releaseId, 'other-buyer')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when release not found', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue(null);
      await expect(service.buyerApproveRelease(releaseId, buyerId)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when release is not in pending status', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue({
        ...baseRelease,
        status: 'released',
      });
      await expect(service.buyerApproveRelease(releaseId, buyerId)).rejects.toThrow(ConflictException);
    });
  });

  // ── adminApproveRelease ────────────────────────────────────────────────────

  describe('adminApproveRelease', () => {
    it('executes the release and posts ledger entry', async () => {
      const buyerApprovedRelease = { ...baseRelease, status: 'buyer_approved', buyerApprovedAt: new Date() };
      mockPrisma.escrowRelease.findUnique.mockResolvedValue(buyerApprovedRelease);
      mockLedger.recordEscrowRelease.mockResolvedValue({});
      mockPrisma.escrowRelease.update.mockResolvedValue({ ...buyerApprovedRelease, status: 'released', releasedAt: new Date() });
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.adminApproveRelease(releaseId, adminId);
      expect(result.status).toBe('released');
      expect(mockLedger.recordEscrowRelease).toHaveBeenCalled();
    });

    it('throws ConflictException when release already executed', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue({ ...baseRelease, status: 'released' });
      await expect(service.adminApproveRelease(releaseId, adminId)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when buyer has not approved yet', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue({ ...baseRelease, status: 'pending' });
      await expect(service.adminApproveRelease(releaseId, adminId)).rejects.toThrow(ConflictException);
    });
  });

  // ── rejectRelease ──────────────────────────────────────────────────────────

  describe('rejectRelease', () => {
    it('rejects a pending release', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue(baseRelease);
      mockPrisma.escrowRelease.update.mockResolvedValue({ ...baseRelease, status: 'rejected', rejectionReason: 'fraud' });
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.rejectRelease(releaseId, adminId, 'fraud');
      expect(result.status).toBe('rejected');
    });

    it('throws ConflictException when release is already executed', async () => {
      mockPrisma.escrowRelease.findUnique.mockResolvedValue({ ...baseRelease, status: 'released' });
      await expect(service.rejectRelease(releaseId, adminId, 'reason')).rejects.toThrow(ConflictException);
    });
  });

  // ── confirmDeposit ─────────────────────────────────────────────────────────

  describe('confirmDeposit', () => {
    const basePaymentRequest = {
      id: paymentReqId,
      accountId: escrowAccId,
      amount: 500,
      currency: 'USD',
      status: 'pending',
    };
    const platformAcc = { id: 'platform-acc-001' };

    it('confirms a deposit with an explicit gatewayReference', async () => {
      mockGateway.findByGatewayReference.mockResolvedValue(null);
      mockPrisma.paymentRequest.findUnique.mockResolvedValue(basePaymentRequest);
      mockAccounts.getPlatformAccount.mockResolvedValue(platformAcc);
      mockLedger.recordEscrowDeposit.mockResolvedValue({});
      mockGateway.confirmPayment.mockResolvedValue({ ...basePaymentRequest, status: 'completed' });
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.confirmDeposit({
        paymentRequestId: paymentReqId,
        gatewayReference: 'gw-ref-123',
        gatewayStatus: 'admin_confirmed',
        confirmedBy: adminId,
      });

      expect(result.status).toBe('completed');
      expect(mockGateway.confirmPayment).toHaveBeenCalledWith(
        paymentReqId,
        'gw-ref-123',
        'admin_confirmed',
      );
    });

    it('generates an admin-manual reference when gatewayReference is omitted', async () => {
      mockGateway.findByGatewayReference.mockResolvedValue(null);
      mockPrisma.paymentRequest.findUnique.mockResolvedValue(basePaymentRequest);
      mockAccounts.getPlatformAccount.mockResolvedValue(platformAcc);
      mockLedger.recordEscrowDeposit.mockResolvedValue({});
      mockGateway.confirmPayment.mockResolvedValue({ ...basePaymentRequest, status: 'completed' });
      mockAudit.log.mockResolvedValue(undefined);

      await service.confirmDeposit({
        paymentRequestId: paymentReqId,
        gatewayStatus: 'admin_confirmed',
        confirmedBy: adminId,
      });

      expect(mockGateway.confirmPayment).toHaveBeenCalledWith(
        paymentReqId,
        expect.stringMatching(/^admin-manual-\d+-/),
        'admin_confirmed',
      );
    });

    it('returns early when deposit is already completed (idempotency)', async () => {
      const completed = { ...basePaymentRequest, status: 'completed' };
      mockGateway.findByGatewayReference.mockResolvedValue(completed);

      const result = await service.confirmDeposit({
        paymentRequestId: paymentReqId,
        gatewayReference: 'gw-ref-123',
        gatewayStatus: 'admin_confirmed',
        confirmedBy: adminId,
      });

      expect(result.status).toBe('completed');
      expect(mockGateway.confirmPayment).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when payment request does not exist', async () => {
      mockGateway.findByGatewayReference.mockResolvedValue(null);
      mockPrisma.paymentRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmDeposit({
          paymentRequestId: 'non-existent',
          gatewayStatus: 'admin_confirmed',
          confirmedBy: adminId,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getAllPendingDeposits ────────────────────────────────────────────────────

  describe('getAllPendingDeposits', () => {
    const pendingDeposit = {
      id: paymentReqId,
      amount: 1000,
      currency: 'ZAR',
      status: 'pending',
      createdAt: new Date(),
      account: { id: escrowAccId, referenceId: null, currency: 'ZAR' },
    };

    it('returns all pending deposits', async () => {
      mockPrisma.paymentRequest.findMany.mockResolvedValue([pendingDeposit]);

      const result = await service.getAllPendingDeposits();

      expect(mockPrisma.paymentRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['pending', 'processing'] } },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(paymentReqId);
    });

    it('returns an empty array when no pending deposits exist', async () => {
      mockPrisma.paymentRequest.findMany.mockResolvedValue([]);
      const result = await service.getAllPendingDeposits();
      expect(result).toEqual([]);
    });
  });

  // ── getCompanyEscrowAccounts ────────────────────────────────────────────────

  describe('getCompanyEscrowAccounts', () => {
    const companyId = 'company-uuid-0001';
    const baseAccount = {
      id: escrowAccId,
      accountNumber: 'ESC-0001',
      accountType: 'escrow',
      ownerId: null,
      referenceId: null,
      companyId,
      currency: 'ZAR',
      status: 'active',
      createdAt: new Date(),
    };

    it('returns accounts with balance and recent transactions', async () => {
      mockPrisma.financialAccount.findMany.mockResolvedValue([baseAccount]);
      mockAccounts.computeBalance.mockResolvedValue(5000);
      mockPrisma.ledgerEntry.findMany.mockResolvedValue([]);

      const result = await service.getCompanyEscrowAccounts(companyId);

      expect(mockPrisma.financialAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountType: 'escrow',
            OR: [{ companyId }, { companyId: null }],
          },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe(5000);
      expect(result[0].recentTransactions).toEqual([]);
    });

    it('returns empty array when company has no escrow accounts', async () => {
      mockPrisma.financialAccount.findMany.mockResolvedValue([]);
      const result = await service.getCompanyEscrowAccounts(companyId);
      expect(result).toEqual([]);
    });

    it('fetches up to 10 recent ledger entries per account', async () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        entryType: 'escrow_deposit',
        amount: 100,
        currency: 'ZAR',
        description: null,
        createdAt: new Date(),
        debitAccountId: 'platform-acc',
        creditAccountId: escrowAccId,
      }));
      mockPrisma.financialAccount.findMany.mockResolvedValue([baseAccount]);
      mockAccounts.computeBalance.mockResolvedValue(1000);
      mockPrisma.ledgerEntry.findMany.mockResolvedValue(entries);

      const result = await service.getCompanyEscrowAccounts(companyId);

      expect(mockPrisma.ledgerEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
      expect(result[0].recentTransactions).toHaveLength(10);
    });
  });
});
