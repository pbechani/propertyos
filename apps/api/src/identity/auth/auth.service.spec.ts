import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users.service';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';
import { RedisService } from '../../cache';
import { PrismaService } from '../../database';

describe('AuthService', () => {
  let service: AuthService;

  const USER_ID = 'user-uuid-0001';
  const EMAIL = 'alice@example.com';
  const PASSWORD = 'StrongP@ss1';
  const PASSWORD_HASH = '$2b$12$validhash';

  const baseUser = {
    id: USER_ID,
    email: EMAIL,
    phone: null,
    first_name: 'Alice',
    last_name: 'Smith',
    avatar_url: null,
    status: 'active',
    email_verified_at: null,
    phone_verified_at: null,
    last_login_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    password_hash: PASSWORD_HASH,
  };

  const mockConfig = {
    get: jest.fn((key: string, def?: unknown) => {
      const map: Record<string, unknown> = {
        JWT_EXPIRY: '15m',
        REFRESH_TOKEN_EXPIRY: '7d',
        BCRYPT_ROUNDS: 1,            // use 1 round in tests for speed
        EMAIL_VERIFICATION_TOKEN_EXPIRY_MINUTES: 60,
        PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: 30,
        FRONTEND_URL: 'http://localhost:3000',
        JWT_SECRET: 'test-secret-32-chars-minimum-length!',
      };
      return map[key] ?? def;
    }),
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('signed-access-token'),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    getJson: jest.fn(),
    setJson: jest.fn().mockResolvedValue('OK'),
  };

  const mockUsers = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    assignRole: jest.fn(),
    getUserRoleNames: jest.fn().mockResolvedValue(['buyer_seller']),
    getLatestKycStatus: jest.fn().mockResolvedValue('pending'),
    markLastLogin: jest.fn(),
    markEmailVerified: jest.fn(),
    sanitizeUser: jest.fn((u) => ({ id: u.id, email: u.email })),
  };

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotification = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendSms: jest.fn().mockResolvedValue(undefined),
  };

  const requestCtx = { ip: '127.0.0.1', userAgent: 'jest' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: JwtService, useValue: mockJwt },
        { provide: RedisService, useValue: mockRedis },
        { provide: UsersService, useValue: mockUsers },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = Object.assign(
      Object.create({ isValidRole: () => true }),
      { email: EMAIL, password: PASSWORD, firstName: 'Alice', lastName: 'Smith', role: 'buyer_seller' },
    );

    it('creates user, assigns role, sends verification email, and returns tokens', async () => {
      mockUsers.findByEmail.mockResolvedValueOnce(null);     // not existing
      mockUsers.create.mockResolvedValueOnce(baseUser);
      mockUsers.assignRole.mockResolvedValueOnce(undefined);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'refresh-id' }]); // insert refresh token

      const result = await service.register(dto, requestCtx);

      expect(result.tokens.accessToken).toBe('signed-access-token');
      expect(mockNotification.sendEmail).toHaveBeenCalledWith(
        EMAIL,
        expect.stringContaining('Verify'),
        expect.stringContaining('verify-email'),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'user.registered' }),
      );
    });

    it('throws BadRequestException when email already exists', async () => {
      mockUsers.findByEmail.mockResolvedValueOnce(baseUser);
      await expect(service.register(dto, requestCtx)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for invalid role', async () => {
      const badRoleDto = Object.assign(
        Object.create({ isValidRole: () => false }),
        dto,
        { role: 'overlord' },
      );
      await expect(service.register(badRoleDto, requestCtx)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    // Use real bcrypt for the valid-password test because we need a matching hash
    const bcrypt = require('bcrypt');

    it('returns tokens for correct credentials', async () => {
      const hash = bcrypt.hashSync(PASSWORD, 1);
      mockRedis.get.mockResolvedValueOnce(null);                         // no failed attempts
      mockUsers.findByEmail.mockResolvedValueOnce({ ...baseUser, password_hash: hash });
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'refresh-id' }]); // insert refresh token

      const result = await service.login({ email: EMAIL, password: PASSWORD }, requestCtx);

      expect(result.tokens.accessToken).toBe('signed-access-token');
      expect(mockUsers.markLastLogin).toHaveBeenCalledWith(USER_ID);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'user.login' }),
      );
    });

    it('increments failed-attempt counter and throws UnauthorizedException for wrong password', async () => {
      mockRedis.get.mockResolvedValueOnce(null);                         // no previous failures
      mockUsers.findByEmail.mockResolvedValueOnce({ ...baseUser, password_hash: '$2b$12$wronghash' });

      await expect(
        service.login({ email: EMAIL, password: 'WrongPassword' }, requestCtx),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('failed-login'),
        '1',
        15 * 60,
      );
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockUsers.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: PASSWORD }, requestCtx),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('blocks login after 5 failed attempts (rate limit)', async () => {
      mockRedis.get.mockResolvedValueOnce('5');   // 5 attempts already recorded

      await expect(
        service.login({ email: EMAIL, password: PASSWORD }, requestCtx),
      ).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.TOO_MANY_REQUESTS }),
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes the refresh token and deletes the session key', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'rt-id', user_id: USER_ID }]);
      mockPrisma.$executeRaw.mockResolvedValueOnce(1n);  // UPDATE revoke
      mockUsers.getUserRoleNames.mockResolvedValueOnce(['buyer_seller']);

      await service.logout('raw-refresh-token', USER_ID, requestCtx);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'user.logout' }),
      );
    });

    it('still logs audit when refresh token is not found in db', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);      // token row missing
      mockUsers.getUserRoleNames.mockResolvedValueOnce(['buyer_seller']);

      await service.logout('stale-token', USER_ID, requestCtx);

      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'user.logout' }),
      );
    });
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('rotates the refresh token and returns new token pair', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: 'rt-id', user_id: USER_ID, expires_at: futureDate, revoked_at: null }]) // lookup
        .mockResolvedValueOnce([{ id: 'new-rt-id' }]);  // insert new token
      mockPrisma.$executeRaw.mockResolvedValueOnce(1n);  // revoke old
      mockUsers.findById.mockResolvedValueOnce(baseUser);

      const result = await service.refresh('old-refresh-token', requestCtx);

      expect(result.accessToken).toBe('signed-access-token');
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1); // old token revoked
    });

    it('throws UnauthorizedException for revoked token', async () => {
      const futureDate = new Date(Date.now() + 60_000);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'rt-id', user_id: USER_ID, expires_at: futureDate, revoked_at: new Date() },
      ]);

      await expect(service.refresh('revoked-token', requestCtx)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for expired token', async () => {
      const pastDate = new Date(Date.now() - 1000);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'rt-id', user_id: USER_ID, expires_at: pastDate, revoked_at: null },
      ]);

      await expect(service.refresh('expired-token', requestCtx)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.refresh('unknown-token', requestCtx)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('stores reset token in Redis and sends email when user exists', async () => {
      mockUsers.findByEmail.mockResolvedValueOnce(baseUser);
      mockUsers.getUserRoleNames.mockResolvedValueOnce(['buyer_seller']);

      await service.forgotPassword(EMAIL, requestCtx);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('password-reset'),
        expect.any(String),
        30 * 60,
      );
      expect(mockNotification.sendEmail).toHaveBeenCalledWith(
        EMAIL,
        expect.stringContaining('Reset'),
        expect.stringContaining('reset-password'),
      );
    });

    it('silently returns when user does not exist (no enumeration)', async () => {
      mockUsers.findByEmail.mockResolvedValueOnce(null);

      await expect(service.forgotPassword('nobody@x.com', requestCtx)).resolves.toBeUndefined();
      expect(mockNotification.sendEmail).not.toHaveBeenCalled();
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('updates hash in DB, deletes Redis key, and logs audit', async () => {
      mockRedis.getJson.mockResolvedValueOnce({ userId: USER_ID });
      mockPrisma.$executeRaw.mockResolvedValueOnce(1n);
      mockUsers.getUserRoleNames.mockResolvedValueOnce(['buyer_seller']);

      await service.resetPassword('valid-token', 'NewP@ssword1', requestCtx);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('password-reset'),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'user.password_reset_completed' }),
      );
    });

    it('throws UnauthorizedException for invalid/expired token', async () => {
      mockRedis.getJson.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword('bad-token', 'NewP@ssword1', requestCtx),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── verifyEmail ──────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('marks email verified, deletes token, sends welcome email', async () => {
      mockRedis.getJson.mockResolvedValueOnce({ userId: USER_ID });
      mockUsers.markEmailVerified.mockResolvedValueOnce(undefined);
      mockUsers.findById.mockResolvedValueOnce(baseUser);
      mockUsers.getUserRoleNames.mockResolvedValueOnce(['buyer_seller']);

      await service.verifyEmail('valid-token', requestCtx);

      expect(mockUsers.markEmailVerified).toHaveBeenCalledWith(USER_ID);
      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockNotification.sendEmail).toHaveBeenCalledWith(
        EMAIL,
        expect.stringContaining('Welcome'),
        expect.any(String),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'user.email_verified' }),
      );
    });

    it('throws UnauthorizedException for invalid token', async () => {
      mockRedis.getJson.mockResolvedValueOnce(null);

      await expect(service.verifyEmail('bad-token', requestCtx)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── oauthLogin ───────────────────────────────────────────────────────────

  describe('oauthLogin', () => {
    const oauthDto = {
      email: EMAIL,
      providerToken: 'google-id-token',
      firstName: 'Alice',
      lastName: 'Smith',
    };

    it('logs in existing user without creating a new record', async () => {
      mockUsers.findByEmail.mockResolvedValueOnce(baseUser);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'rt-id' }]); // refresh token insert

      const result = await service.oauthLogin('google', oauthDto, requestCtx);

      expect(mockUsers.create).not.toHaveBeenCalled();
      expect(result.tokens.accessToken).toBe('signed-access-token');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'user.oauth.google' }),
      );
    });

    it('creates new user and assigns default role on first OAuth login', async () => {
      mockUsers.findByEmail
        .mockResolvedValueOnce(null)         // first call — not found
        .mockResolvedValueOnce(baseUser);    // second call after create

      mockUsers.create.mockResolvedValueOnce(baseUser);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: 'rt-id' }]);

      const result = await service.oauthLogin('google', oauthDto, requestCtx);

      expect(mockUsers.create).toHaveBeenCalledTimes(1);
      expect(mockUsers.assignRole).toHaveBeenCalledTimes(1);
      expect(mockUsers.markEmailVerified).toHaveBeenCalledTimes(1);
      expect(result.tokens.accessToken).toBe('signed-access-token');
    });

    it('throws UnauthorizedException when providerToken is absent', async () => {
      await expect(
        service.oauthLogin('google', { ...oauthDto, providerToken: '' }, requestCtx),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── rate-limit helper ────────────────────────────────────────────────────

  describe('login rate-limit boundary', () => {
    it('allows the 4th failed attempt but blocks on the 5th', async () => {
      const user = { ...baseUser, password_hash: '$2b$12$noop' };

      for (let attempt = 1; attempt <= 4; attempt++) {
        mockRedis.get.mockResolvedValueOnce(String(attempt - 1));
        mockUsers.findByEmail.mockResolvedValueOnce(user);
        await expect(
          service.login({ email: EMAIL, password: 'WrongP@ss' }, requestCtx),
        ).rejects.toThrow(UnauthorizedException);
      }

      // 5 attempts recorded — next call should be rate-limited
      mockRedis.get.mockResolvedValueOnce('5');
      await expect(
        service.login({ email: EMAIL, password: 'WrongP@ss' }, requestCtx),
      ).rejects.toThrow(
        expect.objectContaining({ status: HttpStatus.TOO_MANY_REQUESTS }),
      );
    });
  });
});
