import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { ValuationService } from './valuation.service';
import { ValuationRequestDto, SubmitValuationReportDto } from './mandate.dto';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[]; active_company_id?: string | null };
  ip: string;
  headers: { 'user-agent'?: string };
};

/**
 * POST  /api/v1/properties/:id/valuation-request
 * GET   /api/v1/properties/:id/valuations
 * GET   /api/v1/properties/:id/comparable-sales
 */
@Controller('properties/:id')
export class ValuationController {
  constructor(private readonly valuationService: ValuationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'valuer', 'buyer_seller')
  @Post('valuation-request')
  async request(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValuationRequestDto,
    @Request() req: AuthRequest,
  ) {
    return this.valuationService.requestValuation(
      id,
      req.user.sub,
      req.user.roles[0] ?? 'agent',
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'valuer', 'buyer_seller')
  @Get('valuations')
  async list(@Param('id', ParseUUIDPipe) id: string) {
    return this.valuationService.findByProperty(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'valuer')
  @Get('comparable-sales')
  async comparableSales(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('radius') radius?: string,
  ) {
    const radiusKm = radius ? parseFloat(radius) : 2;
    return this.valuationService.getComparableSales(id, Number.isFinite(radiusKm) ? radiusKm : 2);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'valuer', 'buyer_seller')
  @Get('ai-estimate')
  async aiEstimate(@Param('id', ParseUUIDPipe) id: string) {
    return this.valuationService.getAiEstimate(id);
  }
}

/**
 * POST /api/v1/valuations/:id/submit-report  [valuer]
 * GET  /api/v1/valuers?country=&specialization=
 */
@Controller('valuations')
export class ValuerController {
  constructor(private readonly valuationService: ValuationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('valuer', 'admin')
  @Post(':id/submit-report')
  async submitReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitValuationReportDto,
    @Request() req: AuthRequest,
  ) {
    return this.valuationService.submitReport(
      id,
      req.user.sub,
      req.user.roles[0] ?? 'valuer',
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}

@Controller('valuers')
export class ValuersController {
  constructor(private readonly valuationService: ValuationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'valuer', 'buyer_seller')
  @Get()
  async list(
    @Query('country') country?: string,
    @Query('specialization') specialization?: string,
  ) {
    return this.valuationService.findValuers(country, specialization);
  }
}
