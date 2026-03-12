import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database';
import { ExchangeRateService } from './exchange-rate.service';
import { LEDGER_ENTRY } from './financial.constants';

export interface DoubleEntryParams {
  entryType: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
  initiatedBy?: string;
  approvedBy?: string;
  idempotencyKey?: string;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fx: ExchangeRateService,
  ) {}

  /** Posts a double-entry ledger record. Returns the created entry. */
  async post(params: DoubleEntryParams) {
    const exchangeRate = await this.fx.getRate(params.currency, 'USD');
    const baseCurrencyAmount = parseFloat((params.amount * exchangeRate).toFixed(8));
    const entryReference = `${params.entryType.toUpperCase()}-${randomUUID()}`;

    return this.prisma.ledgerEntry.create({
      data: {
        entryReference,
        entryType: params.entryType,
        debitAccountId: params.debitAccountId,
        creditAccountId: params.creditAccountId,
        amount: params.amount,
        currency: params.currency,
        exchangeRate,
        baseCurrencyAmount,
        description: params.description,
        metadata: params.metadata ? (params.metadata as object) : undefined,
        initiatedBy: params.initiatedBy,
        approvedBy: params.approvedBy,
        status: 'completed',
        idempotencyKey: params.idempotencyKey,
      },
    });
  }

  /** Records an escrow deposit: buyer wallet → escrow account. */
  async recordEscrowDeposit(params: {
    buyerAccountId: string;
    escrowAccountId: string;
    amount: number;
    currency: string;
    saleId: string;
    initiatedBy: string;
    idempotencyKey?: string;
  }) {
    return this.post({
      entryType: LEDGER_ENTRY.ESCROW_DEPOSIT,
      debitAccountId: params.buyerAccountId,
      creditAccountId: params.escrowAccountId,
      amount: params.amount,
      currency: params.currency,
      description: `Escrow deposit for sale ${params.saleId}`,
      metadata: { saleId: params.saleId },
      initiatedBy: params.initiatedBy,
      idempotencyKey: params.idempotencyKey,
    });
  }

  /** Records an escrow release: escrow account → destination (e.g. seller). */
  async recordEscrowRelease(params: {
    escrowAccountId: string;
    destinationAccountId: string;
    amount: number;
    currency: string;
    releaseId: string;
    approvedBy: string;
  }) {
    return this.post({
      entryType: LEDGER_ENTRY.ESCROW_RELEASE,
      debitAccountId: params.escrowAccountId,
      creditAccountId: params.destinationAccountId,
      amount: params.amount,
      currency: params.currency,
      description: `Escrow release ${params.releaseId}`,
      metadata: { releaseId: params.releaseId },
      approvedBy: params.approvedBy,
    });
  }

  /** Records a commission credit to an agent account. */
  async recordCommission(params: {
    platformAccountId: string;
    agentAccountId: string;
    amount: number;
    currency: string;
    saleId: string;
    initiatedBy: string;
  }) {
    return this.post({
      entryType: LEDGER_ENTRY.COMMISSION_CREDIT,
      debitAccountId: params.platformAccountId,
      creditAccountId: params.agentAccountId,
      amount: params.amount,
      currency: params.currency,
      description: `Commission for sale ${params.saleId}`,
      metadata: { saleId: params.saleId },
      initiatedBy: params.initiatedBy,
    });
  }

  /** Lists ledger entries for an account (paginated). */
  async listForAccount(accountId: string, limit = 20, offset = 0) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        OR: [{ debitAccountId: accountId }, { creditAccountId: accountId }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
