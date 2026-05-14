import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../database';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { CreatePortalAccessDto } from './conveyancing.dto';
import { PORTAL_TOKEN_BYTES, PORTAL_TOKEN_TTL_DAYS } from './conveyancing.constants';

export type PortalAccessRow = {
  id: string;
  case_id: string;
  user_id: string;
  party_role: string;
  token_expires_at: Date;
  last_accessed_at: Date | null;
  is_active: boolean;
  created_at: Date;
};

export interface PortalSummary {
  caseReference: string;
  status: string;
  country: string;
  openedAt: Date;
  targetRegistrationDate: Date | null;
  tasks: { title: string; status: string; due_date: Date | null; is_blocker: boolean }[];
  documents: { document_name: string; document_type: string; status: string; fully_signed_at: Date | null }[];
  ledgerBalance: number;
}

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ConveyancingAuditService,
  ) {}

  /**
   * Issue a secure portal token for a party (buyer/seller/mortgage_bank).
   * Token is generated with crypto.randomBytes, stored as SHA-256 hash.
   */
  async issuePortalToken(
    actorId: string,
    actorRole: string,
    firmId: string,
    caseId: string,
    dto: CreatePortalAccessDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ token: string; expiresAt: Date; accessId: string }> {
    // Deactivate existing access for this user on same case
    await this.prisma.$executeRaw`
      UPDATE conveyancing.client_portal_access
      SET is_active = FALSE
      WHERE case_id = ${caseId}::uuid AND user_id = ${dto.userId}::uuid AND is_active = TRUE
    `;

    const rawToken = randomBytes(PORTAL_TOKEN_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + PORTAL_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO conveyancing.client_portal_access
        (case_id, user_id, party_role, token_hash, token_expires_at, created_by)
      VALUES (
        ${caseId}::uuid, ${dto.userId}::uuid, ${dto.partyRole},
        ${tokenHash}, ${expiresAt.toISOString()}::timestamptz, ${actorId}::uuid
      )
      RETURNING id
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'portal_access.token_issued',
      resourceType: 'client_portal_access',
      resourceId: rows[0].id,
      payload: { caseId, userId: dto.userId, partyRole: dto.partyRole },
      ipAddress,
      userAgent,
    });

    // rawToken returned once only — caller must securely deliver to client
    return { token: rawToken, expiresAt, accessId: rows[0].id };
  }

  /**
   * Validate a portal token and return the read-only case summary.
   * Records last_accessed_at on each use.
   */
  async getPortalSummary(
    rawToken: string,
    caseId: string,
    ipAddress?: string,
  ): Promise<PortalSummary> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const accesses = await this.prisma.$queryRaw<{
      id: string;
      user_id: string;
      party_role: string;
      token_expires_at: Date;
      is_active: boolean;
    }[]>`
      SELECT id, user_id, party_role, token_expires_at, is_active
      FROM conveyancing.client_portal_access
      WHERE token_hash = ${tokenHash}
        AND case_id = ${caseId}::uuid
      LIMIT 1
    `;

    if (!accesses.length || !accesses[0].is_active) {
      throw new UnauthorizedException('Invalid or revoked portal token');
    }
    if (new Date() > new Date(accesses[0].token_expires_at)) {
      throw new UnauthorizedException('Portal token has expired');
    }

    // Update last accessed
    await this.prisma.$executeRaw`
      UPDATE conveyancing.client_portal_access
      SET last_accessed_at = NOW()
      WHERE id = ${accesses[0].id}::uuid
    `;

    const caseRows = await this.prisma.$queryRaw<{
      case_reference: string;
      status: string;
      country: string;
      opened_at: Date;
      target_registration_date: Date | null;
    }[]>`
      SELECT case_reference, status, country, opened_at, target_registration_date
      FROM conveyancing.cases WHERE id = ${caseId}::uuid LIMIT 1
    `;
    if (!caseRows.length) throw new NotFoundException('Case not found');

    const tasks = await this.prisma.$queryRaw<{ title: string; status: string; due_date: Date | null; is_blocker: boolean }[]>`
      SELECT title, status, due_date, is_blocker
      FROM conveyancing.case_tasks
      WHERE case_id = ${caseId}::uuid
      ORDER BY stage_number ASC NULLS LAST, sort_order ASC
    `;

    const documents = await this.prisma.$queryRaw<{ document_name: string; document_type: string; status: string; fully_signed_at: Date | null }[]>`
      SELECT document_name, document_type, status, fully_signed_at
      FROM conveyancing.generated_documents
      WHERE case_id = ${caseId}::uuid
      ORDER BY created_at DESC
    `;

    const balRows = await this.prisma.$queryRaw<{ balance: string }[]>`
      SELECT COALESCE(
        SUM(CASE WHEN tle.direction = 'credit' THEN tle.amount ELSE -tle.amount END), 0
      ) AS balance
      FROM conveyancing.trust_ledger_entries tle
      JOIN conveyancing.trust_accounts ta ON ta.id = tle.trust_account_id
      WHERE tle.case_id = ${caseId}::uuid
    `;
    const ledgerBalance = parseFloat(balRows[0]?.balance ?? '0');

    const c = caseRows[0];
    return {
      caseReference: c.case_reference,
      status: c.status,
      country: c.country,
      openedAt: c.opened_at,
      targetRegistrationDate: c.target_registration_date,
      tasks,
      documents,
      ledgerBalance,
    };
  }

  async revokeAccess(
    actorId: string,
    actorRole: string,
    firmId: string,
    accessId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE conveyancing.client_portal_access
      SET is_active = FALSE
      WHERE id = ${accessId}::uuid
    `;

    await this.audit.log({
      actorId,
      actorRole,
      firmId,
      action: 'portal_access.revoked',
      resourceType: 'client_portal_access',
      resourceId: accessId,
      ipAddress,
      userAgent,
    });
  }
}
