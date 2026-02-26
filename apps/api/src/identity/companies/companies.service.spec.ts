import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../database';
import { AuditService } from '../audit.service';
import { NotificationService } from '../notification.service';

const COMPANY_ID = 'company-uuid-0001';
const USER_ID = 'user-uuid-0001';

const baseCompany = {
  id: COMPANY_ID,
  name: 'Acme Realty',
  slug: 'acme-realty',
  category: 'agent',
  email: 'hello@acme.com',
  status: 'pending_verification',
  verification_status: 'unverified',
  created_by: USER_ID,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

const requestCtx = { ip: '127.0.0.1', userAgent: 'test' };

describe('CompaniesService', () => {
  let service: CompaniesService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };
  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
  const mockNotification = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendSms: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get(CompaniesService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => module.close());

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates company and adds creator as admin member', async () => {
      // slug uniqueness check → no existing slug
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([]) // slug exists? → no
        .mockResolvedValueOnce([{ id: COMPANY_ID }]) // INSERT company RETURNING id
        .mockResolvedValueOnce([baseCompany]); // SELECT by id (findById)
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // INSERT member

      const result = await service.create(
        {
          name: 'Acme Realty',
          category: 'agent',
          email: 'hello@acme.com',
        },
        USER_ID,
        requestCtx,
      );

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1); // member insert
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company.created' }),
      );
      expect(result).toEqual(baseCompany);
    });

    it('throws BadRequestException for unknown category', async () => {
      await expect(
        service.create(
          { name: 'X', category: 'unknown' as never, email: 'x@x.com' },
          USER_ID,
          requestCtx,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns the company when found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseCompany]);
      const result = await service.findById(COMPANY_ID);
      expect(result).toEqual(baseCompany);
    });

    it('throws NotFoundException when not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.findById(COMPANY_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── verify ───────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('updates company and notifies admins', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseCompany]) // findById
        .mockResolvedValueOnce([{ ...baseCompany, verification_status: 'verified', status: 'active' }]) // findById after update
        .mockResolvedValueOnce([{ email: 'admin@acme.com', phone: null }]); // notifyCompanyAdmin
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      const result = await service.verify(COMPANY_ID, USER_ID, requestCtx);

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company.verified' }),
      );
      expect(result).toHaveProperty('verification_status', 'verified');
    });
  });

  // ─── submitForVerification ────────────────────────────────────────────────

  describe('submitForVerification', () => {
    it('transitions status to pending when unverified', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseCompany]) // findById
        .mockResolvedValueOnce([{ ...baseCompany, verification_status: 'pending' }]); // findById after update
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined); // UPDATE

      await service.submitForVerification(COMPANY_ID, USER_ID, requestCtx);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company.submitted_for_verification' }),
      );
    });

    it('throws BadRequestException when already pending', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...baseCompany, verification_status: 'pending' },
      ]);
      await expect(
        service.submitForVerification(COMPANY_ID, USER_ID, requestCtx),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── reject ───────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('sets verification_status to rejected with reason', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseCompany]) // findById (guard)
        .mockResolvedValueOnce([{ ...baseCompany, verification_status: 'rejected' }]) // findById after update
        .mockResolvedValueOnce([]); // notifyCompanyAdmin → no admins
      mockPrisma.$executeRaw.mockResolvedValueOnce(undefined);

      const result = await service.reject(COMPANY_ID, 'Docs missing', USER_ID, requestCtx);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'company.rejected' }),
      );
      expect(result).toHaveProperty('verification_status', 'rejected');
    });
  });
});
