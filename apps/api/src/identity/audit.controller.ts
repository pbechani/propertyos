import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './rbac/jwt-auth.guard';
import { RolesGuard } from './rbac/roles.guard';
import { Roles } from './rbac/roles.decorator';
import { AuditService } from './audit.service';

type RequestUser = {
  sub: string;
};

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles('admin')
  @Get('admin/audit-logs')
  adminLogs(
    @Query('actor_id') actorId?: string,
    @Query('resource_type') resourceType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<unknown[]> {
    return this.auditService.findAdminLogs({ actorId, resourceType, from, to });
  }

  @Get('audit-logs/me')
  myLogs(@Req() req: { user: RequestUser }): Promise<unknown[]> {
    return this.auditService.findByActor(req.user.sub);
  }
}
