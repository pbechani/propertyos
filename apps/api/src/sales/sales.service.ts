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

export type PersonRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

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
  // Populated by list queries via LEFT JOIN
  property?: { title?: string | null; addressLine1?: string | null; city?: string | null } | null;
  // Populated by getSale
  buyers?: PersonRow[];
  sellers?: PersonRow[];
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

    // Seed junction tables from initial seller (and buyer if provided)
    await this.prisma.$executeRaw`
      INSERT INTO sales.sale_sellers (sale_id, user_id, added_by)
      VALUES (${sale.id}::uuid, ${dto.sellerId}::uuid, ${agentId}::uuid)
      ON CONFLICT (sale_id, user_id) DO NOTHING
    `;
    if (dto.buyerId) {
      await this.prisma.$executeRaw`
        INSERT INTO sales.sale_buyers (sale_id, user_id, added_by)
        VALUES (${sale.id}::uuid, ${dto.buyerId}::uuid, ${agentId}::uuid)
        ON CONFLICT (sale_id, user_id) DO NOTHING
      `;
    }

    return sale;
  }

  // ─────────────────────────────────────────────────────────
  // Get Sale by ID  (with stage summary + parties check)
  // ─────────────────────────────────────────────────────────

  async getSale(saleId: string, requesterId: string, requesterRoles: string[]): Promise<unknown> {
    const sale = await this.findSaleOrThrow(saleId);

    // Fetch all buyers + sellers from junction tables (includes user details)
    const buyers = await this.fetchSalePartyUsers(saleId, 'sale_buyers');
    const sellers = await this.fetchSalePartyUsers(saleId, 'sale_sellers');

    // participant check: raw FK columns + everyone in the junction tables
    const junctionIds = [...buyers.map((b) => b.id), ...sellers.map((s) => s.id)];
    this.assertParticipant(sale, requesterId, requesterRoles, junctionIds);

    // Attach property details
    const propertyRows = await this.prisma.$queryRaw<{ title: string; address_line1: string | null; city: string | null }[]>`
      SELECT p.title, l.address_line1, l.city
      FROM property.properties p
      LEFT JOIN property.property_locations l ON l.property_id = p.id
      WHERE p.id = ${sale.property_id}::uuid
      LIMIT 1
    `;
    const prop = propertyRows[0] ?? null;
    const property = prop
      ? { title: prop.title, addressLine1: prop.address_line1 ?? null, city: prop.city ?? null }
      : null;

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

    // Attach commission info from active mandate (if any)
    let commission: { rate: number; mandateType: string; estimated: number } | null = null;
    if (sale.agent_id && sale.property_id) {
      const mandateRows = await this.prisma.$queryRaw<{ commission_rate: string; mandate_type: string }[]>`
        SELECT commission_rate::text, mandate_type
        FROM property.mandates
        WHERE property_id = ${sale.property_id}::uuid
          AND agent_id    = ${sale.agent_id}::uuid
          AND status      = 'active'
        LIMIT 1
      `;
      if (mandateRows[0]?.commission_rate) {
        const rate = parseFloat(mandateRows[0].commission_rate);
        const price = Number(sale.agreed_price ?? 0);
        commission = {
          rate,
          mandateType: mandateRows[0].mandate_type,
          estimated: Math.round(price * (rate / 100)),
        };
      }
    }

    return { ...sale, property, stages, buyers, sellers, commission };
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
      participantFilter = `ps.agent_id = '${userId}'`;
    } else if (actorRole === 'conveyancer') {
      participantFilter = `ps.buyer_conveyancer_id = '${userId}' OR ps.seller_conveyancer_id = '${userId}'`;
    } else if (actorRole === 'seller') {
      participantFilter = `(ps.seller_id = '${userId}' OR EXISTS (SELECT 1 FROM sales.sale_sellers ss WHERE ss.sale_id = ps.id AND ss.user_id = '${userId}'))`;
    } else {
      // buyer (default)
      participantFilter = `(ps.buyer_id = '${userId}' OR EXISTS (SELECT 1 FROM sales.sale_buyers sb WHERE sb.sale_id = ps.id AND sb.user_id = '${userId}'))`;
    }

    const statusFilter = query.status ? `AND ps.status = '${query.status}'` : '';
    const stageFilter = query.stage ? `AND ps.current_stage = ${query.stage}` : '';

    const sales = await this.prisma.$queryRawUnsafe<SaleRow[]>(
      `SELECT ps.*,
              CASE WHEN prop.id IS NOT NULL THEN
                jsonb_build_object(
                  'title',        prop.title,
                  'addressLine1', loc.address_line1,
                  'city',         loc.city
                )
              ELSE NULL END AS property
       FROM sales.property_sales ps
       LEFT JOIN property.properties prop ON prop.id = ps.property_id
       LEFT JOIN property.property_locations loc ON loc.property_id = ps.property_id
       WHERE (${participantFilter}) ${statusFilter} ${stageFilter}
       ORDER BY ps.updated_at DESC
       LIMIT $1 OFFSET $2`,
      limit,
      offset,
    );

    const [{ count }] = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM sales.property_sales ps
       WHERE (${participantFilter}) ${statusFilter} ${stageFilter}`,
    );

    return { data: sales, total: Number(count), page, limit };
  }

  // ─────────────────────────────────────────────────────────
  // Assign Buyer  (adds a buyer to the sale — multiple buyers supported)
  // ─────────────────────────────────────────────────────────

  async assignBuyer(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    buyerId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    await this.findSaleOrThrow(saleId);
    const actorRole = resolveSalesActorRole(actorRoles);

    if (!['admin', 'agent'].includes(actorRole)) {
      throw new ForbiddenException('Only agents or admins may assign a buyer to a sale');
    }

    await this.prisma.$executeRaw`
      INSERT INTO sales.sale_buyers (sale_id, user_id, added_by)
      VALUES (${saleId}::uuid, ${buyerId}::uuid, ${actorId}::uuid)
      ON CONFLICT (sale_id, user_id) DO NOTHING
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.buyer_added',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { buyerId },
      ipAddress,
      userAgent,
    });

    return { message: 'Buyer added to sale' };
  }

  // Remove Buyer
  // ─────────────────────────────────────────────────────────

  async removeBuyer(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    buyerId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    await this.findSaleOrThrow(saleId);
    const actorRole = resolveSalesActorRole(actorRoles);

    if (!['admin', 'agent'].includes(actorRole)) {
      throw new ForbiddenException('Only agents or admins may remove a buyer from a sale');
    }

    await this.prisma.$executeRaw`
      DELETE FROM sales.sale_buyers
      WHERE sale_id = ${saleId}::uuid AND user_id = ${buyerId}::uuid
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.buyer_removed',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { buyerId },
      ipAddress,
      userAgent,
    });

    return { message: 'Buyer removed from sale' };
  }

  // Assign Seller  (adds a seller to the sale — multiple sellers supported)
  // ─────────────────────────────────────────────────────────

  async assignSeller(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    sellerId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    await this.findSaleOrThrow(saleId);
    const actorRole = resolveSalesActorRole(actorRoles);

    if (!['admin', 'agent'].includes(actorRole)) {
      throw new ForbiddenException('Only agents or admins may assign a seller to a sale');
    }

    await this.prisma.$executeRaw`
      INSERT INTO sales.sale_sellers (sale_id, user_id, added_by)
      VALUES (${saleId}::uuid, ${sellerId}::uuid, ${actorId}::uuid)
      ON CONFLICT (sale_id, user_id) DO NOTHING
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.seller_added',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { sellerId },
      ipAddress,
      userAgent,
    });

    return { message: 'Seller added to sale' };
  }

  // Remove Seller
  // ─────────────────────────────────────────────────────────

  async removeSeller(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    sellerId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    await this.findSaleOrThrow(saleId);
    const actorRole = resolveSalesActorRole(actorRoles);

    if (!['admin', 'agent'].includes(actorRole)) {
      throw new ForbiddenException('Only agents or admins may remove a seller from a sale');
    }

    // Prevent removing the last seller
    const [{ count }] = await this.prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM sales.sale_sellers WHERE sale_id = ${saleId}::uuid
    `;
    if (Number(count) <= 1) {
      throw new ConflictException('Cannot remove the last seller from a sale');
    }

    await this.prisma.$executeRaw`
      DELETE FROM sales.sale_sellers
      WHERE sale_id = ${saleId}::uuid AND user_id = ${sellerId}::uuid
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.seller_removed',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { sellerId },
      ipAddress,
      userAgent,
    });

    return { message: 'Seller removed from sale' };
  }

  // Assign Agent
  // ─────────────────────────────────────────────────────────

  async assignAgent(
    saleId: string,
    actorId: string,
    actorRoles: string[],
    agentId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SaleRow> {
    await this.findSaleOrThrow(saleId);
    const actorRole = resolveSalesActorRole(actorRoles);

    if (!['admin', 'agent'].includes(actorRole)) {
      throw new ForbiddenException('Only agents or admins may assign an agent to a sale');
    }

    const [updated] = await this.prisma.$queryRaw<SaleRow[]>`
      UPDATE sales.property_sales
      SET agent_id = ${agentId}::uuid, updated_at = NOW()
      WHERE id = ${saleId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId,
      actorRole,
      action: 'sale.agent_assigned',
      resourceType: 'property_sale',
      resourceId: saleId,
      payload: { agentId },
      ipAddress,
      userAgent,
    });

    return updated;
  }

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

    const statusFilter = query.status ? `WHERE ps.status = '${query.status}'` : '';
    const stageFilter = query.stage
      ? `${statusFilter ? 'AND' : 'WHERE'} ps.current_stage = ${query.stage}`
      : '';

    const sales = await this.prisma.$queryRawUnsafe<SaleRow[]>(
      `SELECT ps.*,
              CASE WHEN prop.id IS NOT NULL THEN
                jsonb_build_object(
                  'title',        prop.title,
                  'addressLine1', loc.address_line1,
                  'city',         loc.city
                )
              ELSE NULL END AS property
       FROM sales.property_sales ps
       LEFT JOIN property.properties prop ON prop.id = ps.property_id
       LEFT JOIN property.property_locations loc ON loc.property_id = ps.property_id
       ${statusFilter} ${stageFilter}
       ORDER BY ps.updated_at DESC LIMIT $1 OFFSET $2`,
      limit,
      offset,
    );

    const [{ count }] = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM sales.property_sales ps ${statusFilter} ${stageFilter}`,
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

  private async fetchSalePartyUsers(saleId: string, table: 'sale_buyers' | 'sale_sellers'): Promise<PersonRow[]> {
    if (table === 'sale_buyers') {
      return this.prisma.$queryRaw<PersonRow[]>`
        SELECT u.id, u.first_name, u.last_name, u.email
        FROM sales.sale_buyers sb
        JOIN identity.users u ON u.id = sb.user_id
        WHERE sb.sale_id = ${saleId}::uuid
        ORDER BY sb.added_at ASC
      `;
    }
    return this.prisma.$queryRaw<PersonRow[]>`
      SELECT u.id, u.first_name, u.last_name, u.email
      FROM sales.sale_sellers ss
      JOIN identity.users u ON u.id = ss.user_id
      WHERE ss.sale_id = ${saleId}::uuid
      ORDER BY ss.added_at ASC
    `;
  }

  assertParticipant(sale: SaleRow, userId: string, roles: string[], extraIds: string[] = []): void {
    if (roles.includes('admin')) return;
    const ids = [
      sale.seller_id,
      sale.buyer_id,
      sale.agent_id,
      sale.buyer_conveyancer_id,
      sale.seller_conveyancer_id,
      ...extraIds,
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
