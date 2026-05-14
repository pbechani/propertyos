// ─────────────────────────────────────────────────────────────────────────────
// Sprint 05 — LedgerService Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { LedgerService } from './ledger.service';
import { ExchangeRateService } from './exchange-rate.service';
import { PrismaService } from '../database';

describe('LedgerService', () => {
  let service: LedgerService;
  let module: TestingModule;

  const debitAccId = 'debit-acc-0001';
  const creditAccId = 'credit-acc-0001';

  const baseEntry = {
    id: 'entry-uuid-0001',
    entryReference: 'ESCROW_DEPOSIT-entry-uuid-0001',
    entryType: 'escrow_deposit',
    debitAccountId: debitAccId,
    creditAccountId: creditAccId,
    amount: 500,
    currency: 'USD',
    exchangeRate: 1,
    baseCurrencyAmount: 500,
    status: 'completed',
    createdAt: new Date(),
  };

  const mockFx = { getRate: jest.fn().mockResolvedValue(1) };
  const mockPrisma = {
    ledgerEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: ExchangeRateService, useValue: mockFx },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(LedgerService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── post ───────────────────────────────────────────────────────────────────

  describe('post', () => {
    it('creates a ledger entry with exchange rate applied', async () => {
      mockFx.getRate.mockResolvedValue(18.5);
      mockPrisma.ledgerEntry.create.mockResolvedValue(baseEntry);
      await service.post({
        entryType: 'escrow_deposit',
        debitAccountId: debitAccId,
        creditAccountId: creditAccId,
        amount: 100,
        currency: 'USD',
        initiatedBy: 'user-001',
      });
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entryType: 'escrow_deposit',
            amount: 100,
            exchangeRate: 18.5,
            baseCurrencyAmount: 1850,
            status: 'completed',
          }),
        }),
      );
    });

    it('uses idempotency key when provided', async () => {
      mockFx.getRate.mockResolvedValue(1);
      mockPrisma.ledgerEntry.create.mockResolvedValue(baseEntry);
      await service.post({
        entryType: 'escrow_deposit',
        debitAccountId: debitAccId,
        creditAccountId: creditAccId,
        amount: 100,
        currency: 'USD',
        idempotencyKey: 'unique-key-001',
      });
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ idempotencyKey: 'unique-key-001' }),
        }),
      );
    });
  });

  // ── recordEscrowDeposit ────────────────────────────────────────────────────

  describe('recordEscrowDeposit', () => {
    it('posts an escrow_deposit entry', async () => {
      mockFx.getRate.mockResolvedValue(1);
      mockPrisma.ledgerEntry.create.mockResolvedValue(baseEntry);
      await service.recordEscrowDeposit({
        buyerAccountId: debitAccId,
        escrowAccountId: creditAccId,
        amount: 500,
        currency: 'USD',
        saleId: 'sale-001',
        initiatedBy: 'user-001',
      });
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ entryType: 'escrow_deposit' }),
        }),
      );
    });
  });

  // ── listForAccount ─────────────────────────────────────────────────────────

  describe('listForAccount', () => {
    it('returns ledger entries for an account', async () => {
      mockPrisma.ledgerEntry.findMany.mockResolvedValue([baseEntry]);
      const result = await service.listForAccount(debitAccId, 10, 0);
      expect(mockPrisma.ledgerEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 0 }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
