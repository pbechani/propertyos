import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';
import { ConveyancingAuditService } from './conveyancing-audit.service';
import { PrismaService } from '../database';

describe('ClientPortalService', () => {
  let service: ClientPortalService;
  let module: TestingModule;

  const mockAudit = { log: jest.fn() };

  const FIRM_ID = 'firm-uuid-0001';
  const CASE_ID = 'case-uuid-0001';
  const ACTOR_ID = 'actor-uuid-0001';
  const USER_ID = 'user-uuid-0001';
  const ACCESS_ID = 'access-uuid-0001';

  const baseCase = {
    case_reference: 'ZA-CV-123-0001',
    status: 'open',
    country: 'ZA',
    opened_at: new Date(),
    target_registration_date: null,
  };

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ClientPortalService,
        { provide: ConveyancingAuditService, useValue: mockAudit },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientPortalService>(ClientPortalService);
    jest.clearAllMocks();
  });

  afterAll(() => module.close());

  // ── issuePortalToken ───────────────────────────────────────────────────────

  describe('issuePortalToken()', () => {
    it('should issue a token and return rawToken (never stored raw)', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(0);   // deactivate old tokens
      mockPrisma.$queryRaw.mockResolvedValue([{ id: ACCESS_ID }]);

      const dto = { userId: USER_ID, partyRole: 'buyer' as const };
      const result = await service.issuePortalToken(ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, dto);

      expect(result.token).toHaveLength(64); // 32 bytes => 64 hex chars
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.accessId).toBe(ACCESS_ID);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'portal_access.token_issued' }),
      );
    });

    it('should store token as SHA-256 hash, not plaintext', async () => {
      mockPrisma.$executeRaw.mockResolvedValue(0);
      let capturedInsertCall: unknown[] = [];
      mockPrisma.$queryRaw.mockImplementation((sql: unknown, ...args: unknown[]) => {
        capturedInsertCall = args;
        return Promise.resolve([{ id: ACCESS_ID }]);
      });

      const dto = { userId: USER_ID, partyRole: 'buyer' as const };
      const result = await service.issuePortalToken(ACTOR_ID, 'conveyancer', FIRM_ID, CASE_ID, dto);

      // The raw token must not appear in the query arguments (hash should be stored)
      const storedHash = capturedInsertCall.find(
        (arg) => typeof arg === 'string' && (arg as string).length === 64,
      );
      expect(storedHash).toBeDefined();
      // rawToken must differ from the stored hash
      expect(result.token).not.toBe(storedHash);
    });
  });

  // ── getPortalSummary ───────────────────────────────────────────────────────

  describe('getPortalSummary()', () => {
    const validAccess = {
      id: ACCESS_ID,
      user_id: USER_ID,
      party_role: 'buyer',
      token_expires_at: new Date(Date.now() + 86400000),
      is_active: true,
    };

    it('should return summary for valid token', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([validAccess])   // token lookup
        .mockResolvedValueOnce([baseCase])       // case details
        .mockResolvedValueOnce([])               // tasks
        .mockResolvedValueOnce([])               // documents
        .mockResolvedValueOnce([{ balance: '95000' }]); // balance
      mockPrisma.$executeRaw.mockResolvedValue(1); // update last_accessed_at

      const result = await service.getPortalSummary('some-token', CASE_ID);

      expect(result.caseReference).toBe('ZA-CV-123-0001');
      expect(result.ledgerBalance).toBe(95000);
    });

    it('should throw UnauthorizedException for inactive token', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...validAccess, is_active: false }]);

      await expect(service.getPortalSummary('bad-token', CASE_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expired = {
        ...validAccess,
        token_expires_at: new Date(Date.now() - 100),
      };
      mockPrisma.$queryRaw.mockResolvedValueOnce([expired]);

      await expect(service.getPortalSummary('expired-token', CASE_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.getPortalSummary('missing-token', CASE_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
