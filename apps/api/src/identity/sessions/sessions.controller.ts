import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { Permissions } from '../rbac/permissions.decorator';

type RequestUser = { sub: string; roles: string[]; session_id?: string };

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users/me/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Permissions({ resource: 'users', action: 'self' })
  async listActive(@Req() req: { user: RequestUser }) {
    const rows = await this.sessionsService.listActive(req.user.sub);
    const currentSessionId = req.user.session_id ?? null;
    return rows.map((s) => ({
      id: s.id,
      deviceName: s.device_name ?? null,
      ipAddress: s.ip_address ?? null,
      lastActiveAt: s.last_active_at ? (s.last_active_at as Date).toISOString() : null,
      createdAt: (s.created_at as Date).toISOString(),
      expiresAt: (s.expires_at as Date).toISOString(),
      current: s.id === currentSessionId,
    }));
  }

  @Delete()
  @Permissions({ resource: 'users', action: 'self' })
  async revokeAllOther(@Req() req: { user: RequestUser }) {
    // Use the session_id embedded in the JWT to keep the current session
    const currentSessionId = req.user.session_id ?? '';
    return this.sessionsService.revokeAllOtherById(req.user.sub, currentSessionId);
  }

  @Delete(':id')
  @Permissions({ resource: 'users', action: 'self' })
  async revoke(
    @Req() req: { user: RequestUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.sessionsService.revoke(req.user.sub, id);
  }
}
