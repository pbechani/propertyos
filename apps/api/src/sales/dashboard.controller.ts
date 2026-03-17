import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { SalesService } from './sales.service';
import { PrismaService } from '../database';
import { ListSalesQueryDto } from './sales.dto';
import { AuthRequest } from '../common/types';

// ─────────────────────────────────────────────────────────────────────────────
// Agent Sales Dashboard  — GET /api/v1/agent/sales
// ─────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('agent', 'admin')
@Controller('agent')
export class AgentSalesDashboardController {
  constructor(
    private readonly salesService: SalesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /api/v1/agent/sales
   * Agent's active sales with stage summary + days in current stage.
   */
  @Get('sales')
  async listAgentSales(@Query() query: ListSalesQueryDto, @Request() req: AuthRequest) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const offset = (page - 1) * limit;

    const sales = await this.prisma.$queryRawUnsafe<unknown[]>(
      `SELECT
         ps.id,
         ps.sale_reference,
         ps.property_id,
         ps.buyer_id,
         ps.seller_id,
         ps.agreed_price,
         ps.currency,
         ps.status,
         ps.current_stage,
         ps.country,
         ps.created_at,
         ps.updated_at,
         sp.status        AS stage_status,
         sp.started_at    AS stage_started_at,
         sp.days_in_stage,
         sc.stage_name    AS current_stage_name,
         sc.responsible_role AS current_stage_owner,
         CASE WHEN prop.id IS NOT NULL THEN
           jsonb_build_object(
             'title',        prop.title,
             'addressLine1', loc.address_line1,
             'city',         loc.city
           )
         ELSE NULL END AS property
       FROM sales.property_sales ps
       LEFT JOIN sales.sale_stage_progress sp
               ON sp.sale_id = ps.id AND sp.stage_number = ps.current_stage
       LEFT JOIN sales.stage_configs sc
               ON sc.country = ps.country AND sc.stage_number = ps.current_stage
       LEFT JOIN property.properties prop ON prop.id = ps.property_id
       LEFT JOIN property.property_locations loc ON loc.property_id = ps.property_id
       WHERE ps.agent_id = $1
       ORDER BY ps.updated_at DESC
       LIMIT $2 OFFSET $3`,
      req.user.sub,
      limit,
      offset,
    );

    const [{ count }] = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM sales.property_sales WHERE agent_id = $1`,
      req.user.sub,
    );

    return { data: sales, total: Number(count), page, limit };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conveyancer Cases Dashboard  — GET /api/v1/conveyancer/cases
// ─────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('conveyancer', 'admin')
@Controller('conveyancer')
export class ConveyancerCasesDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/v1/conveyancer/cases
   * Conveyancer's active cases with outstanding docs per stage.
   */
  @Get('cases')
  async listCases(@Query() query: ListSalesQueryDto, @Request() req: AuthRequest) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const offset = (page - 1) * limit;

    const cases = await this.prisma.$queryRawUnsafe<unknown[]>(
      `SELECT
         ps.id,
         ps.sale_reference,
         ps.property_id,
         ps.status,
         ps.current_stage,
         ps.country,
         ps.updated_at,
         sp.status        AS stage_status,
         sp.days_in_stage,
         sc.stage_name    AS current_stage_name,
         -- Count outstanding required docs
         (SELECT COUNT(*) FROM sales.stage_documents sd
          WHERE sd.sale_id = ps.id
            AND sd.stage_number = ps.current_stage
            AND sd.is_required = TRUE
            AND sd.status NOT IN ('received','verified')
         ) AS outstanding_required_docs
       FROM sales.property_sales ps
       LEFT JOIN sales.sale_stage_progress sp
               ON sp.sale_id = ps.id AND sp.stage_number = ps.current_stage
       LEFT JOIN sales.stage_configs sc
               ON sc.country = ps.country AND sc.stage_number = ps.current_stage
       WHERE (ps.buyer_conveyancer_id = $1 OR ps.seller_conveyancer_id = $1)
         AND ps.status = 'active'
       ORDER BY ps.updated_at DESC
       LIMIT $2 OFFSET $3`,
      req.user.sub,
      limit,
      offset,
    );

    const [{ count }] = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text AS count FROM sales.property_sales
       WHERE (buyer_conveyancer_id = $1 OR seller_conveyancer_id = $1) AND status = 'active'`,
      req.user.sub,
    );

    return { data: cases, total: Number(count), page, limit };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Sales Dashboard  — GET /api/v1/admin/sales
// ─────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminSalesDashboardController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * GET /api/v1/admin/sales
   * All sales, paginated + filterable by status / stage.
   */
  @Get('sales')
  adminListSales(@Query() query: ListSalesQueryDto) {
    return this.salesService.adminListSales(query);
  }
}
