import {
  Body,
  Controller,
  Delete,
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
import { LeadsService } from './leads.service';
import { LeadActivityService } from './lead-activity.service';
import { LeadTaskService } from './lead-task.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  ListLeadsQueryDto,
  CreateLeadActivityDto,
  CreateLeadTaskDto,
  UpdateLeadTaskDto,
} from './leads.dto';

type AuthRequest = {
  user: {
    sub: string;
    roles: string[];
    active_company_id?: string | null;
  };
  ip: string;
  headers: { 'user-agent'?: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// Leads controller  — /api/v1/leads
// ─────────────────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly activityService: LeadActivityService,
    private readonly taskService: LeadTaskService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Dashboard, Pipeline, Analytics  — must be registered BEFORE :id to avoid
  // NestJS routing treating "dashboard" as a UUID param.
  // ─────────────────────────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.getDashboard(sub, roles, active_company_id ?? '');
  }

  @Get('pipeline')
  getPipeline(@Request() req: AuthRequest) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.getPipeline(sub, roles, active_company_id ?? '');
  }

  @Get('analytics')
  getAnalytics(@Request() req: AuthRequest) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.getAnalytics(sub, roles, active_company_id ?? '');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────────────────────────────────

  @Get()
  list(@Request() req: AuthRequest, @Query() query: ListLeadsQueryDto) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.list(sub, roles, active_company_id ?? '', query);
  }

  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateLeadDto) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.create(sub, roles, active_company_id ?? '', dto);
  }

  @Get(':id')
  getById(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.getById(id, sub, roles, active_company_id ?? '');
  }

  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.update(id, sub, roles, active_company_id ?? '', dto);
  }

  @UseGuards(RolesGuard)
  @Roles('agent', 'admin')
  @Delete(':id')
  remove(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.leadsService.remove(id, sub, roles, active_company_id ?? '');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Activities
  // ─────────────────────────────────────────────────────────────────────────

  @Get(':id/activities')
  listActivities(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.activityService.list(id, sub, roles, active_company_id ?? '');
  }

  @Post(':id/activities')
  createActivity(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLeadActivityDto,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.activityService.create(id, sub, roles, active_company_id ?? '', dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tasks
  // ─────────────────────────────────────────────────────────────────────────

  @Get(':id/tasks')
  listTasks(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.taskService.list(id, sub, roles, active_company_id ?? '');
  }

  @Post(':id/tasks')
  createTask(
    @Request() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLeadTaskDto,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.taskService.create(id, sub, roles, active_company_id ?? '', dto);
  }

  @Patch(':leadId/tasks/:taskId')
  updateTask(
    @Request() req: AuthRequest,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateLeadTaskDto,
  ) {
    const { sub, roles, active_company_id } = req.user;
    return this.taskService.update(leadId, taskId, sub, roles, active_company_id ?? '', dto);
  }
}
