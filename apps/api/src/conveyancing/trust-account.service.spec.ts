import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TrustAccountService } from './trust-account.service';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { PrismaService } from '../database';

describe('TrustAccountService', () => {
  let service: TrustAccountService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };

  const FIRM_ID = 'firm-uuid-0001';
  const CASE_ID = 'case-uuid-0001';
  const ACTOR_ID = 'actor-uuid-0001';
  const ACCOUNT_ID = 'account-uuid-0001';

  const baseTrustAccount = {
    id: ACCOUNT_ID,
    firm_id: FIRM_ID,
    account_name: 'Main Trust ZAR',
    bank_name: 'Standard Bank',
    currency: 'ZAR',
    status: 'active',
    created_at: new Date(),
    balance: '500000',
  };

  const baseEntry = {
    id: 'entry-uuid-0001',
    trust_account_id: ACCOUNT_ID,
    case_id: CASE_ID,
    entry_type: 'deposit',
    description: 'Buyer deposit',
    amount: '100000',
    currency: 'ZAR',
    direction: 'credit',
    reference: 'REF-001',
    received_from: 'Buyer',
    paid_to: null,
    payment_date: new Date(),
    recorded_by: ACTOR_ID,
    approved_by: null,
    idempotency_key: null,
    created_at: new Date(),
  };

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        TrustAccountService,
        { provide: ConveyancingAuditService, useValue: mockAudit },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TrustAccountService>(TrustAccountService);
    jest.resetAllMocks();
  });

  afterAll(() => module.close());

  // ── getTrustAccount ────────────────────────────────────────────────────────

  describe('getTrustAccount()', () => {
    it('should return trust account with balance', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([baseTrustAccount]);

      const result = await service.getTrustAccount(FIRM_ID, 'ZAR');

      expect(result.id).toBe(ACCOUNT_ID);
      expect(result.balance).toBe('500000');
    });

    it('should throw NotFoundException when no trust account for firm', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await expect(service.getTrustAccount('unknown-firm', 'ZAR')).rejects.toThrow(NotFoundException);
    });
  });

  // ── recordEntry ────────────────────────────────────────────────────────────

  describe('recordEntry()', () => {
    const dto = {
      entryType: 'deposit' as const,
      description: 'Buyer deposit',
      amount: 100000,
      direction: 'credit' as const,
      paymentDate: '2026-03-11',
      receivedFrom: 'Buyer',
    };

    it('should record a credit entry successfully', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseTrustAccount])  // getTrustAccount (no idempotency key in dto)
        .mockResolvedValueOnce([baseEntry]);         // INSERT RETURNING

      const result = await service.recordEntry(ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, dto);

      expect(result.direction).toBe('credit');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'trust_ledger.entry_recorded' }),
      );
    });

    it('should throw BadRequestException for debit exceeding balance', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ ...baseTrustAccount, balance: '0' }]) // getTrustAccount
        .mockResolvedValueOnce([{ balance: '0' }]);                      // balance check

      await expect(
        service.recordEntry(ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, {
          ...dto,
          direction: 'debit',
          amount: 50000,
          paidTo: 'Seller',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid direction', async () => {
      await expect(
        service.recordEntry(ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, {
          ...dto,
          direction: 'sideways' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getLedger ──────────────────────────────────────────────────────────────

  describe('getLedger()', () => {
    it('should return entries with computed balance', async () => {
      const entries = [
        { ...baseEntry, direction: 'credit', amount: '100000' },
        { ...baseEntry, id: 'entry-uuid-0002', direction: 'debit', amount: '5000' },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(entries);

      const result = await service.getLedger(CASE_ID, FIRM_ID);

      expect(result.entries).toHaveLength(2);
      expect(result.balance).toBe(95000);
    });

    it('should return zero balance when no entries', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getLedger(CASE_ID, FIRM_ID);

      expect(result.balance).toBe(0);
    });
  });
});
