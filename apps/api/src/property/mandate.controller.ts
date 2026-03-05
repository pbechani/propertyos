import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { MandateService } from './mandate.service';
import {
  CancelMandateDto,
  CreateMandateDto,
  MANDATE_SIGNING_PARTIES,
  MandateSigningParty,
} from './mandate.dto';
import { BadRequestException } from '@nestjs/common';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[]; active_company_id?: string | null };
  ip: string;
  headers: { 'user-agent'?: string };
};

@Controller('properties/:propertyId/mandate')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MandateController {
  constructor(private readonly mandateService: MandateService) {}

  /**
   * POST /api/v1/properties/:propertyId/mandate
   * Agent creates a mandate draft for a property.
   */
  @Roles('agent', 'admin')
  @Post()
  async create(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateMandateDto,
    @Request() req: AuthRequest,
  ) {
    return this.mandateService.create(
      propertyId,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * GET /api/v1/properties/:propertyId/mandate
   * View mandate(s) for a property. [agent (own), buyer_seller, admin]
   */
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Get()
  async findByProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.mandateService.findByProperty(propertyId);
  }

  /**
   * POST /api/v1/properties/:propertyId/mandate/:mId/sign
   * Sign mandate as seller or agent.
   */
  @Roles('agent', 'admin', 'buyer_seller')
  @Post(':mId/sign')
  async sign(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('mId', ParseUUIDPipe) mId: string,
    @Body('party') party: string,
    @Request() req: AuthRequest,
  ) {
    if (!MANDATE_SIGNING_PARTIES.includes(party as MandateSigningParty)) {
      throw new BadRequestException('party must be "seller" or "agent"');
    }
    return this.mandateService.sign(
      propertyId,
      mId,
      party as MandateSigningParty,
      req.user.sub,
      req.user.roles[0] ?? 'agent',
      { party: party as MandateSigningParty },
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  /**
   * PATCH /api/v1/properties/:propertyId/mandate/:mId/cancel
   * Cancel a mandate.
   */
  @Roles('agent', 'admin', 'buyer_seller')
  @Patch(':mId/cancel')
  async cancel(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('mId', ParseUUIDPipe) mId: string,
    @Body() dto: CancelMandateDto,
    @Request() req: AuthRequest,
  ) {
    return this.mandateService.cancel(
      propertyId,
      mId,
      req.user.sub,
      req.user.roles[0] ?? 'agent',
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}

@Controller('agent/mandates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentMandateController {
  constructor(private readonly mandateService: MandateService) {}

  /**
   * GET /api/v1/agent/mandates
   * List all active mandates for the authenticated agent.
   */
  @Roles('agent', 'admin')
  @Get()
  async myMandates(@Request() req: AuthRequest) {
    return this.mandateService.findAgentMandates(req.user.sub);
  }
}
