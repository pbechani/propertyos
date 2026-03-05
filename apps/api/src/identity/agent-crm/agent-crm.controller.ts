import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AgentCrmService } from './agent-crm.service';
import { CreateLeadDto, LogActivityDto, UpdateLeadStatusDto } from './agent-crm.dto';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { Roles } from '../rbac/roles.decorator';
import { Permissions } from '../rbac/permissions.decorator';

type RequestUser = { sub: string; roles: string[] };

@ApiTags('Agent CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('agent', 'brokerage_admin')
@Controller('agent')
export class AgentCrmController {
  constructor(private readonly crmService: AgentCrmService) {}

  @Get('dashboard')
  @Permissions({ resource: 'property', action: 'read' })
  async dashboard(@Req() req: { user: RequestUser }) {
    return this.crmService.getDashboard(req.user.sub);
  }

  @Post('leads')
  @Permissions({ resource: 'property', action: 'create' })
  async createLead(
    @Req() req: { user: RequestUser },
    @Body() dto: CreateLeadDto,
  ) {
    return this.crmService.createLead(req.user.sub, dto);
  }

  @Get('leads')
  @Permissions({ resource: 'property', action: 'read' })
  async getLeads(
    @Req() req: { user: RequestUser },
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.crmService.getLeads(req.user.sub, {
      status,
      page,
      limit: Math.min(limit, 100),
    });
  }

  @Get('leads/:id')
  @Permissions({ resource: 'property', action: 'read' })
  async getLeadById(
    @Req() req: { user: RequestUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.crmService.findLeadById(req.user.sub, id);
  }

  @Patch('leads/:id/status')
  @Permissions({ resource: 'property', action: 'update' })
  async updateStatus(
    @Req() req: { user: RequestUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.crmService.updateLeadStatus(req.user.sub, id, dto.status);
  }

  @Post('leads/:id/activities')
  @Permissions({ resource: 'property', action: 'update' })
  async logActivity(
    @Req() req: { user: RequestUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: LogActivityDto,
  ) {
    return this.crmService.logActivity(req.user.sub, id, dto);
  }

  @Get('leads/:id/activities')
  @Permissions({ resource: 'property', action: 'read' })
  async getActivities(
    @Req() req: { user: RequestUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.crmService.getActivities(req.user.sub, id);
  }
}
