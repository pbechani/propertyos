import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';

describe('VerificationService', () => {
  let service: VerificationService;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = {
    log: jest.fn(),
  };

  const agentId = 'agent-uuid-0001';
  const adminId = 'admin-uuid-0001';
  const propertyId = 'prop-uuid-0001';
  const titleDeedFile = { originalname: 'deed.pdf' } as Express.Multer.File;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyAuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(VerificationService);
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

  // ─── submitVerificationRequest ────────────────────────────────────────────

  describe('submitVerificationRequest', () => {
    it('creates a verification request and sets property status to pending', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, verification_status: 'unverified' }]) // property check
        .mockResolvedValueOnce([])  // no existing pending verification
        .mockResolvedValueOnce([{ id: 'ver-uuid-001', status: 'pending' }]); // INSERT verification

      mockPrisma.$executeRaw.mockResolvedValue(1); // UPDATE property

      const result = await service.submitVerificationRequest(
        propertyId,
        agentId,
        'agent',
        { deedNumber: 'DEED-001', registryReference: 'REG-001' },
        titleDeedFile,
      );

      expect(result.status).toBe('pending');
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(1);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.verification.submitted' }),
      );
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.submitVerificationRequest(propertyId, agentId, 'agent', {}, titleDeedFile),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when agent does not own property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: 'other-agent', verification_status: 'unverified' },
      ]);
      await expect(
        service.submitVerificationRequest(propertyId, agentId, 'agent', {}, titleDeedFile),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when property is already verified', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: agentId, verification_status: 'verified' },
      ]);
      await expect(
        service.submitVerificationRequest(propertyId, agentId, 'agent', {}, titleDeedFile),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when a pending verification already exists', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, verification_status: 'pending' }])
        .mockResolvedValueOnce([{ id: 'ver-uuid-001', status: 'pending' }]); // existing

      await expect(
        service.submitVerificationRequest(propertyId, agentId, 'agent', {}, titleDeedFile),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when title deed file is missing', async () => {
      await expect(
        service.submitVerificationRequest(propertyId, agentId, 'agent', {}, undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── approveVerification ──────────────────────────────────────────────────

  describe('approveVerification', () => {
    it('sets verification status to approved and property to verified', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'ver-uuid-001', status: 'pending' },
      ]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await service.approveVerification(
        propertyId,
        adminId,
        { reviewerNotes: 'All good' },
      );

      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2); // update verification + update property
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.verification.approved' }),
      );
    });

    it('throws NotFoundException when no pending verification exists', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.approveVerification(propertyId, adminId, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── rejectVerification ───────────────────────────────────────────────────

  describe('rejectVerification', () => {
    it('sets verification to rejected and property to flagged', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'ver-uuid-001', status: 'pending' },
      ]);
      mockPrisma.$executeRaw.mockResolvedValue(1);

      await service.rejectVerification(
        propertyId,
        adminId,
        { reviewerNotes: 'Invalid deed number' },
      );

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'property.verification.rejected' }),
      );
    });
  });

  // ─── getPendingVerifications ──────────────────────────────────────────────

  describe('getPendingVerifications', () => {
    it('returns paginated list of pending verifications', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([
          { id: 'ver-uuid-001', property_id: propertyId, status: 'pending', title: 'House' },
        ])
        .mockResolvedValueOnce([{ total: '1' }]);

      const result = await service.getPendingVerifications({ limit: 10, offset: 0 });

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });
});
