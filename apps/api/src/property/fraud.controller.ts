import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { FraudService } from './fraud.service';
import { CreateFraudReportDto, ResolveFraudReportDto } from './property.dto';
import { resolvePropertyActorRole } from './property.constants';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[]; active_company_id?: string | null };
  ip: string;
  headers: { 'user-agent'?: string };
};

/**
 * Public + authenticated fraud reporting.
 */
@Controller('properties')
@UseGuards(JwtAuthGuard)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  /**
   * POST /api/v1/properties/:id/fraud-reports
   * Any authenticated user may submit a fraud report.
   */
  @Post(':id/fraud-reports')
  async create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFraudReportDto,
    @Request() req: AuthRequest,
  ) {
    const role = resolvePropertyActorRole(req.user.roles, 'buyer_seller');
    return this.fraudService.create(
      id,
      req.user.sub,
      role,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}

/**
 * Admin fraud management.
 */
@Controller('admin/fraud-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminFraudController {
  constructor(private readonly fraudService: FraudService) {}

  /**
   * GET /api/v1/admin/fraud-reports
   * List all fraud reports. [admin]
   */
  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.fraudService.findAll({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * PATCH /api/v1/admin/fraud-reports/:id/resolve
   * Resolve or dismiss a fraud report. [admin]
   */
  @Patch(':id/resolve')
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveFraudReportDto,
    @Request() req: AuthRequest,
  ) {
    return this.fraudService.resolve(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
