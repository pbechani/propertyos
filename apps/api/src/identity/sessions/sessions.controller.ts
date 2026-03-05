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

type RequestUser = { sub: string; roles: string[] };

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users/me/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Permissions({ resource: 'users', action: 'self' })
  async listActive(@Req() req: { user: RequestUser }) {
    return this.sessionsService.listActive(req.user.sub);
  }

  @Delete()
  @Permissions({ resource: 'users', action: 'self' })
  async revokeAllOther(
    @Req() req: { user: RequestUser; headers: Record<string, string> },
  ) {
    // The current session token hash is not directly available in JWT payload,
    // so revokeAll except current — derive from Authorization header
    const authHeader = req.headers['authorization'] ?? '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '');

    // Hash the current access token to identify this session
    const { createHash } = await import('crypto');
    const currentHash = createHash('sha256').update(bearerToken).digest('hex');

    return this.sessionsService.revokeAllOther(req.user.sub, currentHash);
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
