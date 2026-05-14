import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database';
import { AccountService } from './account.service';
import { FinancialAuditService } from './financial-audit.service';
import {
  FINANCIAL_AUDIT_ACTIONS,
  PLATFORM_COMMISSION_ACCOUNT,
  PLATFORM_FEE_ACCOUNT,
} from './financial.constants';
import { LedgerService } from './ledger.service';

export interface CommissionBreakdown {
  saleAmount: number;
  currency: string;
  platformFeeAmount: number;
  agentCommissionAmount: number;
  netSellerAmount: number;
  platformFeePct: number;
  agentCommissionPct: number;
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  private readonly platformPct: number;
  private readonly agentPct: number;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
    private readonly ledger: LedgerService,
    private readonly audit: FinancialAuditService,
  ) {
    this.platformPct = this.config.get<number>('COMMISSION_PLATFORM_PCT') ?? 1.5;
    this.agentPct = this.config.get<number>('COMMISSION_AGENT_PCT') ?? 1.0;
  }

  /** Calculates commission breakdown without writing to DB. */
  calculate(saleAmount: number, currency: string): CommissionBreakdown {
    const platformFeeAmount = parseFloat(((saleAmount * this.platformPct) / 100).toFixed(2));
    const agentCommissionAmount = parseFloat(((saleAmount * this.agentPct) / 100).toFixed(2));
    const netSellerAmount = parseFloat(
      (saleAmount - platformFeeAmount - agentCommissionAmount).toFixed(2),
    );
    return {
      saleAmount,
      currency,
      platformFeeAmount,
      agentCommissionAmount,
      netSellerAmount,
      platformFeePct: this.platformPct,
      agentCommissionPct: this.agentPct,
    };
  }

  /**
   * Settles commissions at final payment:
   *  1. Platform fee → financial.platform_fee account
   *  2. Agent commission → agent's account (if agentId provided)
   */
  async settle(params: {
    saleId: string;
    saleAmount: number;
    currency: string;
    escrowAccountId: string;
    agentId?: string;
    initiatedBy: string;
    ipAddress?: string;
  }): Promise<CommissionBreakdown> {
    const breakdown = this.calculate(params.saleAmount, params.currency);

    const [platformFeeAcc, platformCommissionAcc] = await Promise.all([
      this.accounts.getPlatformAccount(PLATFORM_FEE_ACCOUNT),
      this.accounts.getPlatformAccount(PLATFORM_COMMISSION_ACCOUNT),
    ]);

    // Debit escrow → credit platform fee
    await this.ledger.post({
      entryType: 'platform_fee',
      debitAccountId: params.escrowAccountId,
      creditAccountId: platformFeeAcc.id,
      amount: breakdown.platformFeeAmount,
      currency: params.currency,
      description: `Platform fee for sale ${params.saleId}`,
      metadata: { saleId: params.saleId },
      initiatedBy: params.initiatedBy,
    });

    // Agent commission if applicable
    if (params.agentId && breakdown.agentCommissionAmount > 0) {
      const agentAccount = await this.accounts.prismaFindOrCreateAgentWallet(params.agentId, params.currency);
      await this.ledger.recordCommission({
        platformAccountId: platformCommissionAcc.id,
        agentAccountId: agentAccount.id,
        amount: breakdown.agentCommissionAmount,
        currency: params.currency,
        saleId: params.saleId,
        initiatedBy: params.initiatedBy,
      });
    }

    await this.audit.log({
      actorId: params.initiatedBy,
      action: FINANCIAL_AUDIT_ACTIONS.COMMISSION_CALCULATED,
      resourceType: 'sale',
      resourceId: params.saleId,
      amount: breakdown.platformFeeAmount + breakdown.agentCommissionAmount,
      currency: params.currency,
      metadata: { breakdown },
      ipAddress: params.ipAddress,
    });

    return breakdown;
  }
}
