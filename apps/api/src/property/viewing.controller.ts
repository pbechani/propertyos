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
import { ViewingService } from './viewing.service';
import {
  AgentViewingUpdateDto,
  CreateOpenHouseDto,
  CreateViewingDto,
  ViewingFeedbackDto,
} from './mandate.dto';

type AuthRequest = {
  user: { sub: string; email: string; roles: string[]; active_company_id?: string | null };
  ip: string;
  headers: { 'user-agent'?: string };
};

/**
 * POST /api/v1/properties/:id/viewings          [buyer]
 * GET  /api/v1/properties/:id/viewings          [agent]
 * POST /api/v1/properties/:id/open-houses       [agent]
 */
@Controller('properties/:id')
export class ViewingController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer_seller', 'investor', 'admin')
  @Post('viewings')
  async request(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateViewingDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.request(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get('viewings')
  async listViewings(@Param('id', ParseUUIDPipe) id: string) {
    return this.viewingService.findByProperty(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post('open-houses')
  async createOpenHouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOpenHouseDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.createOpenHouse(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}

/**
 * PATCH /api/v1/viewings/:id/confirm    [agent]
 * PATCH /api/v1/viewings/:id/complete   [agent]
 * POST  /api/v1/viewings/:id/feedback   [buyer]
 */
@Controller('viewings')
export class ViewingActionController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/confirm')
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.confirm(
      id,
      req.user.sub,
      req.user.roles[0] ?? 'agent',
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/complete')
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgentViewingUpdateDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.complete(
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
  @Roles('buyer_seller', 'investor', 'admin')
  @Post(':id/feedback')
  async feedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ViewingFeedbackDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.submitFeedback(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}

/**
 * GET  /api/v1/agent/viewings?from=&to=    [agent] — calendar view
 */
@Controller('agent/viewings')
export class AgentViewingCalendarController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get()
  async calendar(
    @Request() req: AuthRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.viewingService.agentCalendar(req.user.sub, from, to);
  }
}

/**
 * POST /api/v1/open-houses/:id/register   [buyer]
 */
@Controller('open-houses')
export class OpenHouseController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer_seller', 'investor', 'admin')
  @Post(':id/register')
  async register(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.registerForOpenHouse(
      id,
      req.user.sub,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }
}
