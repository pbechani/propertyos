import { SetMetadata } from '@nestjs/common';
import { IdentityRole } from '../identity.constants';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: IdentityRole[]) =>
  SetMetadata(ROLES_KEY, roles);
