import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyMembersService } from './company-members.service';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';
import { OrphanedTasksService } from './orphaned-tasks.service';

const COMPANY_ID = 'company-uuid-0001';
const USER_ID = 'user-uuid-0002';
const MEMBER_ID = 'member-uuid-0001';
const ACTOR_ID = 'user-uuid-0001';

const baseMember = {
  id: MEMBER_ID,
  company_id: COMPANY_ID,
  user_id: USER_ID,
  role: 'agent',
  is_admin: false,
  status: 'active',
  permissions: [],
};

const requestCtx = { ip: '127.0.0.1', userAgent: 'test' };

describe('CompanyMembersService', () => {
  let service: CompanyMembersService;
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
  const mockOrphaned = { buildOrphanedPool: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CompanyMembersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationService, useValue: mockNotification },
        { provide: OrphanedTasksService, useValue: mockOrphaned },
      ],
    }).compile();

    service = module.get(CompanyMembersService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => module.close());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── listMembers ──────────────────────────────────────────────────────────

  describe('listMembers', () => {
    it('returns an array of member records with user data', async () => {
      const members = [{ ...baseMember, email: 'agent@acme.com', first_name: 'Alice', last_name: 'Smith' }];
      mockPrisma.$queryRaw.mockResolvedValueOnce(members);
      const result = await service.listMembers(COMPANY_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('email', 'agent@acme.com');
    });
  });

  // ─── promoteToAdmin ───────────────────────────────────────────────────────

  describe('promoteToAdmin', () => {
    it('sets is_admin to true and logs the action', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseMember]) // getMemberRaw
        .mockResolvedValueOnce([{ ...baseMember, is_admin: true, email: 'a@a.com', first_name: 'A', last_name: 'B' }]); // getMember after update
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      const result = await service.promoteToAdmin(COMPANY_ID, MEMBER_ID, ACTOR_ID, requestCtx);

      expect(result).toHaveProperty('is_admin', true);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company_member.promoted_to_admin' }),
      );
    });

    it('throws NotFoundException when member does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // getMemberRaw → not found
      await expect(
        service.promoteToAdmin(COMPANY_ID, MEMBER_ID, ACTOR_ID, requestCtx),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── revokeAccess ─────────────────────────────────────────────────────────

  describe('revokeAccess', () => {
    it('revokes non-admin member and triggers orphaned task pool', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseMember]) // getMemberRaw
        .mockResolvedValueOnce([{ email: 'agent@acme.com', name: 'Acme' }]); // notifyRevokedUser
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      const result = await service.revokeAccess(COMPANY_ID, MEMBER_ID, ACTOR_ID, requestCtx);

      expect(result.success).toBe(true);
      expect(mockOrphaned.buildOrphanedPool).toHaveBeenCalledWith(COMPANY_ID, USER_ID, requestCtx);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company_member.access_revoked' }),
      );
    });

    it('throws ForbiddenException when revoking the last admin', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ ...baseMember, is_admin: true }]) // getMemberRaw → is admin
        .mockResolvedValueOnce([{ count: BigInt(1) }]); // countActiveAdmins → only 1

      await expect(
        service.revokeAccess(COMPANY_ID, MEMBER_ID, ACTOR_ID, requestCtx),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows revoking an admin when multiple admins exist', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ ...baseMember, is_admin: true }]) // getMemberRaw → is admin
        .mockResolvedValueOnce([{ count: BigInt(2) }]) // countActiveAdmins → 2 admins
        .mockResolvedValueOnce([{ email: 'admin@acme.com', name: 'Acme' }]); // notify
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      const result = await service.revokeAccess(COMPANY_ID, MEMBER_ID, ACTOR_ID, requestCtx);
      expect(result.success).toBe(true);
    });
  });

  // ─── linkUserToCompany ────────────────────────────────────────────────────

  describe('linkUserToCompany', () => {
    it('inserts new member record on fresh invite acceptance', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no existing member
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // INSERT

      await service.linkUserToCompany(
        COMPANY_ID, USER_ID, 'agent', false, [], 'invite-id', requestCtx,
      );

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });

    it('re-activates a previously revoked member', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ id: MEMBER_ID, status: 'revoked' }]); // existing revoked
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      await service.linkUserToCompany(
        COMPANY_ID, USER_ID, 'agent', false, [], 'invite-id', requestCtx,
      );

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
    });
  });
});
