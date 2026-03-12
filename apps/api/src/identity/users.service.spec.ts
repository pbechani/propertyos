import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database';
import { NotificationService } from './notification.service';

describe('UsersService', () => {
  let service: UsersService;

  const baseUser = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'test@example.com',
    phone: null,
    first_name: 'Alice',
    last_name: 'Smith',
    avatar_url: null,
    status: 'active',
    email_verified_at: null,
    phone_verified_at: null,
    last_login_at: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
  };

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockNotificationService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendSms: jest.fn().mockResolvedValue(undefined),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns user when found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseUser]);
      const result = await service.findById(baseUser.id);
      expect(result).toEqual(baseUser);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.findById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findByEmail ──────────────────────────────────────────────────────────

  describe('findByEmail', () => {
    it('returns user with password_hash when found', async () => {
      const withHash = { ...baseUser, password_hash: '$2b$12$hash' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([withHash]);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(withHash);
    });

    it('returns null when email not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns new user', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: baseUser.id }]) // INSERT RETURNING id
        .mockResolvedValueOnce([baseUser]);            // findById SELECT
      const result = await service.create({
        email: 'test@example.com',
        passwordHash: '$2b$12$hash',
        firstName: 'Alice',
        lastName: 'Smith',
      });
      expect(result).toEqual(baseUser);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });

  // ─── updateMe ─────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('merges partial updates with current values', async () => {
      const updated = { ...baseUser, first_name: 'Bob' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseUser]) // findById current
        .mockResolvedValueOnce([updated]); // UPDATE ... RETURNING
      const result = await service.updateMe(baseUser.id, { firstName: 'Bob' });
      expect(result.first_name).toBe('Bob');
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('updates and returns user with new status', async () => {
      const suspended = { ...baseUser, status: 'suspended' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: baseUser.id }]) // UPDATE RETURNING id
        .mockResolvedValueOnce([suspended]);           // findById SELECT
      const result = await service.updateStatus(baseUser.id, 'suspended');
      expect(result.status).toBe('suspended');
    });

    it('throws NotFoundException when no row affected', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.updateStatus('ghost-id', 'active')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── listUserRoles ────────────────────────────────────────────────────────

  describe('listUserRoles', () => {
    it('returns list of role objects', async () => {
      const roles = [
        { id: 'r1', name: 'buyer_seller', display_name: 'Buyer / Seller' },
      ];
      mockPrisma.$queryRaw.mockResolvedValueOnce(roles);
      const result = await service.listUserRoles(baseUser.id);
      expect(result).toEqual(roles);
    });
  });

  // ─── assignRole ───────────────────────────────────────────────────────────

  describe('assignRole', () => {
    it('resolves role and upserts user_role row', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'role-uuid' }]); // SELECT role
      mockPrisma.$executeRaw.mockResolvedValueOnce(1n);
      await expect(
        service.assignRole(baseUser.id, 'buyer_seller', baseUser.id),
      ).resolves.toBeUndefined();
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException for invalid role name', async () => {
      await expect(
        service.assignRole(baseUser.id, 'super_villain', baseUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when role row missing from db', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // role not found
      await expect(
        service.assignRole(baseUser.id, 'admin', baseUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── removeRole ───────────────────────────────────────────────────────────

  describe('removeRole', () => {
    it('calls DELETE without throwing', async () => {
      mockPrisma.$executeRaw.mockResolvedValueOnce(1n);
      await expect(
        service.removeRole(baseUser.id, 'role-uuid'),
      ).resolves.toBeUndefined();
    });
  });

  // ─── getUserRoleNames ─────────────────────────────────────────────────────

  describe('getUserRoleNames', () => {
    it('returns array of role name strings', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { name: 'buyer_seller' },
        { name: 'agent' },
      ]);
      const result = await service.getUserRoleNames(baseUser.id);
      expect(result).toEqual(['buyer_seller', 'agent']);
    });

    it('returns empty array when user has no roles', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.getUserRoleNames(baseUser.id);
      expect(result).toEqual([]);
    });
  });

  // ─── getLatestKycStatus ───────────────────────────────────────────────────

  describe('getLatestKycStatus', () => {
    it('returns status string from latest KYC row', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ status: 'approved' }]);
      const result = await service.getLatestKycStatus(baseUser.id);
      expect(result).toBe('approved');
    });

    it('returns null when no KYC record exists', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.getLatestKycStatus(baseUser.id);
      expect(result).toBeNull();
    });
  });

  // ─── markLastLogin / markEmailVerified ────────────────────────────────────

  describe('markLastLogin', () => {
    it('executes UPDATE without throwing', async () => {
      mockPrisma.$executeRaw.mockResolvedValueOnce(1n);
      await expect(service.markLastLogin(baseUser.id)).resolves.toBeUndefined();
    });
  });

  describe('markEmailVerified', () => {
    it('executes UPDATE without throwing', async () => {
      mockPrisma.$executeRaw.mockResolvedValueOnce(1n);
      await expect(
        service.markEmailVerified(baseUser.id),
      ).resolves.toBeUndefined();
    });
  });

  // ─── listUsers ────────────────────────────────────────────────────────────

  describe('listUsers', () => {
    const makeRow = (overrides: Record<string, unknown> = {}) => ({
      id: 'user-001',
      email: 'alice@example.com',
      first_name: 'Alice',
      last_name: 'Smith',
      phone: null,
      status: 'active',
      created_at: new Date('2026-01-15T00:00:00.000Z'),
      primary_role: 'agent',
      kyc_status: 'approved',
      company_count: 1n,
      total: 1n,
      ...overrides,
    });

    it('maps DB rows to camelCase output', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([makeRow()]);
      const result = await service.listUsers();
      expect(result.total).toBe(1);
      expect(result.data[0]).toMatchObject({
        id: 'user-001',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        role: 'agent',
        kycStatus: 'approved',
        companyCount: 1,
        status: 'active',
      });
    });

    it('returns empty data and total 0 when no rows', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([]);
      const result = await service.listUsers();
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('handles null role and kyc_status gracefully', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([
        makeRow({ primary_role: null, kyc_status: null }),
      ]);
      const result = await service.listUsers();
      expect(result.data[0].role).toBeNull();
      expect(result.data[0].kycStatus).toBeNull();
    });

    it('caps limit at 500', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([]);
      await service.listUsers({ limit: 9999 });
      const call = (mockPrisma.$queryRawUnsafe as jest.Mock).mock.calls[0][0] as string;
      expect(call).toContain('LIMIT 500');
    });
  });

  // ─── sanitizeUser ─────────────────────────────────────────────────────────

  describe('sanitizeUser', () => {
    it('maps snake_case DB fields to camelCase DTO', () => {
      const result = service.sanitizeUser(baseUser);
      expect(result).toMatchObject({
        id: baseUser.id,
        email: baseUser.email,
        firstName: baseUser.first_name,
        lastName: baseUser.last_name,
        status: baseUser.status,
      });
    });

    it('does not include password_hash in output', () => {
      const result = service.sanitizeUser(baseUser);
      expect(Object.keys(result)).not.toContain('password_hash');
    });
  });

  // ─── investigateUser ─────────────────────────────────────────────────────

  describe('investigateUser', () => {
    it('updates status to under_investigation and returns user', async () => {
      const investigated = { ...baseUser, status: 'under_investigation' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: baseUser.id }])  // updateStatus UPDATE
        .mockResolvedValueOnce([investigated])           // findById SELECT
        .mockResolvedValueOnce([]);                      // notifyUserCompanyAdmins (no admins)
      const result = await service.investigateUser(baseUser.id);
      expect(result.status).toBe('under_investigation');
    });

    it('notifies company admins when user has company memberships', async () => {
      const investigated = { ...baseUser, status: 'under_investigation' };
      const adminRow = { email: 'boss@company.com', phone: null, company_name: 'Acme' };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: baseUser.id }])
        .mockResolvedValueOnce([investigated])
        .mockResolvedValueOnce([adminRow]);
      await service.investigateUser(baseUser.id, 'suspected fraud');
      // allow void promise to settle
      await new Promise(setImmediate);
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
        adminRow.email,
        expect.stringContaining('investigation'),
        expect.stringContaining('Reason: suspected fraud'),
      );
    });

    it('throws NotFoundException when userId does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.investigateUser('ghost-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── suspendUser ──────────────────────────────────────────────────────────

  describe('suspendUser', () => {
    // Helper: sets up the standard 4-call $queryRaw sequence for a successful suspend.
    // Call order:
    //   [0] updateStatus UPDATE → [{ id }]
    //   [1] findById SELECT     → [userRow]
    //   [2] notifyUserCompanyAdmins (void async) → []      (no company admins)
    //   [3] selfCompanyRows     → selfRows (array)
    function setupSuspendMocks(
      userRow: typeof baseUser & { status: string },
      selfRows: Array<{ company_id: string }> = [],
      adminRows: Array<{ email: string; phone: null; company_name: string }> = [],
    ) {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: userRow.id }])  // [0] UPDATE RETURNING id
        .mockResolvedValueOnce([userRow])              // [1] findById SELECT
        .mockResolvedValueOnce(adminRows)              // [2] notifyUserCompanyAdmins
        .mockResolvedValueOnce(selfRows);              // [3] selfCompanyRows
    }

    it('updates status to suspended and returns user', async () => {
      const suspended = { ...baseUser, status: 'suspended' };
      setupSuspendMocks(suspended);
      const result = await service.suspendUser(baseUser.id);
      expect(result.status).toBe('suspended');
    });

    it('emails the suspended user directly', async () => {
      const suspended = { ...baseUser, status: 'suspended' };
      setupSuspendMocks(suspended);
      await service.suspendUser(baseUser.id, 'policy violation');
      await new Promise(setImmediate);
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
        baseUser.email,
        expect.stringContaining('suspended'),
        expect.stringContaining('policy violation'),
      );
    });

    it('notifies company admins with reason', async () => {
      const suspended = { ...baseUser, status: 'suspended' };
      const adminRow = { email: 'admin@corp.com', phone: null, company_name: 'Corp' };
      setupSuspendMocks(suspended, [], [adminRow]);
      await service.suspendUser(baseUser.id, 'fraud');
      await new Promise(setImmediate);
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
        adminRow.email,
        expect.stringContaining('suspended'),
        expect.stringContaining('fraud'),
      );
    });

    it('throws NotFoundException when userId does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.suspendUser('ghost-id')).rejects.toThrow(NotFoundException);
    });

    it('revokes non-self-company memberships when a self company is found', async () => {
      const suspended = { ...baseUser, status: 'suspended' };
      const selfCompanyId = 'self-co-uuid';
      setupSuspendMocks(suspended, [{ company_id: selfCompanyId }]);
      mockPrisma.$executeRaw.mockResolvedValue(1n);

      await service.suspendUser(baseUser.id);

      // 3 $executeRaw calls: revoke non-self memberships | agent_suspended=true | status=inactive
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(3);
    });

    it('revokes ALL memberships when no self company is found', async () => {
      const suspended = { ...baseUser, status: 'suspended' };
      setupSuspendMocks(suspended, []); // no self company
      mockPrisma.$executeRaw.mockResolvedValue(1n);

      await service.suspendUser(baseUser.id);

      // Still 3 $executeRaw calls: revoke all memberships | agent_suspended=true | status=inactive all
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(3);
    });

    it('does not throw if user has no listings or memberships', async () => {
      const suspended = { ...baseUser, status: 'suspended' };
      setupSuspendMocks(suspended, [{ company_id: 'self-co-uuid' }]);
      mockPrisma.$executeRaw.mockResolvedValue(0n); // 0 rows affected — no memberships/listings

      await expect(service.suspendUser(baseUser.id)).resolves.toBeDefined();
    });
  });

  // ─── reinstateUser ────────────────────────────────────────────────────────

  describe('reinstateUser', () => {
    // Helper: sets up $queryRaw for the 3 calls that happen AFTER the two $executeRaw side-effects.
    // Call order inside reinstateUser:
    //   $executeRaw [0] restore self-company listings
    //   $executeRaw [1] clear agent_suspended
    //   $queryRaw  [0]  updateStatus UPDATE → [{ id }]
    //   $queryRaw  [1]  findById SELECT     → [userRow]
    //   $queryRaw  [2]  notifyUserCompanyAdmins (void async) → []
    function setupReinstateMocks(userRow: typeof baseUser & { status: string }) {
      mockPrisma.$executeRaw.mockResolvedValue(1n);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: userRow.id }])
        .mockResolvedValueOnce([userRow])
        .mockResolvedValueOnce([]);
    }

    it('updates status to active and returns user', async () => {
      const reinstated = { ...baseUser, status: 'active' };
      setupReinstateMocks(reinstated);
      const result = await service.reinstateUser(baseUser.id);
      expect(result.status).toBe('active');
    });

    it('emails the reinstated user', async () => {
      const reinstated = { ...baseUser, status: 'active' };
      setupReinstateMocks(reinstated);
      await service.reinstateUser(baseUser.id);
      await new Promise(setImmediate);
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
        baseUser.email,
        expect.stringContaining('reinstated'),
        expect.any(String),
      );
    });

    it('restores self-company listings and clears agent_suspended before status update', async () => {
      const reinstated = { ...baseUser, status: 'active' };
      setupReinstateMocks(reinstated);

      await service.reinstateUser(baseUser.id);

      // 2 $executeRaw calls: restore listings + clear agent_suspended
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
    });

    it('throws NotFoundException when userId does not exist', async () => {
      // $executeRaw calls happen first (succeed silently), then updateStatus throws
      mockPrisma.$executeRaw.mockResolvedValue(0n);
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // updateStatus UPDATE → 0 rows → throw
      await expect(service.reinstateUser('ghost-id')).rejects.toThrow(NotFoundException);
    });
  });
});
