import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload } from '../../auth/auth.types';

/** Requires active_company_is_admin === true in JWT */
@Injectable()
export class CompanyAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;

    if (!user?.sub) throw new UnauthorizedException('Not authenticated');
    if (!user.active_company_id) {
      throw new ForbiddenException('No active company context');
    }
    if (!user.active_company_is_admin) {
      throw new ForbiddenException('Company admin access required');
    }

    return true;
  }
}
