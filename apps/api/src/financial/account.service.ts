import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import {
  ACCOUNT_STATUS,
  BUYER_WALLET_TYPE,
  DEFAULT_CURRENCY,
  ESCROW_ACCOUNT_TYPE,
  PLATFORM_INCOMING_ACCOUNT,
} from './financial.constants';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Creates the escrow account for a property sale. */
  async createEscrowAccount(saleId: string, currency: string = DEFAULT_CURRENCY) {
    const accountNumber = `ESC-${saleId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    return this.prisma.financialAccount.create({
      data: {
        accountNumber,
        accountType: ESCROW_ACCOUNT_TYPE,
        referenceId: saleId,
        currency,
        status: ACCOUNT_STATUS.ACTIVE,
      },
    });
  }

  /** Creates a buyer wallet for a user. */
  async createBuyerWallet(userId: string, currency: string = DEFAULT_CURRENCY) {
    const accountNumber = `BW-${userId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    return this.prisma.financialAccount.create({
      data: {
        accountNumber,
        accountType: BUYER_WALLET_TYPE,
        ownerId: userId,
        ownerType: 'user',
        currency,
        status: ACCOUNT_STATUS.ACTIVE,
      },
    });
  }

  /** Retrieves an account by ID, throwing NotFoundException if missing. */
  async getAccountById(id: string) {
    const account = await this.prisma.financialAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Financial account ${id} not found`);
    return account;
  }

  /** Retrieves an account by its account number. */
  async getAccountByNumber(accountNumber: string) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { accountNumber },
    });
    if (!account) throw new NotFoundException(`Account ${accountNumber} not found`);
    return account;
  }

  /** Gets the escrow account linked to a sale. */
  async getEscrowAccountBySaleId(saleId: string) {
    return this.prisma.financialAccount.findFirst({
      where: { referenceId: saleId, accountType: ESCROW_ACCOUNT_TYPE },
    });
  }

  /** Gets or creates the escrow account for a sale. */
  async getOrCreateEscrowAccount(saleId: string, currency: string = DEFAULT_CURRENCY) {
    const existing = await this.getEscrowAccountBySaleId(saleId);
    if (existing) return existing;
    return this.createEscrowAccount(saleId, currency);
  }

  /** Fetches the platform incoming account (seeded by migration). */
  async getPlatformAccount(accountNumber: string = PLATFORM_INCOMING_ACCOUNT) {
    return this.getAccountByNumber(accountNumber);
  }

  /** Computes the running balance for an account from the ledger. */
  async computeBalance(accountId: string): Promise<number> {
    const [credits, debits] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { creditAccountId: accountId, status: 'completed' },
        _sum: { baseCurrencyAmount: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { debitAccountId: accountId, status: 'completed' },
        _sum: { baseCurrencyAmount: true },
      }),
    ]);
    const totalCredits = Number(credits._sum.baseCurrencyAmount ?? 0);
    const totalDebits = Number(debits._sum.baseCurrencyAmount ?? 0);
    return parseFloat((totalCredits - totalDebits).toFixed(8));
  }

  /** Finds or creates an agent wallet for commission payouts. */
  async prismaFindOrCreateAgentWallet(agentId: string, currency: string = DEFAULT_CURRENCY) {
    const existing = await this.prisma.financialAccount.findFirst({
      where: { ownerId: agentId, ownerType: 'user', accountType: 'agent_wallet', currency },
    });
    if (existing) return existing;
    const accountNumber = `AW-${agentId.slice(0, 8).toUpperCase()}-${Date.now()}`;
    return this.prisma.financialAccount.create({
      data: {
        accountNumber,
        accountType: 'agent_wallet',
        ownerId: agentId,
        ownerType: 'user',
        currency,
        status: ACCOUNT_STATUS.ACTIVE,
      },
    });
  }
}
