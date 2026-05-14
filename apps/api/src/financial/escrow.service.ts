import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database';
import { AccountService } from './account.service';
import { FinancialAuditService } from './financial-audit.service';
import {
  ESCROW_CONDITION_TYPE,
  ESCROW_RELEASE_STATUS,
  FINANCIAL_AUDIT_ACTIONS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from './financial.constants';
import { LedgerService } from './ledger.service';
import { PaymentGatewayService } from './payment-gateway.service';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private readonly highValueThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountService,
    private readonly ledger: LedgerService,
    private readonly gateway: PaymentGatewayService,
    private readonly audit: FinancialAuditService,
    private readonly config: ConfigService,
  ) {
    this.highValueThreshold = this.config.get<number>('HIGH_VALUE_THRESHOLD_USD') ?? 10000;
  }

  // ─── Deposit ─────────────────────────────────────────────────────────────────

  /** Initiates a payment request against an escrow account. */
  async initiateDeposit(params: {
    escrowAccountId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    initiatedBy: string;
    idempotencyKey?: string;
    ipAddress?: string;
  }) {
    const account = await this.accounts.getAccountById(params.escrowAccountId);
    if (account.accountType !== 'escrow') {
      throw new BadRequestException('Target account is not an escrow account');
    }

    if (params.amount >= this.highValueThreshold) {
      await this.audit.log({
        actorId: params.initiatedBy,
        action: FINANCIAL_AUDIT_ACTIONS.HIGH_VALUE_FLAGGED,
        resourceType: 'escrow_account',
        resourceId: params.escrowAccountId,
        amount: params.amount,
        currency: params.currency,
        ipAddress: params.ipAddress,
      });
    }

    const result = await this.gateway.initiateCharge({
      accountId: params.escrowAccountId,
      amount: params.amount,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      initiatedBy: params.initiatedBy,
      idempotencyKey: params.idempotencyKey,
    });

    await this.audit.log({
      actorId: params.initiatedBy,
      action: FINANCIAL_AUDIT_ACTIONS.DEPOSIT_INITIATED,
      resourceType: 'payment_request',
      resourceId: result.paymentRequestId,
      amount: params.amount,
      currency: params.currency,
      ipAddress: params.ipAddress,
    });

    return result;
  }

  /** Confirms a deposit from gateway webhook and posts the ledger entry. */
  async confirmDeposit(params: {
    paymentRequestId: string;
    gatewayReference?: string;
    gatewayStatus: string;
    confirmedBy: string;
    ipAddress?: string;
  }) {
    // Generate admin-manual reference if none supplied (admin manual confirmation)
    const gatewayReference =
      params.gatewayReference ?? `admin-manual-${Date.now()}-${params.paymentRequestId}`;

    // Idempotency check
    const existing = await this.gateway.findByGatewayReference(gatewayReference);
    if (existing && existing.status === PAYMENT_STATUS.COMPLETED) {
      return existing;
    }

    const paymentRequest = await this.prisma.paymentRequest.findUnique({
      where: { id: params.paymentRequestId },
    });
    if (!paymentRequest) throw new NotFoundException('Payment request not found');
    if (paymentRequest.status === PAYMENT_STATUS.COMPLETED) return paymentRequest;

    const platformAccount = await this.accounts.getPlatformAccount();

    await this.ledger.recordEscrowDeposit({
      buyerAccountId: platformAccount.id,
      escrowAccountId: paymentRequest.accountId,
      amount: Number(paymentRequest.amount),
      currency: paymentRequest.currency,
      saleId: paymentRequest.accountId,
      initiatedBy: params.confirmedBy,
    });

    const confirmed = await this.gateway.confirmPayment(
      params.paymentRequestId,
      gatewayReference,
      params.gatewayStatus,
    );

    await this.audit.log({
      actorId: params.confirmedBy,
      action: FINANCIAL_AUDIT_ACTIONS.DEPOSIT_CONFIRMED,
      resourceType: 'payment_request',
      resourceId: params.paymentRequestId,
      amount: Number(paymentRequest.amount),
      currency: paymentRequest.currency,
      ipAddress: params.ipAddress,
    });

    return confirmed;
  }

  // ─── Release ──────────────────────────────────────────────────────────────────

  /** Requests an escrow release (buyer or admin). */
  async requestRelease(params: {
    escrowAccountId: string;
    releaseAmount: number;
    currency: string;
    destinationAccountId: string;
    reason?: string;
    requestedBy: string;
    mfaVerified?: boolean;
    ipAddress?: string;
  }) {
    const account = await this.accounts.getAccountById(params.escrowAccountId);
    if (account.accountType !== 'escrow') {
      throw new BadRequestException('Source account is not an escrow account');
    }

    // Verify sufficient balance
    const balance = await this.accounts.computeBalance(params.escrowAccountId);
    if (balance < params.releaseAmount) {
      throw new BadRequestException(
        `Insufficient escrow balance: ${balance} < ${params.releaseAmount}`,
      );
    }

    const release = await this.prisma.escrowRelease.create({
      data: {
        escrowAccountId: params.escrowAccountId,
        releaseAmount: params.releaseAmount,
        currency: params.currency,
        destinationAccountId: params.destinationAccountId,
        reason: params.reason,
        status: ESCROW_RELEASE_STATUS.PENDING,
        requestedBy: params.requestedBy,
        mfaVerified: params.mfaVerified ?? false,
      },
    });

    await this.audit.log({
      actorId: params.requestedBy,
      action: FINANCIAL_AUDIT_ACTIONS.ESCROW_RELEASE_REQUESTED,
      resourceType: 'escrow_release',
      resourceId: release.id,
      amount: params.releaseAmount,
      currency: params.currency,
      ipAddress: params.ipAddress,
    });

    return release;
  }

  /** Buyer approves their own release request. */
  async buyerApproveRelease(releaseId: string, buyerId: string, ipAddress?: string) {
    const release = await this.prisma.escrowRelease.findUnique({ where: { id: releaseId } });
    if (!release) throw new NotFoundException('Escrow release not found');
    if (release.requestedBy !== buyerId) {
      throw new ForbiddenException('Only the requesting buyer can approve this release');
    }
    if (release.status !== ESCROW_RELEASE_STATUS.PENDING) {
      throw new ConflictException(`Release is already in status: ${release.status}`);
    }

    const updated = await this.prisma.escrowRelease.update({
      where: { id: releaseId },
      data: { buyerApprovedAt: new Date(), status: ESCROW_RELEASE_STATUS.BUYER_APPROVED },
    });

    await this.audit.log({
      actorId: buyerId,
      action: FINANCIAL_AUDIT_ACTIONS.ESCROW_RELEASE_BUYER_APPROVED,
      resourceType: 'escrow_release',
      resourceId: releaseId,
      ipAddress,
    });

    return updated;
  }

  /** Admin final approval — executes the release and posts ledger entry. */
  async adminApproveRelease(releaseId: string, adminId: string, ipAddress?: string) {
    const release = await this.prisma.escrowRelease.findUnique({ where: { id: releaseId } });
    if (!release) throw new NotFoundException('Escrow release not found');
    if (release.status === ESCROW_RELEASE_STATUS.RELEASED) {
      throw new ConflictException('Release already executed');
    }
    if (release.status !== ESCROW_RELEASE_STATUS.BUYER_APPROVED) {
      throw new ConflictException(`Release requires buyer approval first (status: ${release.status})`);
    }

    // Post the double-entry ledger record
    await this.ledger.recordEscrowRelease({
      escrowAccountId: release.escrowAccountId,
      destinationAccountId: release.destinationAccountId,
      amount: Number(release.releaseAmount),
      currency: release.currency,
      releaseId: release.id,
      approvedBy: adminId,
    });

    const updated = await this.prisma.escrowRelease.update({
      where: { id: releaseId },
      data: {
        adminApprovedAt: new Date(),
        adminApproverId: adminId,
        releasedAt: new Date(),
        status: ESCROW_RELEASE_STATUS.RELEASED,
      },
    });

    await this.audit.log({
      actorId: adminId,
      action: FINANCIAL_AUDIT_ACTIONS.ESCROW_RELEASED,
      resourceType: 'escrow_release',
      resourceId: releaseId,
      amount: Number(release.releaseAmount),
      currency: release.currency,
      ipAddress,
    });

    return updated;
  }

  /** Rejects a release request. */
  async rejectRelease(releaseId: string, adminId: string, rejectionReason: string, ipAddress?: string) {
    const release = await this.prisma.escrowRelease.findUnique({ where: { id: releaseId } });
    if (!release) throw new NotFoundException('Escrow release not found');
    if (release.status === ESCROW_RELEASE_STATUS.RELEASED) {
      throw new ConflictException('Cannot reject a release that has already been executed');
    }

    const updated = await this.prisma.escrowRelease.update({
      where: { id: releaseId },
      data: { status: ESCROW_RELEASE_STATUS.REJECTED, rejectionReason },
    });

    await this.audit.log({
      actorId: adminId,
      action: FINANCIAL_AUDIT_ACTIONS.ESCROW_RELEASE_REJECTED,
      resourceType: 'escrow_release',
      resourceId: releaseId,
      metadata: { rejectionReason },
      ipAddress,
    });

    return updated;
  }

  // ─── Queries ──────────────────────────────────────────────────────────────────

  async getEscrowSummary(escrowAccountId: string) {
    const [account, balance, pendingReleases, recentTransactions, pendingDeposits] = await Promise.all([
      this.accounts.getAccountById(escrowAccountId),
      this.accounts.computeBalance(escrowAccountId),
      this.prisma.escrowRelease.findMany({
        where: {
          escrowAccountId,
          status: { in: [ESCROW_RELEASE_STATUS.PENDING, ESCROW_RELEASE_STATUS.BUYER_APPROVED] },
        },
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.ledgerEntry.findMany({
        where: {
          OR: [
            { debitAccountId: escrowAccountId },
            { creditAccountId: escrowAccountId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.paymentRequest.findMany({
        where: {
          accountId: escrowAccountId,
          status: { in: ['pending', 'processing'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    return { account, balance, pendingReleases, recentTransactions, pendingDeposits };
  }

  /** Gets the summary for a sale's escrow account (creates one if it doesn't exist). */
  async getSummaryBySaleId(saleId: string, currency = 'ZAR') {
    const account = await this.accounts.getOrCreateEscrowAccount(saleId, currency);
    return this.getEscrowSummary(account.id);
  }

  async getRelease(releaseId: string) {
    const release = await this.prisma.escrowRelease.findUnique({ where: { id: releaseId } });
    if (!release) throw new NotFoundException('Escrow release not found');
    return release;
  }

  /** Lists release requests, optionally filtered by status (admin use). */
  async listReleases(status?: string) {
    return this.prisma.escrowRelease.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: 'desc' },
      take: 100,
    });
  }

  /** Lists all pending payment requests across all escrow accounts (admin use). */
  async getAllPendingDeposits() {
    return this.prisma.paymentRequest.findMany({
      where: { status: { in: ['pending', 'processing'] } },
      orderBy: { createdAt: 'desc' },
      include: { account: { select: { id: true, referenceId: true, currency: true } } },
    });
  }

  /** Returns all escrow accounts for a company (or platform-level escrow accounts
   *  whose company_id is null) with live balances and recent ledger entries. */
  async getCompanyEscrowAccounts(companyId: string) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: {
        accountType: 'escrow',
        OR: [{ companyId }, { companyId: null }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      accounts.map(async (acc) => {
        const [balance, recentTransactions] = await Promise.all([
          this.accounts.computeBalance(acc.id),
          this.prisma.ledgerEntry.findMany({
            where: {
              OR: [{ debitAccountId: acc.id }, { creditAccountId: acc.id }],
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              id: true,
              entryType: true,
              amount: true,
              currency: true,
              description: true,
              createdAt: true,
              debitAccountId: true,
              creditAccountId: true,
            },
          }),
        ]);
        return { ...acc, balance, recentTransactions };
      }),
    );
  }
}
