import { SetMetadata } from '@nestjs/common';

export type RequiredPermission = {
  resource: string;
  action: string;
};

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (
  ...permissions: RequiredPermission[]
): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, permissions);
