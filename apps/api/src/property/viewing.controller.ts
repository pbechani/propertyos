import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../identity/rbac/jwt-auth.guard';
import { RolesGuard } from '../identity/rbac/roles.guard';
import { Roles } from '../identity/rbac/roles.decorator';
import { ViewingService } from './viewing.service';
import { WorkflowEngineService } from './workflow-engine.service';
import {
  AgentBookViewingDto,
  AgentDeclineViewingDto,
  AgentViewingUpdateDto,
  CancelOpenHouseDto,
  CancelViewingDto,
  CheckInAttendeeDto,
  CreateOpenHouseDto,
  CreateViewingDto,
  CreateWorkflowDto,
  RegisterGuestDto,
  RescheduleOpenHouseDto,
  RescheduleViewingDto,
  UpdateOpenHouseDto,
  UpdateWorkflowDto,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Post(':id/register-guest')
  async registerGuest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterGuestDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.registerGuestForOpenHouse(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpenHouseDto,
    @Request() req: AuthRequest,
  ) {
    return this.viewingService.updateOpenHouse(
      id,
      req.user.sub,
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin')
  @Get('analytics')
  async analytics(
    @Request() req: AuthRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.viewingService.getOpenHouseAnalytics(req.user.sub, from, to);
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

/**
 * GET    /api/v1/agent/workflows        — list company workflows
 * POST   /api/v1/agent/workflows        — create workflow
 * PATCH  /api/v1/agent/workflows/:id   — update workflow
 * DELETE /api/v1/agent/workflows/:id   — delete workflow
 */
@Controller('agent/workflows')
export class AgentWorkflowController {
  constructor(
    private readonly viewingService: ViewingService,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'brokerage_admin')
  @Get()
  async list(@Request() req: AuthRequest) {
    const companyId = req.user.active_company_id;
    if (!companyId) return [];
    return this.viewingService.listWorkflows(companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'brokerage_admin')
  @Post()
  async create(@Request() req: AuthRequest, @Body() dto: CreateWorkflowDto) {
    const companyId = req.user.active_company_id;
    if (!companyId) throw new NotFoundException('No active company context');
    return this.viewingService.createWorkflow(req.user.sub, companyId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'brokerage_admin')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateWorkflowDto,
  ) {
    const companyId = req.user.active_company_id;
    if (!companyId) throw new NotFoundException('No active company context');
    return this.viewingService.updateWorkflow(req.user.sub, companyId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'brokerage_admin')
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    const companyId = req.user.active_company_id;
    if (!companyId) return;
    await this.viewingService.deleteWorkflow(companyId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'brokerage_admin')
  @Post(':id/test-run')
  async testRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
    @Body() body: { steps?: unknown[] },
  ) {
    const companyId = req.user.active_company_id;
    if (!companyId) throw new NotFoundException('No active company context');
    return this.workflowEngine.testRun(id, companyId, body?.steps);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'brokerage_admin')
  @Get(':id/logs')
  async listLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    const companyId = req.user.active_company_id;
    if (!companyId) return [];
    return this.viewingService.listWorkflowLogs(companyId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agent', 'admin', 'brokerage_admin')
  @Get(':id/logs/:enrollmentId')
  async getLogDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Request() req: AuthRequest,
  ) {
    const companyId = req.user.active_company_id;
    if (!companyId) throw new NotFoundException('No active company context');
    return this.viewingService.getWorkflowEnrollmentDetail(companyId, id, enrollmentId);
  }
}

/**
 * GET /api/v1/workflows/approval/:token?action=approve|reject
 *
 * Public endpoint — no auth required. Called when a lead clicks an
 * Approve / Reject link from a workflow approval-form email.
 */
@Controller('workflows/approval')
export class WorkflowApprovalController {
  constructor(private readonly workflowEngine: WorkflowEngineService) {}

  @Get(':token')
  async respond(
    @Param('token') token: string,
    @Query('action') action: string,
    @Res() res: Response,
  ) {
    const isApproved = action === 'approve';
    try {
      await this.workflowEngine.resumeAfterApproval(token, isApproved ? 'approve' : 'reject');
      res.type('html').send(approvalPage(isApproved, true));
    } catch {
      res.status(400).type('html').send(approvalPage(isApproved, false));
    }
  }
}

function approvalPage(approved: boolean, success: boolean): string {
  if (!success) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Link Expired</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#fff;border-radius:16px;padding:48px 40px;max-width:420px;width:90%;text-align:center;box-shadow:0 4px 32px rgba(0,0,0,.08)}.icon{font-size:52px;margin-bottom:16px}h1{font-size:21px;font-weight:700;color:#1e293b;margin-bottom:10px}p{font-size:15px;color:#64748b;line-height:1.6}.badge{display:inline-block;margin-top:18px;padding:5px 16px;border-radius:100px;font-size:13px;font-weight:600;background:#fef3c7;color:#92400e}</style></head><body><div class="card"><div class="icon">⚠️</div><h1>Link Expired</h1><p>This approval link has already been used or is no longer valid. You may close this tab.</p><span class="badge">ALREADY RESPONDED</span></div></body></html>`;
  }
  const icon    = approved ? '✅' : '❌';
  const heading = approved ? 'Approved — thank you!' : 'Rejected — response recorded';
  const sub     = approved
    ? 'Your approval has been recorded and the process will continue automatically.'
    : 'Your rejection has been recorded. The team will be notified.';
  const badgeStyle = approved
    ? 'background:#dcfce7;color:#16a34a'
    : 'background:#fee2e2;color:#dc2626';
  const badgeText = approved ? 'APPROVED' : 'REJECTED';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Response Recorded</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#fff;border-radius:16px;padding:48px 40px;max-width:420px;width:90%;text-align:center;box-shadow:0 4px 32px rgba(0,0,0,.08)}.icon{font-size:52px;margin-bottom:16px}h1{font-size:21px;font-weight:700;color:#1e293b;margin-bottom:10px}p{font-size:15px;color:#64748b;line-height:1.6}.badge{display:inline-block;margin-top:18px;padding:5px 16px;border-radius:100px;font-size:13px;font-weight:600;${badgeStyle}}</style></head><body><div class="card"><div class="icon">${icon}</div><h1>${heading}</h1><p>${sub}</p><span class="badge">${badgeText}</span></div></body></html>`;
}
