import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database';

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
    $executeRaw: jest.fn(),
  };

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
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
});
