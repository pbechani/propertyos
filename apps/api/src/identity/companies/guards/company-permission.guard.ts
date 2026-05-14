import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database';
import { JwtPayload } from '../../auth/auth.types';

export const COMPANY_PERMISSION_KEY = 'company_permission';

export type CompanyPermission = { resource: string; action: string };

export const CompanyPermission = (resource: string, action: string) =>
  SetMetadata(COMPANY_PERMISSION_KEY, { resource, action });

/** Validates the acting member's permissions JSONB contains the required resource/action */
@Injectable()
export class CompanyPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<CompanyPermission | null>(
      COMPANY_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No specific permission required → just check context
    if (!required) return true;

    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;

    if (!user?.sub) throw new UnauthorizedException('Not authenticated');
    if (!user.active_company_id) {
      throw new ForbiddenException('No active company context');
    }

    // Company admins bypass per-permission checks
    if (user.active_company_is_admin) return true;

    const rows = await this.prisma.$queryRaw<
      Array<{ permissions: Array<{ resource: string; action: string }>; is_admin: boolean }>
    >`
      SELECT permissions, is_admin
      FROM identity.company_members
      WHERE user_id = ${user.sub}::uuid
        AND company_id = ${user.active_company_id}::uuid
        AND status = 'active'
      LIMIT 1
    `;

    const member = rows[0];
    if (!member) throw new UnauthorizedException('Not a member of this company');

    // DB-level admin also bypasses
    if (member.is_admin) return true;

    const perms = Array.isArray(member.permissions) ? member.permissions : [];
    const granted = perms.some(
      (p) => p.resource === required.resource && p.action === required.action,
    );

    if (!granted) {
      throw new ForbiddenException(
        `Missing company permission: ${required.resource}:${required.action}`,
      );
    }

    return true;
  }
}
