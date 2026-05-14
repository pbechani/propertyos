import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { CreateTrustEntryDto } from './conveyancing.dto';
import { TRUST_DIRECTIONS } from './conveyancing.constants';

export type TrustAccountRow = {
  id: string;
  firm_id: string;
  account_name: string;
  bank_name: string | null;
  currency: string;
  status: string;
  created_at: Date;
  balance: string;
};

export type TrustEntryRow = {
  id: string;
  trust_account_id: string;
  case_id: string;
  entry_type: string;
  description: string;
  amount: string;
  currency: string;
  direction: string;
  reference: string | null;
  received_from: string | null;
  paid_to: string | null;
  payment_date: Date;
  recorded_by: string;
  approved_by: string | null;
  idempotency_key: string | null;
  created_at: Date;
};

@Injectable()
export class TrustAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ConveyancingAuditService,
  ) {}

  async getTrustAccount(firmId: string, currency = 'ZAR'): Promise<TrustAccountRow> {
    const rows = await this.prisma.$queryRaw<TrustAccountRow[]>`
      SELECT
        ta.id, ta.firm_id, ta.account_name, ta.bank_name, ta.currency, ta.status, ta.created_at,
        COALESCE(
          SUM(CASE WHEN tle.direction = 'credit' THEN tle.amount ELSE -tle.amount END), 0
        ) AS balance
      FROM conveyancing.trust_accounts ta
      LEFT JOIN conveyancing.trust_ledger_entries tle ON tle.trust_account_id = ta.id
      WHERE ta.firm_id = ${firmId}::uuid AND ta.currency = ${currency} AND ta.status = 'active'
      GROUP BY ta.id
      LIMIT 1
    `;
    if (!rows.length) throw new NotFoundException(`No active trust account for firm_id=${firmId} currency=${currency}`);
    return rows[0];
  }

  async recordEntry(
    actorId: string,
    actorRole: string,
    firmId: string,
    caseId: string,
    dto: CreateTrustEntryDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TrustEntryRow> {
    if (!TRUST_DIRECTIONS.includes(dto.direction as any)) {
      throw new BadRequestException('Invalid direction; must be credit or debit');
    }

    const account = await this.getTrustAccount(firmId, 'ZAR');

    // Idempotency check
    if (dto.idempotencyKey) {
      const dup = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM conveyancing.trust_ledger_entries
        WHERE idempotency_key = ${dto.idempotencyKey} LIMIT 1
      `;
      if (dup.length) throw new ConflictException('Duplicate idempotency key');
    }

    // Debit guard — ensure sufficient balance
    if (dto.direction === 'debit') {
      const balRow = await this.prisma.$queryRaw<{ balance: string }[]>`
        SELECT COALESCE(
          SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0
        ) AS balance
        FROM conveyancing.trust_ledger_entries
        WHERE trust_account_id = ${account.id}::uuid
      `;
      const currentBalance = parseFloat(balRow[0].balance);
      if (currentBalance < dto.amount) {
        throw new BadRequestException('Insufficient trust account balance for debit');
      }
    }

    const rows = await this.prisma.$queryRaw<TrustEntryRow[]>`
      INSERT INTO conveyancing.trust_ledger_entries
        (trust_account_id, case_id, entry_type, description, amount, currency, direction,
         reference, received_from, paid_to, payment_date, recorded_by, approved_by, idempotency_key)
      VALUES (
        ${account.id}::uuid,
        ${caseId}::uuid,
        ${dto.entryType},
        ${dto.description},
        ${dto.amount},
        'ZAR',
        ${dto.direction},
        ${dto.reference ?? null},
        ${dto.receivedFrom ?? null},
        ${dto.paidTo ?? null},
        ${dto.paymentDate}::date,
        ${actorId}::uuid,
        ${dto.approvedBy ?? null}::uuid,
        ${dto.idempotencyKey ?? null}
      )
      RETURNING *
    `;
    const entry = rows[0];

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'trust_ledger.entry_recorded',
      resourceType: 'trust_ledger_entry',
      resourceId: entry.id,
      payload: { caseId, direction: dto.direction, amount: dto.amount, entryType: dto.entryType },
      ipAddress,
      userAgent,
    });

    return entry;
  }

  async getLedger(
    caseId: string,
    firmId: string,
  ): Promise<{ entries: TrustEntryRow[]; balance: number }> {
    const entries = await this.prisma.$queryRaw<TrustEntryRow[]>`
      SELECT tle.*
      FROM conveyancing.trust_ledger_entries tle
      JOIN conveyancing.trust_accounts ta ON ta.id = tle.trust_account_id
      WHERE tle.case_id = ${caseId}::uuid AND ta.firm_id = ${firmId}::uuid
      ORDER BY tle.payment_date ASC, tle.created_at ASC
    `;

    const balance = entries.reduce((sum, e) => {
      const amt = parseFloat(e.amount as string);
      return e.direction === 'credit' ? sum + amt : sum - amt;
    }, 0);

    return { entries, balance: Math.round(balance * 100) / 100 };
  }
}
