import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrphanedTasksService } from './orphaned-tasks.service';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';

const COMPANY_ID = 'company-uuid-0001';
const REVOKED_USER_ID = 'user-uuid-revoked';
const ASSIGNEE_ID = 'user-uuid-assignee';
const TASK_ID = 'task-uuid-0001';

const baseTask = {
  id: TASK_ID,
  company_id: COMPANY_ID,
  resource_type: 'property_listing',
  resource_id: 'property-uuid-0001',
  revoked_user_id: REVOKED_USER_ID,
  status: 'open',
  assigned_to: null,
  created_at: new Date('2026-01-01'),
};

const requestCtx = { ip: '127.0.0.1', userAgent: 'test' };

describe('OrphanedTasksService', () => {
  let service: OrphanedTasksService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        OrphanedTasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(OrphanedTasksService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => module.close());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── buildOrphanedPool ────────────────────────────────────────────────────

  describe('buildOrphanedPool', () => {
    it('creates tasks for each active property assigned to revoked user', async () => {
      const properties = [
        { id: 'prop-0001', status: 'active' },
        { id: 'prop-0002', status: 'active' },
      ];
      mockPrisma.$queryRaw.mockResolvedValueOnce(properties);
      mockPrisma.$executeRaw
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await service.buildOrphanedPool(COMPANY_ID, REVOKED_USER_ID, requestCtx);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
      expect(mockAudit.log).toHaveBeenCalledTimes(2);
    });

    it('does not insert tasks when revoked user has no active listings', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no properties

      await service.buildOrphanedPool(COMPANY_ID, REVOKED_USER_ID, requestCtx);

      expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns open tasks for the company', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseTask]);
      const result = await service.list(COMPANY_ID);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('resource_type', 'property_listing');
    });
  });

  // ─── assign ───────────────────────────────────────────────────────────────

  describe('assign', () => {
    it('assigns task to an active company member', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseTask]) // findTask
        .mockResolvedValueOnce([{ status: 'active' }]); // check assignee membership
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      await service.assign(COMPANY_ID, TASK_ID, ASSIGNEE_ID, TASK_ID, requestCtx);

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'orphaned_task.assigned' }),
      );
    });

    it('throws NotFoundException when task does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no task
      await expect(
        service.assign(COMPANY_ID, TASK_ID, ASSIGNEE_ID, TASK_ID, requestCtx),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when assignee is not an active member', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseTask]) // task found
        .mockResolvedValueOnce([]); // assignee not a member

      await expect(
        service.assign(COMPANY_ID, TASK_ID, ASSIGNEE_ID, TASK_ID, requestCtx),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── close ────────────────────────────────────────────────────────────────

  describe('close', () => {
    it('marks task as closed', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseTask]); // findTask
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      await service.close(COMPANY_ID, TASK_ID, ASSIGNEE_ID, requestCtx);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'orphaned_task.closed' }),
      );
    });

    it('throws NotFoundException when task does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.close(COMPANY_ID, TASK_ID, ASSIGNEE_ID, requestCtx),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
