import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './rbac/jwt-auth.guard';
import { RolesGuard } from './rbac/roles.guard';
import { Roles } from './rbac/roles.decorator';
import { PermissionsGuard } from './rbac/permissions.guard';
import { Permissions } from './rbac/permissions.decorator';
import { AssignRoleDto, UpdateMeDto, UpdateUserStatusDto } from './users.dto';
import { AuditService } from './audit.service';
import { AuthService } from './auth/auth.service';
import { DocumentStorageService } from './document-storage.service';

type RequestUser = {
  sub: string;
  roles: string[];
};

type MeResponse = Record<string, unknown> & {
  role: string | null;
  roles: string[];
};

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
    private readonly documentStorageService: DocumentStorageService,
  ) {}

  @Get('me')
  @Permissions({ resource: 'users', action: 'self' })
  async me(
    @Req() req: { user: RequestUser },
  ): Promise<MeResponse> {
    const [user, roleNames] = await Promise.all([
      this.usersService.findById(req.user.sub),
      this.usersService.getUserRoleNames(req.user.sub),
    ]);

    return {
      ...this.usersService.sanitizeUser(user),
      role: roleNames[0] ?? null,
      roles: roleNames,
    };
  }

  @Patch('me')
  @Permissions({ resource: 'users', action: 'self' })
  async updateMe(
    @Req()
    req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Body() body: UpdateMeDto,
  ): Promise<Record<string, unknown>> {
    // L3: skip the DB write and audit entry when no fields are actually changing
    const hasUpdates = Object.values(body).some((v) => v !== undefined);
    if (!hasUpdates) {
      const user = await this.usersService.findById(req.user.sub);
      return this.usersService.sanitizeUser(user);
    }

    const updated = await this.usersService.updateMe(req.user.sub, body);

    await this.auditService.log({
      eventId: 'user.updated',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'update_profile',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: { updatedFields: Object.entries(body).filter(([, v]) => v !== undefined).map(([k]) => k) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.usersService.sanitizeUser(updated);
  }

  @Post('me/avatar')
  @Permissions({ resource: 'users', action: 'self' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadMeAvatar(
    @Req()
    req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Record<string, unknown>> {
    this.logger.log(
      `Avatar upload request accepted for user=${req.user.sub} filePresent=${Boolean(file)} mime=${file?.mimetype ?? '-'} size=${file?.size ?? 0}`,
    );

    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    const uploaded = await this.documentStorageService.upload({
      context: 'avatars',
      userId: req.user.sub,
      documentType: 'profile',
      file,
    });

    const updated = await this.usersService.updateMe(req.user.sub, {
      avatarUrl: uploaded.publicUrl,
    });

    await this.auditService.log({
      eventId: 'user.avatar_updated',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'update_avatar',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: { avatarPath: uploaded.storagePath },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.usersService.sanitizeUser(updated);
  }

  @Roles('admin')
  @Get(':id')
  @Permissions({ resource: 'users', action: 'full' })
  async findUserById(
    @Req()
    req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Record<string, unknown>> {
    const user = await this.usersService.findById(id);

    await this.auditService.log({
      eventId: 'user.accessed',
      actorId: req.user.sub,
      actorRole: 'admin',
      action: 'read_user',
      resourceType: 'user',
      resourceId: id,
      payload: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return this.usersService.sanitizeUser(user);
  }

  @Roles('admin')
  @Patch(':id/status')
  @Permissions({ resource: 'users', action: 'full' })
  async updateUserStatus(
    @Req()
    req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserStatusDto,
  ): Promise<Record<string, unknown>> {
    const user = await this.usersService.updateStatus(id, body.status);

    if (body.status === 'suspended' || body.status === 'deleted') {
      await this.authService.revokeAllSessions(id);
    }

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
  @Permissions({ resource: 'users', action: 'full' })
  async listRoles(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Array<{ id: string; name: string; display_name: string }>> {
    return this.usersService.listUserRoles(id);
  }

  @Roles('admin')
  @Post(':id/roles')
  @Permissions({ resource: 'users', action: 'full' })
  async assignRole(
    @Req()
    req: { user: RequestUser; ip: string; headers: Record<string, string> },
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
  @Permissions({ resource: 'users', action: 'full' })
  async removeRole(
    @Req()
    req: { user: RequestUser; ip: string; headers: Record<string, string> },
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
