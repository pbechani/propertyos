import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { SalesAuditService } from './sales-audit.service';
import { AssignConveyancerDto, InitiateSaleDto, ListSalesQueryDto } from './sales.dto';
import {
  DEFAULT_PAGE_LIMIT,
  SALE_TRANSITIONS,
  SaleStatus,
  generateSaleReference,
  resolveSalesActorRole,
  TOTAL_STAGES,
} from './sales.constants';

export type SaleRow = {
  id: string;
  property_id: string;
  sale_reference: string;
  seller_id: string;
  buyer_id: string | null;
  agent_id: string | null;
  buyer_conveyancer_id: string | null;
  seller_conveyancer_id: string | null;
  agreed_price: string;
  currency: string;
  deposit_amount: string | null;
  status: string;
  current_stage: number;
  country: string;
  company_id: string | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: SalesAuditService,
  ) {}

  // ─────────────────────────────────────────────────────────
  // Initiate Sale
  // ─────────────────────────────────────────────────────────

  async initiateSale(
    agentId: string,
    agentRoles: string[],
    dto: InitiateSaleDto,
    ipAddress?: string,
    userAgent?: string,
    companyId?: string | null,
  ): Promise<SaleRow> {
    // Property must exist
    const property = await this.prisma.$queryRaw<{ id: string; agent_id: string | null }[]>`
      SELECT id, agent_id FROM property.properties
      WHERE id = ${dto.propertyId}::uuid LIMIT 1
    `;
    if (!property[0]) throw new NotFoundException('Property not found');

    const actorRole = resolveSalesActorRole(agentRoles);

    // Non-admin agents can only initiate sales for their own listings
    if (actorRole !== 'admin' && property[0].agent_id !== agentId) {
      throw new ForbiddenException('You can only initiate a sale for your own listings');
    }

    const ref = generateSaleReference();
    const country = dto.country ?? 'ZA';

    const [sale] = await this.prisma.$queryRaw<SaleRow[]>`
      INSERT INTO sales.property_sales (
        property_id, sale_reference, seller_id, buyer_id, agent_id,
        agreed_price, currency, deposit_amount, country, company_id
      ) VALUES (
        ${dto.propertyId}::uuid,
        ${ref},
        ${dto.sellerId}::uuid,
        ${dto.buyerId ?? null}::uuid,
        ${agentId}::uuid,
        ${dto.agreedPrice},
        ${dto.currency},
        ${dto.depositAmount ?? null},
        ${country},
        ${companyId ?? null}::uuid
      )
      RETURNING *
    `;

    // Initialise all 14 stage rows for this sale
    await this.prisma.$executeRaw`
      INSERT INTO sales.sale_stage_progress (sale_id, stage_number, status)
      SELECT ${sale.id}::uuid, gs.n, 'not_started'
      FROM generate_series(1, ${TOTAL_STAGES}) AS gs(n)
      ON CONFLICT (sale_id, stage_number) DO NOTHING
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole,
      companyId,
      action: 'sale.initiated',
      resourceType: 'property_sale',
      resourceId: sale.id,
      payload: { saleReference: ref, propertyId: dto.propertyId, agreedPrice: dto.agreedPrice },
      ipAddress,
      userAgent,
    });

    return sale;
  }

  // ─────────────────────────────────────────────────────────
  // Get Sale by ID  (with stage summary + parties check)
  // ─────────────────────────────────────────────────────────

  async getSale(saleId: string, requesterId: string, requesterRoles: string[]): Promise<unknown> {
    const sale = await this.findSaleOrThrow(saleId);
    this.assertParticipant(sale, requesterId, requesterRoles);

    // Attach stage progress
    const stages = await this.prisma.$queryRaw<unknown[]>`
      SELECT sp.stage_number, sp.status, sp.started_at, sp.completed_at, sp.days_in_stage, sp.notes,
             sc.stage_name, sc.responsible_role, sc.is_blocker, sc.government_dept, sc.typical_duration_days,
             sc.required_documents
      FROM sales.sale_stage_progress sp
      JOIN sales.stage_configs sc
        ON sc.country = ${sale.country} AND sc.stage_number = sp.stage_number
      WHERE sp.sale_id = ${saleId}::uuid
      ORDER BY sp.stage_number ASC
    `;

    return { ...sale, stages };
  }

  // ─────────────────────────────────────────────────────────
  // List Sales for the current user
  // ─────────────────────────────────────────────────────────

  async listMySales(
    userId: string,
    roles: string[],
    query: ListSalesQueryDto,
  ): Promise<{ data: SaleRow[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? DEFAULT_PAGE_LIMIT);
    const offset = (page - 1) * limit;

    const actorRole = resolveSalesActorRole(roles);

    // Build participation filter depending on role
    let participantFilter: string;
    if (actorRole === 'admin') {
      participantFilter = 'TRUE';
    } else if (actorRole === 'agent') {
      participantFilter = `agent_id = '${userId}'`;
    } else if (actorRole === 'conveyancer') {
      participantFilter = `buyer_conveyancer_id = '${userId}' OR seller_conveyancer_id = '${userId}'`;
    } else if (actorRole === 'seller') {
      participantFilter = `seller_id = '${userId}'`;
    } else {
      participantFilter = `buyer_id = '${userId}'`;
    }

    const statusFilter = query.status ? `AND status = '${query.status}'` : '';
    const stageFilter = query.stage ? `AND current_stage = ${query.stage}` : '';

    const sales = await this.prisma.$queryRawUnsafe<SaleRow[]>(
      `SELECT * FROM sales.property_sales
       WHERE (${participantFilter}) ${statusFilter} ${stageFilter}
       ORDER BY updated_at DESC
       LIMIT $1 OFFSET $2`,
      limit,
      offset,
    );

    const [{ count }] = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM sales.property_sales
       WHERE (${participantFilter}) ${statusFilter} ${stageFilter}`,
    );

    return { data: sales, total: Number(count), page, limit };
  }

  // ─────────────────────────────────────────────────────────
  // Assign Conveyancer
  // ─────────────────────────────────────────────────────────

  async assignConveyancer(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    dto: AssignConveyancerDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SaleRow> {
    const sale = await this.findSaleOrThrow(saleId);
    const actorRole = resolveSalesActorRole(actorRoles);

    if (!['admin', 'agent'].includes(actorRole) && sale.agent_id !== actorId) {
      throw new ForbiddenException('Only the assigned agent or admin may assign conveyancers');
    }

    const [updated] = await this.prisma.$queryRaw<SaleRow[]>`
      UPDATE sales.property_sales SET
        buyer_conveyancer_id  = COALESCE(${dto.buyerConveyancerId ?? null}::uuid,  buyer_conveyancer_id),
        seller_conveyancer_id = COALESCE(${dto.sellerConveyancerId ?? null}::uuid, seller_conveyancer_id),
        updated_at = NOW()
      WHERE id = ${saleId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.conveyancer_assigned',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: dto as unknown as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────
  // Cancel Sale
  // ─────────────────────────────────────────────────────────

  async cancelSale(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SaleRow> {
    const sale = await this.findSaleOrThrow(saleId);
    this.assertStatusTransition(sale.status as SaleStatus, 'cancelled');

    const actorRole = resolveSalesActorRole(actorRoles);
    if (!['admin', 'agent'].includes(actorRole)) {
      throw new ForbiddenException('Only agents or admins may cancel a sale');
    }

    const [updated] = await this.prisma.$queryRaw<SaleRow[]>`
      UPDATE sales.property_sales SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${saleId}::uuid RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.cancelled',
      resourceType: 'property_sale',
      resourceId: saleId,
      ipAddress,
      userAgent,
    });

    return updated;
  }

  // ─────────────────────────────────────────────────────────
  // Admin: list all sales (paginated, filterable)
  // ─────────────────────────────────────────────────────────

  async adminListSales(
    query: ListSalesQueryDto,
  ): Promise<{ data: SaleRow[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? DEFAULT_PAGE_LIMIT);
    const offset = (page - 1) * limit;

    const statusFilter = query.status ? `WHERE status = '${query.status}'` : '';
    const stageFilter = query.stage
      ? `${statusFilter ? 'AND' : 'WHERE'} current_stage = ${query.stage}`
      : '';

    const sales = await this.prisma.$queryRawUnsafe<SaleRow[]>(
      `SELECT * FROM sales.property_sales ${statusFilter} ${stageFilter}
       ORDER BY updated_at DESC LIMIT $1 OFFSET $2`,
      limit,
      offset,
    );

    const [{ count }] = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM sales.property_sales ${statusFilter} ${stageFilter}`,
    );

    return { data: sales, total: Number(count), page, limit };
  }

  // ─────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────

  async findSaleOrThrow(saleId: string): Promise<SaleRow> {
    const rows = await this.prisma.$queryRaw<SaleRow[]>`
      SELECT * FROM sales.property_sales WHERE id = ${saleId}::uuid LIMIT 1
    `;
    if (!rows[0]) throw new NotFoundException(`Sale ${saleId} not found`);
    return rows[0];
  }

  assertParticipant(sale: SaleRow, userId: string, roles: string[]): void {
    if (roles.includes('admin')) return;
    const ids = [
      sale.seller_id,
      sale.buyer_id,
      sale.agent_id,
      sale.buyer_conveyancer_id,
      sale.seller_conveyancer_id,
    ];
    if (!ids.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this sale');
    }
  }

  private assertStatusTransition(current: SaleStatus, next: SaleStatus): void {
    const allowed = SALE_TRANSITIONS[current];
    if (!allowed.includes(next)) {
      throw new ConflictException(
        `Sale status transition '${current}' → '${next}' is not allowed`,
      );
    }
  }
}
