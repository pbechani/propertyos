// ─────────────────────────────────────────────────────────────────────────────
// Sprint 05 — AccountService Unit Tests
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrismaService } from '../database';

describe('AccountService', () => {
  let service: AccountService;
  let module: TestingModule;

  const accountId = 'acc-uuid-0001';
  const saleId = 'sale-uuid-0001';
  const userId = 'user-uuid-0001';

  const baseAccount = {
    id: accountId,
    accountNumber: 'ESC-SALE0001-1234567890',
    accountType: 'escrow',
    ownerId: null,
    currency: 'USD',
    status: 'active',
    createdAt: new Date(),
  };

  const mockPrisma = {
    financialAccount: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    ledgerEntry: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AccountService);
  });

  afterEach(() => jest.resetAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ── createEscrowAccount ────────────────────────────────────────────────────

  describe('createEscrowAccount', () => {
    it('creates an escrow account for a sale', async () => {
      mockPrisma.financialAccount.create.mockResolvedValue(baseAccount);
      const result = await service.createEscrowAccount(saleId, 'USD');
      expect(mockPrisma.financialAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accountType: 'escrow', currency: 'USD' }),
        }),
      );
      expect(result.accountType).toBe('escrow');
    });
  });

  // ── getAccountById ─────────────────────────────────────────────────────────

  describe('getAccountById', () => {
    it('returns account when found', async () => {
      mockPrisma.financialAccount.findUnique.mockResolvedValue(baseAccount);
      const result = await service.getAccountById(accountId);
      expect(result).toEqual(baseAccount);
    });

    it('throws NotFoundException when account not found', async () => {
      mockPrisma.financialAccount.findUnique.mockResolvedValue(null);
      await expect(service.getAccountById(accountId)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getOrCreateEscrowAccount ───────────────────────────────────────────────

  describe('getOrCreateEscrowAccount', () => {
    it('returns existing escrow account without creating a new one', async () => {
      mockPrisma.financialAccount.findFirst.mockResolvedValue(baseAccount);
      const result = await service.getOrCreateEscrowAccount(saleId);
      expect(mockPrisma.financialAccount.create).not.toHaveBeenCalled();
      expect(result).toEqual(baseAccount);
    });

    it('creates a new escrow account when none exists', async () => {
      mockPrisma.financialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.financialAccount.create.mockResolvedValue(baseAccount);
      await service.getOrCreateEscrowAccount(saleId);
      expect(mockPrisma.financialAccount.create).toHaveBeenCalled();
    });
  });

  // ── computeBalance ─────────────────────────────────────────────────────────

  describe('computeBalance', () => {
    it('computes balance as credits minus debits', async () => {
      mockPrisma.ledgerEntry.aggregate
        .mockResolvedValueOnce({ _sum: { baseCurrencyAmount: '1000.00' } }) // credits
        .mockResolvedValueOnce({ _sum: { baseCurrencyAmount: '250.00' } }); // debits
      const balance = await service.computeBalance(accountId);
      expect(balance).toBe(750);
    });

    it('returns 0 when there are no transactions', async () => {
      mockPrisma.ledgerEntry.aggregate
        .mockResolvedValue({ _sum: { baseCurrencyAmount: null } });
      const balance = await service.computeBalance(accountId);
      expect(balance).toBe(0);
    });
  });
});
