import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { UsersService } from '../users.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let usersService: jest.Mocked<Pick<UsersService, 'getUserPermissions'>>;

  const buildContext = (user?: { sub: string }) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    usersService = {
      getUserPermissions: jest.fn(),
    } as unknown as jest.Mocked<Pick<UsersService, 'getUserPermissions'>>;

    guard = new PermissionsGuard(
      reflector,
      usersService as unknown as UsersService,
    );
  });

  it('returns true when no permissions are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(buildContext({ sub: 'u1' }))).resolves.toBe(
      true,
    );
  });

  it('throws UnauthorizedException when user is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      { resource: 'users', action: 'self' },
    ]);

    await expect(guard.canActivate(buildContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns true when user has exact required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      { resource: 'users', action: 'self' },
    ]);
    usersService.getUserPermissions.mockResolvedValue([
      { resource: 'users', action: 'self' },
    ]);

    await expect(guard.canActivate(buildContext({ sub: 'u1' }))).resolves.toBe(
      true,
    );
  });

  it('returns true when user has full permission for resource', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      { resource: 'users', action: 'self' },
    ]);
    usersService.getUserPermissions.mockResolvedValue([
      { resource: 'users', action: 'full' },
    ]);

    await expect(guard.canActivate(buildContext({ sub: 'u1' }))).resolves.toBe(
      true,
    );
  });

  it('throws ForbiddenException when permission is missing', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      { resource: 'users', action: 'self' },
    ]);
    usersService.getUserPermissions.mockResolvedValue([
      { resource: 'kyc', action: 'submit' },
    ]);

    await expect(guard.canActivate(buildContext({ sub: 'u1' }))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
