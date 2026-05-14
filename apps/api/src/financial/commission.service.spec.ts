// ─────────────────────────────────────────────────────────────────────────────
// Sprint 05 — CommissionService Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CommissionService } from './commission.service';
import { AccountService } from './account.service';
import { LedgerService } from './ledger.service';
import { FinancialAuditService } from './financial-audit.service';
import { PrismaService } from '../database';

describe('CommissionService', () => {
  let service: CommissionService;
  let module: TestingModule;

  const saleId = 'sale-uuid-0001';
  const escrowAccId = 'escrow-acc-0001';
  const agentId = 'agent-uuid-0001';
  const adminId = 'admin-uuid-0001';

  const platformFeeAcc = { id: 'plat-fee-acc', accountNumber: 'PLATFORM-FEE-USD' };
  const platformCommissionAcc = { id: 'plat-comm-acc', accountNumber: 'PLATFORM-COMMISSION-USD' };
  const agentAcc = { id: 'agent-acc-0001', accountNumber: 'AW-AGENTXXX-123' };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const cfg: Record<string, number> = {
        COMMISSION_PLATFORM_PCT: 1.5,
        COMMISSION_AGENT_PCT: 1.0,
      };
      return cfg[key];
    }),
  };
  const mockAccounts = {
    getPlatformAccount: jest.fn(),
    prismaFindOrCreateAgentWallet: jest.fn(),
  };
  const mockLedger = { post: jest.fn(), recordCommission: jest.fn() };
  const mockAudit = { log: jest.fn() };
  const mockPrisma = {};

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AccountService, useValue: mockAccounts },
        { provide: LedgerService, useValue: mockLedger },
        { provide: FinancialAuditService, useValue: mockAudit },
      ],
    }).compile();
    service = module.get(CommissionService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── calculate ──────────────────────────────────────────────────────────────

  describe('calculate', () => {
    it('computes platform fee and agent commission correctly', () => {
      const result = service.calculate(100000, 'ZAR');
      expect(result.platformFeeAmount).toBe(1500); // 1.5%
      expect(result.agentCommissionAmount).toBe(1000); // 1.0%
      expect(result.netSellerAmount).toBe(97500);
    });

    it('returns correct percentages in breakdown', () => {
      const result = service.calculate(50000, 'USD');
      expect(result.platformFeePct).toBe(1.5);
      expect(result.agentCommissionPct).toBe(1.0);
    });

    it('handles zero sale amount without NaN', () => {
      const result = service.calculate(0, 'USD');
      expect(result.platformFeeAmount).toBe(0);
      expect(result.agentCommissionAmount).toBe(0);
      expect(result.netSellerAmount).toBe(0);
    });
  });

  // ── settle ─────────────────────────────────────────────────────────────────

  describe('settle', () => {
    it('deducts platform fee and agent commission from escrow', async () => {
      mockAccounts.getPlatformAccount
        .mockResolvedValueOnce(platformFeeAcc)
        .mockResolvedValueOnce(platformCommissionAcc);
      mockAccounts.prismaFindOrCreateAgentWallet.mockResolvedValue(agentAcc);
      mockLedger.post.mockResolvedValue({});
      mockLedger.recordCommission.mockResolvedValue({});
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.settle({
        saleId,
        saleAmount: 100000,
        currency: 'ZAR',
        escrowAccountId: escrowAccId,
        agentId,
        initiatedBy: adminId,
      });

      expect(mockLedger.post).toHaveBeenCalledWith(
        expect.objectContaining({ entryType: 'platform_fee', amount: 1500 }),
      );
      expect(mockLedger.recordCommission).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1000, agentAccountId: agentAcc.id }),
      );
      expect(result.netSellerAmount).toBe(97500);
    });

    it('skips agent commission when no agentId provided', async () => {
      mockAccounts.getPlatformAccount
        .mockResolvedValueOnce(platformFeeAcc)
        .mockResolvedValueOnce(platformCommissionAcc);
      mockLedger.post.mockResolvedValue({});
      mockAudit.log.mockResolvedValue(undefined);

      await service.settle({
        saleId,
        saleAmount: 100000,
        currency: 'ZAR',
        escrowAccountId: escrowAccId,
        initiatedBy: adminId,
      });

      expect(mockLedger.recordCommission).not.toHaveBeenCalled();
    });
  });
});
