import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MfaConfigService } from './mfa-config.service';
import {
  AddFido2CredentialDto,
  UpdateMfaChannelsDto,
  VerifyTotpDto,
} from './mfa-config.dto';
import { JwtAuthGuard } from '../rbac/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { Permissions } from '../rbac/permissions.decorator';
import { AuditService } from '../audit.service';

type RequestUser = { sub: string; email: string; roles: string[] };

@ApiTags('MFA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('mfa')
export class MfaConfigController {
  constructor(
    private readonly mfaService: MfaConfigService,
    private readonly auditService: AuditService,
  ) {}

  @Get('status')
  @Permissions({ resource: 'users', action: 'self' })
  async status(@Req() req: { user: RequestUser }) {
    return this.mfaService.getStatus(req.user.sub);
  }

  // ── TOTP ──────────────────────────────────────────────────

  /** Step 1: Generate TOTP secret and return OTP URI for QR code. */
  @Post('totp/setup')
  @Permissions({ resource: 'users', action: 'self' })
  async setupTotp(@Req() req: { user: RequestUser }) {
    return this.mfaService.setupTotp(req.user.sub, req.user.email);
  }

  /** Step 2: Verify first code and persist/enable TOTP. */
  @Post('totp/verify')
  @Permissions({ resource: 'users', action: 'self' })
  async enableTotp(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Body() dto: VerifyTotpDto & { secret: string },
  ) {
    await this.mfaService.verifyAndEnableTotp(req.user.sub, dto.secret, dto.code);

    await this.auditService.log({
      eventId: 'mfa.totp_enabled',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'enable_totp',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { success: true };
  }

  /** Disable TOTP (requires a valid current TOTP code). */
  @Delete('totp')
  @Permissions({ resource: 'users', action: 'self' })
  async disableTotp(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Body() dto: VerifyTotpDto,
  ) {
    await this.mfaService.disableTotp(req.user.sub, dto.code);

    await this.auditService.log({
      eventId: 'mfa.totp_disabled',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'disable_totp',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { success: true };
  }

  // ── Backup codes ──────────────────────────────────────────

  @Post('backup-codes/generate')
  @Permissions({ resource: 'users', action: 'self' })
  async generateBackupCodes(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
  ) {
    const codes = await this.mfaService.generateBackupCodes(req.user.sub);

    await this.auditService.log({
      eventId: 'mfa.backup_codes_generated',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'generate_backup_codes',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: {},
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return {
      codes,
      message: 'Store these codes securely. They will not be shown again.',
    };
  }

  // ── SMS MFA ────────────────────────────────────────────────

  @Put('channels')
  @Permissions({ resource: 'users', action: 'self' })
  async updateChannels(
    @Req() req: { user: RequestUser },
    @Body() dto: UpdateMfaChannelsDto,
  ) {
    if (dto.smsEnabled !== undefined) {
      await this.mfaService.setSmsEnabled(req.user.sub, dto.smsEnabled);
    }
    return this.mfaService.getStatus(req.user.sub);
  }

  // ── FIDO2 / WebAuthn ──────────────────────────────────────

  @Post('fido2/credentials')
  @Permissions({ resource: 'users', action: 'self' })
  async addFido2Credential(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Body() dto: AddFido2CredentialDto,
  ) {
    await this.mfaService.addFido2Credential(req.user.sub, {
      id: dto.credentialId,
      publicKey: dto.publicKey,
      deviceType: dto.deviceType,
      deviceName: dto.deviceName,
    });

    await this.auditService.log({
      eventId: 'mfa.fido2_credential_added',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'add_fido2_credential',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: { credentialId: dto.credentialId, deviceName: dto.deviceName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { success: true };
  }

  @Delete('fido2/credentials/:credentialId')
  @Permissions({ resource: 'users', action: 'self' })
  async removeFido2Credential(
    @Req() req: { user: RequestUser; ip: string; headers: Record<string, string> },
    @Param('credentialId') credentialId: string,
  ) {
    await this.mfaService.removeFido2Credential(req.user.sub, credentialId);

    await this.auditService.log({
      eventId: 'mfa.fido2_credential_removed',
      actorId: req.user.sub,
      actorRole: req.user.roles[0] ?? null,
      action: 'remove_fido2_credential',
      resourceType: 'user',
      resourceId: req.user.sub,
      payload: { credentialId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { success: true };
  }
}
