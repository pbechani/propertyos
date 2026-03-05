import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UpsertNotificationPreferencesDto } from './notification-preferences.dto';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { Permissions } from '../rbac/permissions.decorator';

type RequestUser = { sub: string; roles: string[] };

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users/me/notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly prefsService: NotificationPreferencesService) {}

  @Get()
  @Permissions({ resource: 'users', action: 'self' })
  async get(@Req() req: { user: RequestUser }) {
    return this.prefsService.get(req.user.sub);
  }

  @Put()
  @Permissions({ resource: 'users', action: 'self' })
  async upsert(
    @Req() req: { user: RequestUser },
    @Body() dto: UpsertNotificationPreferencesDto,
  ) {
    return this.prefsService.upsert(req.user.sub, dto);
  }
}
