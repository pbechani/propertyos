import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompanyAdminGuard } from './company-admin.guard';
import { CompanyContextGuard } from './company-context.guard';
import { CompanyPermissionGuard } from './company-permission.guard';
import { PrismaService } from '../../../database';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildExecutionContext(user: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

// ─── CompanyAdminGuard ────────────────────────────────────────────────────────

describe('CompanyAdminGuard', () => {
  let guard: CompanyAdminGuard;

  beforeEach(() => {
    guard = new CompanyAdminGuard();
  });

  const user = (overrides = {}) => ({
    sub: 'user-id',
    active_company_id: 'comp-id',
    active_company_role: 'agent',
    active_company_is_admin: false,
    ...overrides,
  });

  it('allows access when user is admin', () => {
    const ctx = buildExecutionContext(user({ active_company_is_admin: true }));
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user is not admin', () => {
    const ctx = buildExecutionContext(user({ active_company_is_admin: false }));
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when no active company context', () => {
    const ctx = buildExecutionContext({ sub: 'user-id' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

// ─── CompanyContextGuard ─────────────────────────────────────────────────────

describe('CompanyContextGuard', () => {
  let guard: CompanyContextGuard;

  const mockPrisma = { $queryRaw: jest.fn() };

  beforeEach(() => {
    guard = new CompanyContextGuard(mockPrisma as unknown as PrismaService);
    jest.clearAllMocks();
  });

  const user = (overrides = {}) => ({
    sub: 'user-id',
    active_company_id: 'comp-id',
    active_company_role: 'agent',
    active_company_is_admin: false,
    ...overrides,
  });

  it('allows access when membership is active in DB', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ status: 'active' }]);
    const ctx = buildExecutionContext(user());
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when membership is revoked in DB', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const ctx = buildExecutionContext(user());
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when no active_company_id in JWT', async () => {
    const ctx = buildExecutionContext({ sub: 'user-id' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});

// ─── CompanyPermissionGuard ───────────────────────────────────────────────────

describe('CompanyPermissionGuard', () => {
  let guard: CompanyPermissionGuard;
  let reflector: Reflector;

  const mockPrisma = { $queryRaw: jest.fn() };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CompanyPermissionGuard(
      reflector,
      mockPrisma as unknown as PrismaService,
    );
    jest.clearAllMocks();
    mockPrisma.$queryRaw.mockReset();
  });

  const buildCtx = (
    user: Record<string, unknown>,
    metadata: { resource: string; action: string } | null = null,
  ): ExecutionContext => {
    const ctx = buildExecutionContext(user);
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(metadata);
    return ctx;
  };

  const user = () => ({
    sub: 'user-id',
    active_company_id: 'comp-id',
    active_company_role: 'agent',
    active_company_is_admin: false,
  });

  it('allows access when no permission requirement is set', async () => {
    const ctx = buildCtx(user(), null);
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ permissions: [] }]);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows access when member has the required permission', async () => {
    const ctx = buildCtx(user(), { resource: 'property', action: 'create' });
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { permissions: [{ resource: 'property', action: 'create' }] },
    ]);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when member lacks required permission', async () => {
    const ctx = buildCtx(user(), { resource: 'property', action: 'delete' });
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ permissions: [] }]);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows access when member is_admin (admin bypasses permission check)', async () => {
    const adminUser = { ...user(), active_company_is_admin: true };
    const ctx = buildCtx(adminUser, { resource: 'sensitive', action: 'delete' });
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { permissions: [], is_admin: true },
    ]);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
