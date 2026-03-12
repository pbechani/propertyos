import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../../database';

describe('SessionsService', () => {
  let service: SessionsService;

  const USER_ID = 'user-uuid-0001';
  const SESSION_ID = 'sess-uuid-0001';
  const OLD_HASH = 'oldhash';
  const NEW_HASH = 'newhash';
  const EXPIRES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const baseInput = {
    userId: USER_ID,
    sessionTokenHash: NEW_HASH,
    ipAddress: '127.0.0.1',
    deviceName: 'jest-ua',
    expiresAt: EXPIRES_AT,
  };

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(SessionsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('returns the new session id', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: SESSION_ID }]);
      const result = await service.create(baseInput);
      expect(result).toEqual({ id: SESSION_ID });
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('returns the id even when ON CONFLICT reuses the existing row', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'existing-sess' }]);
      const result = await service.create(baseInput);
      expect(result.id).toBe('existing-sess');
    });
  });

  // ─── rotate ────────────────────────────────────────────────────────────────

  describe('rotate()', () => {
    it('returns the same session id when old hash matches', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: SESSION_ID }]);
      const result = await service.rotate(OLD_HASH, baseInput);
      expect(result).toEqual({ id: SESSION_ID });
    });

    it('falls back to create() when old session not found', async () => {
      // UPDATE returns empty → fallback INSERT returns new row
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // UPDATE (rotate) — no row found
        .mockResolvedValueOnce([{ id: 'new-sess' }]); // INSERT (create fallback)
      const result = await service.rotate(OLD_HASH, baseInput);
      expect(result).toEqual({ id: 'new-sess' });
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });

  // ─── listActive ────────────────────────────────────────────────────────────

  describe('listActive()', () => {
    it('returns raw rows from the DB', async () => {
      const rows = [
        {
          id: SESSION_ID,
          user_id: USER_ID,
          session_token_hash: NEW_HASH,
          device_fingerprint: null,
          device_name: 'Chrome',
          ip_address: '1.2.3.4',
          country_code: null,
          last_active_at: new Date(),
          expires_at: EXPIRES_AT,
          revoked_at: null,
          created_at: new Date(),
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValueOnce(rows);
      const result = await service.listActive(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(SESSION_ID);
    });

    it('returns empty array when no active sessions', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.listActive(USER_ID);
      expect(result).toEqual([]);
    });
  });

  // ─── revoke ────────────────────────────────────────────────────────────────

  describe('revoke()', () => {
    it('returns { revoked: true } when session found and updated', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: SESSION_ID }]);
      const result = await service.revoke(USER_ID, SESSION_ID);
      expect(result).toEqual({ revoked: true });
    });

    it('returns { revoked: false } when session not found or already revoked', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.revoke(USER_ID, 'bad-id');
      expect(result).toEqual({ revoked: false });
    });
  });

  // ─── revokeAllOtherById ────────────────────────────────────────────────────

  describe('revokeAllOtherById()', () => {
    it('returns count of revoked sessions', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
      const result = await service.revokeAllOtherById(USER_ID, SESSION_ID);
      expect(result).toEqual({ count: 2 });
    });

    it('returns { count: 0 } when no other sessions exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.revokeAllOtherById(USER_ID, SESSION_ID);
      expect(result).toEqual({ count: 0 });
    });
  });

  // ─── revokeAll ─────────────────────────────────────────────────────────────

  describe('revokeAll()', () => {
    it('executes without error', async () => {
      mockPrisma.$executeRaw.mockResolvedValueOnce(1);
      await expect(service.revokeAll(USER_ID)).resolves.toBeUndefined();
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });
});
