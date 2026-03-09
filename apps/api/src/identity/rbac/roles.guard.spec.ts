import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const buildContext = (
    user:
      | { id: string; email: string; roles: string[]; active_company_role?: string | null }
      | undefined,
  ) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  });

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // ─── No required roles ────────────────────────────────────────────────────

  describe('when no roles are required', () => {
    it('returns true when ROLES_KEY is undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = buildContext({ id: 'u1', email: 'a@b.com', roles: [] });
      expect(guard.canActivate(ctx as unknown as ExecutionContext)).toBe(true);
    });

    it('returns true when ROLES_KEY is empty array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const ctx = buildContext({ id: 'u1', email: 'a@b.com', roles: [] });
      expect(guard.canActivate(ctx as unknown as ExecutionContext)).toBe(true);
    });
  });

  // ─── User has a required role ─────────────────────────────────────────────

  describe('when user has a required role', () => {
    it('returns true for exact role match', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = buildContext({
        id: 'u1',
        email: 'a@b.com',
        roles: ['admin'],
      });
      expect(guard.canActivate(ctx as unknown as ExecutionContext)).toBe(true);
    });

    it('returns true when user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'inspector']);
      const ctx = buildContext({
        id: 'u1',
        email: 'a@b.com',
        roles: ['inspector'],
      });
      expect(guard.canActivate(ctx as unknown as ExecutionContext)).toBe(true);
    });

    it('returns true when user has additional roles beyond required', () => {
      reflector.getAllAndOverride.mockReturnValue(['agent']);
      const ctx = buildContext({
        id: 'u1',
        email: 'a@b.com',
        roles: ['buyer_seller', 'agent'],
      });
      expect(guard.canActivate(ctx as unknown as ExecutionContext)).toBe(true);
    });
  });

  // ─── User lacks required role ─────────────────────────────────────────────

  describe('when user lacks required role', () => {
    it('throws ForbiddenException', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = buildContext({
        id: 'u1',
        email: 'a@b.com',
        roles: ['buyer_seller'],
      });
      expect(() =>
        guard.canActivate(ctx as unknown as ExecutionContext),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user has no roles at all', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = buildContext({ id: 'u1', email: 'a@b.com', roles: [] });
      expect(() =>
        guard.canActivate(ctx as unknown as ExecutionContext),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user object is missing', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = buildContext(undefined);
      expect(() =>
        guard.canActivate(ctx as unknown as ExecutionContext),
      ).toThrow(ForbiddenException);
    });
  });

  // ─── Company role (active_company_role) ──────────────────────────────────

  describe('when user has the role via active_company_role', () => {
    it('returns true when active_company_role matches a required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['agent', 'admin']);
      const ctx = buildContext({
        id: 'u1',
        email: 'a@b.com',
        roles: ['buyer_seller'],
        active_company_role: 'agent',
      });
      expect(guard.canActivate(ctx as unknown as ExecutionContext)).toBe(true);
    });

    it('throws ForbiddenException when active_company_role does not match', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = buildContext({
        id: 'u1',
        email: 'a@b.com',
        roles: ['buyer_seller'],
        active_company_role: 'agent',
      });
      expect(() =>
        guard.canActivate(ctx as unknown as ExecutionContext),
      ).toThrow(ForbiddenException);
    });

    it('returns true when active_company_role is null but global role matches', () => {
      reflector.getAllAndOverride.mockReturnValue(['agent']);
      const ctx = buildContext({
        id: 'u1',
        email: 'a@b.com',
        roles: ['agent'],
        active_company_role: null,
      });
      expect(guard.canActivate(ctx as unknown as ExecutionContext)).toBe(true);
    });
  });

  // ─── Error message ────────────────────────────────────────────────────────

  describe('ForbiddenException message', () => {
    it('includes a descriptive message', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = buildContext({ id: 'u1', email: 'a@b.com', roles: [] });
      try {
        guard.canActivate(ctx as unknown as ExecutionContext);
        fail('expected exception');
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
        expect((e as ForbiddenException).message).toContain('role');
      }
    });
  });
});
