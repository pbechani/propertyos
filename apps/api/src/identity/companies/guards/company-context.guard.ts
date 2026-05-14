import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../database';
import { JwtPayload } from '../../auth/auth.types';

/** Validates that the JWT carries an active_company_id and the member is still active */
@Injectable()
export class CompanyContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;

    if (!user?.sub) throw new UnauthorizedException('Not authenticated');
    if (!user.active_company_id) {
      throw new ForbiddenException('No active company context');
    }

    const rows = await this.prisma.$queryRaw<Array<{ status: string }>>`
      SELECT cm.status
      FROM identity.company_members cm
      JOIN identity.companies c ON c.id = cm.company_id
      WHERE cm.user_id = ${user.sub}::uuid
        AND cm.company_id = ${user.active_company_id}::uuid
        AND c.status != 'deactivated'
      LIMIT 1
    `;

    if (!rows[0] || rows[0].status !== 'active') {
      throw new ForbiddenException('Company membership is not active');
    }

    return true;
  }
}
