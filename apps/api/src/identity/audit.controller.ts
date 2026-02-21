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
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<unknown[]> {
    return this.auditService.findAdminLogs({
      actorId,
      resourceType,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('audit-logs/me')
  myLogs(
    @Req() req: { user: RequestUser },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<unknown[]> {
    return this.auditService.findByActor(
      req.user.sub,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }
}
