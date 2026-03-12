import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanyInvitationsService } from './company-invitations.service';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';
import { CompanyMembersService } from './company-members.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users.service';

const COMPANY_ID = 'company-uuid-0001';
const INVITER_ID = 'user-uuid-0001';
const INVITEE_EMAIL = 'newagent@acme.com';
const RAW_TOKEN = 'abc123rawtoken';

const baseInvitation = {
  id: 'invite-uuid-0001',
  company_id: COMPANY_ID,
  invited_email: INVITEE_EMAIL,
  role: 'agent',
  is_admin: false,
  permissions: [],
  status: 'pending',
  token_hash: 'some-sha256-hash',
  expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
  created_by: INVITER_ID,
  company_name: 'Test Co',
  company_category: 'agent',
  inviter_first_name: 'Alice',
  inviter_last_name: 'Smith',
};

const requestCtx = { ip: '127.0.0.1', userAgent: 'test' };

describe('CompanyInvitationsService', () => {
  let service: CompanyInvitationsService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
  const mockNotification = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendSms: jest.fn().mockResolvedValue(undefined),
  };
  const mockConfig = { get: jest.fn().mockReturnValue('http://localhost:3000') };
  const mockMembers = {
    linkUserToCompany: jest.fn().mockResolvedValue(undefined),
    getRolePermissions: jest.fn().mockResolvedValue([]),
  };
  const mockAuth = { issueTokensForUser: jest.fn().mockResolvedValue({ accessToken: 'tok', refreshToken: 'ref', accessTokenExpiresIn: '15m', refreshTokenExpiresIn: '7d' }) };
  const mockUsers = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'new-user-id', email: INVITEE_EMAIL }),
    assignRole: jest.fn().mockResolvedValue(undefined),
    markEmailVerified: jest.fn().mockResolvedValue(undefined),
    sanitizeUser: jest.fn().mockReturnValue({ id: 'new-user-id', email: INVITEE_EMAIL }),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CompanyInvitationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationService, useValue: mockNotification },
        { provide: ConfigService, useValue: mockConfig },
        { provide: CompanyMembersService, useValue: mockMembers },
        { provide: AuthService, useValue: mockAuth },
        { provide: UsersService, useValue: mockUsers },
      ],
    }).compile();

    service = module.get(CompanyInvitationsService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => module.close());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── invite ───────────────────────────────────────────────────────────────

  describe('invite', () => {
    it('creates an invitation and sends email for a verified company', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ verification_status: 'verified' }]) // company lookup
        .mockResolvedValueOnce([]); // existing pending invite check
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // INSERT invitation

      const result = await service.invite(
        COMPANY_ID,
        { email: INVITEE_EMAIL, role: 'agent', is_admin: false, permissions: [] },
        INVITER_ID,
        requestCtx,
      );

      expect(mockNotification.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company_invitation.created' }),
      );
      expect(result).toHaveProperty('invitee_email', INVITEE_EMAIL);
    });

    it('rejects invite for an unverified company', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ verification_status: 'unverified' }]);

      await expect(
        service.invite(
          COMPANY_ID,
          { email: INVITEE_EMAIL, role: 'agent', is_admin: false, permissions: [] },
          INVITER_ID,
          requestCtx,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invite when a pending invitation already exists for that email', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ verification_status: 'verified' }])
        .mockResolvedValueOnce([{ id: 'existing-invite-id' }]); // existing invite

      await expect(
        service.invite(
          COMPANY_ID,
          { email: INVITEE_EMAIL, role: 'agent', is_admin: false, permissions: [] },
          INVITER_ID,
          requestCtx,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── preview ──────────────────────────────────────────────────────────────

  describe('preview', () => {
    it('returns invitation data for valid token', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseInvitation]);
      const result = await service.preview(RAW_TOKEN);
      expect(result).toHaveProperty('invited_email', INVITEE_EMAIL);
      expect(result).toHaveProperty('company_name', 'Test Co');
    });

    it('throws NotFoundException for invalid or expired token', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.preview(RAW_TOKEN)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── accept ───────────────────────────────────────────────────────────────

  describe('accept', () => {
    const USER_ID = 'user-uuid-new-member';

    it('links user to company and marks invitation accepted', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseInvitation]);
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE invitation to accepted

      await service.accept(RAW_TOKEN, USER_ID, INVITEE_EMAIL, requestCtx);

      expect(mockMembers.linkUserToCompany).toHaveBeenCalledWith(
        COMPANY_ID,
        USER_ID,
        'agent',
        false,
        [],
        baseInvitation.id,
        requestCtx,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company_invitation.accepted' }),
      );
    });

    it('throws NotFoundException if invitation no longer valid', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.accept(RAW_TOKEN, USER_ID, INVITEE_EMAIL, requestCtx)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── revoke ───────────────────────────────────────────────────────────────

  describe('revoke', () => {
    it('cancels a pending invitation', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseInvitation]); // findById
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      await service.revoke(baseInvitation.id, COMPANY_ID, INVITER_ID, requestCtx);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company_invitation.revoked' }),
      );
    });
  });

  // ─── resend ───────────────────────────────────────────────────────────────

  describe('resend', () => {
    it('generates new token, updates expiry, and sends reminder email', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: baseInvitation.id, status: 'pending', invited_email: INVITEE_EMAIL, role: 'agent' }]) // invitation lookup
        .mockResolvedValueOnce([{ name: 'Test Co' }]); // company name
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE token_hash/expires_at

      const result = await service.resend(baseInvitation.id, COMPANY_ID, INVITER_ID, requestCtx);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockNotification.sendEmail).toHaveBeenCalledWith(
        INVITEE_EMAIL,
        expect.stringContaining('Reminder'),
        expect.stringContaining('Test Co'),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company_invitation.resent' }),
      );
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('expires_at');
    });

    it('throws NotFoundException when invitation does not belong to company', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // not found

      await expect(
        service.resend('no-such-id', COMPANY_ID, INVITER_ID, requestCtx),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for a revoked invitation', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: baseInvitation.id, status: 'revoked', invited_email: INVITEE_EMAIL, role: 'agent' },
      ]);

      await expect(
        service.resend(baseInvitation.id, COMPANY_ID, INVITER_ID, requestCtx),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for an already accepted invitation', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: baseInvitation.id, status: 'accepted', invited_email: INVITEE_EMAIL, role: 'agent' },
      ]);

      await expect(
        service.resend(baseInvitation.id, COMPANY_ID, INVITER_ID, requestCtx),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
