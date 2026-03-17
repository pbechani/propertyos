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
  AgentBookViewingDto,
  AgentDeclineViewingDto,
  AgentViewingUpdateDto,
  CancelOpenHouseDto,
  CancelViewingDto,
  CheckInAttendeeDto,
  CreateOpenHouseDto,
  CreateViewingDto,
  RescheduleOpenHouseDto,
  RescheduleViewingDto,
  ViewingFeedbackDto,
} from './mandate.dto';
import { AuthRequest } from '../common/types';

/**
 * POST /api/v1/properties/:id/viewings            [buyer]
 * POST /api/v1/properties/:id/viewings/agent-book [agent] — agent books on behalf of buyer
 * GET  /api/v1/properties/:id/viewings            [agent]
 * POST /api/v1/properties/:id/open-houses         [agent]
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
  @Post('viewings/agent-book')
  async agentBook(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgentBookViewingDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.bookForBuyer(
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

  @Get('open-houses')
  async listOpenHouses(@Param('id', ParseUUIDPipe) id: string) {
    return this.viewingService.propertyOpenHouses(id);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/decline')
  async decline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgentDeclineViewingDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.decline(
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
  @Roles('agent', 'admin', 'buyer_seller', 'investor')
  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelViewingDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.cancel(
      id,
      req.user.sub,
      req.user.roles[0] ?? 'buyer_seller',
      dto,
      req.ip,
      req.headers['user-agent'],
      req.user.active_company_id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/reschedule')
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleViewingDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.reschedule(
      id,
      req.user.sub,
      req.user.roles[0] ?? 'agent',
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
 * GET  /api/v1/agent/open-houses   [agent] — list own open houses
 */
@Controller('agent/open-houses')
export class AgentOpenHouseController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get()
  async list(@Request() req: AuthRequest) {
    return this.viewingService.agentOpenHouses(req.user.sub);
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOpenHouseDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.cancelOpenHouse(
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
  @Roles('agent', 'admin')
  @Patch(':id/reschedule')
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleOpenHouseDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.rescheduleOpenHouse(
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
  @Roles('agent', 'admin')
  @Get(':id/registrations')
  async registrations(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.getOpenHouseRegistrations(id, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/check-in')
  async checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckInAttendeeDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.checkInAttendee(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}

/**
 * GET /api/v1/buyer/open-houses/:registrationId/qr-code  [buyer]
 * Returns the QR code data URL for a registration (buyer's own).
 */
@Controller('buyer/open-houses')
export class BuyerOpenHouseController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer_seller', 'investor', 'admin')
  @Get(':registrationId/qr-code')
  async getQrCode(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Request() req: AuthRequest,
  ) {
    const dataUrl = await this.viewingService.getRegistrationQrCode(registrationId, req.user.sub);
    return { dataUrl };
  }
}

/**
 * GET /api/v1/buyer/viewings   [buyer] — list own viewing history
 */
@Controller('buyer/viewings')
export class BuyerViewingController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('buyer_seller', 'investor', 'admin')
  @Get()
  async myViewings(@Request() req: AuthRequest) {
    return this.viewingService.getBuyerViewings(req.user.sub);
  }
}

/**
 * GET    /api/v1/notifications            — list (last 50)
 * PATCH  /api/v1/notifications/:id/read   — mark one read
 * PATCH  /api/v1/notifications/read-all   — mark all read
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly viewingService: ViewingService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req: AuthRequest) {
    return this.viewingService.getNotifications(req.user.sub, req.user.active_company_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  async readAll(@Request() req: AuthRequest) {
    await this.viewingService.markAllNotificationsRead(req.user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    await this.viewingService.markNotificationRead(id, req.user.sub);
    return { success: true };
  }
}
