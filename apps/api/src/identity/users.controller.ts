import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './rbac/jwt-auth.guard';
import { RolesGuard } from './rbac/roles.guard';
import { Roles } from './rbac/roles.decorator';
import { AssignRoleDto, UpdateMeDto, UpdateUserStatusDto } from './users.dto';
import { AuditService } from './audit.service';

type RequestUser = {
  sub: string;
  roles: string[];
};

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get('me')
  async me(@Req() req: { user: RequestUser }): Promise<Record<string, unknown>> {
    const user = await this.usersService.findById(req.user.sub);
    return this.usersService.sanitizeUser(user);
  }

  @Patch('me')
  async updateMe(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Body() body: UpdateMeDto,
  ): Promise<Record<string, unknown>> {
    const updated = await this.usersService.updateMe(req.user.sub, body);

    await this.auditService.log({
      eventId: 'user.updated',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'update_profile',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: { updatedFields: Object.keys(body) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.usersService.sanitizeUser(updated);
  }

  @Roles('admin')
  @Get(':id')
  async findUserById(@Param('id', new ParseUUIDPipe()) id: string): Promise<Record<string, unknown>> {
    const user = await this.usersService.findById(id);
    return this.usersService.sanitizeUser(user);
  }

  @Roles('admin')
  @Patch(':id/status')
  async updateUserStatus(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserStatusDto,
  ): Promise<Record<string, unknown>> {
    const user = await this.usersService.updateStatus(id, body.status);

    await this.auditService.log({
      eventId: 'user.status_changed',
      actorId: req.user.sub,
      actorRole: 'admin',
      action: 'update_status',
      resourceType: 'user',
      resourceId: id,
      payload: { status: body.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.usersService.sanitizeUser(user);
  }

  @Roles('admin')
  @Get(':id/roles')
  async listRoles(@Param('id', new ParseUUIDPipe()) id: string): Promise<Array<{ id: string; name: string; display_name: string }>> {
    return this.usersService.listUserRoles(id);
  }

  @Roles('admin')
  @Post(':id/roles')
  async assignRole(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: AssignRoleDto,
  ): Promise<{ success: boolean }> {
    await this.usersService.assignRole(id, body.role, req.user.sub);

    await this.auditService.log({
      eventId: 'user.role_assigned',
      actorId: req.user.sub,
      actorRole: 'admin',
      action: 'assign_role',
      resourceType: 'user',
      resourceId: id,
      payload: { role: body.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { success: true };
  }

  @Roles('admin')
  @Delete(':id/roles/:roleId')
  async removeRole(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
  ): Promise<{ success: boolean }> {
    await this.usersService.removeRole(id, roleId);

    await this.auditService.log({
      eventId: 'user.role_removed',
      actorId: req.user.sub,
      actorRole: 'admin',
      action: 'remove_role',
      resourceType: 'user',
      resourceId: id,
      payload: { roleId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { success: true };
  }
}
