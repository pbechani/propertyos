import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users.service';
import {
  PERMISSIONS_KEY,
  RequiredPermission,
} from './permissions.decorator';

type AuthenticatedUser = {
  sub: string;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const userId = request.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const effectivePermissions = await this.usersService.getUserPermissions(
      userId,
    );
    const permissionSet = new Set(
      effectivePermissions.map((permission) =>
        `${permission.resource}:${permission.action}`.toLowerCase(),
      ),
    );

    const hasAllPermissions = requiredPermissions.every((permission) => {
      const resource = permission.resource.toLowerCase();
      const action = permission.action.toLowerCase();

      return (
        permissionSet.has(`${resource}:${action}`) ||
        permissionSet.has(`${resource}:full`)
      );
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
