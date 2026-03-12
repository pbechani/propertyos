import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { KycService } from './kyc.service';
import { PrismaService } from '../database';

describe('KycService', () => {
  let service: KycService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const baseKyc = {
    id: 'kyc-uuid-0001',
    user_id: 'user-uuid-0001',
    status: 'pending',
    id_document_url: 'kyc/user-uuid-0001/id_document/file.pdf',
    id_document_type: 'passport',
    address_proof_url: null,
    business_registration_url: null,
    selfie_url: null,
    reviewer_id: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: new Date('2026-01-01'),
    created_at: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [KycService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get(KycService);
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

  // ─── submit ───────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('inserts a KYC row with status pending', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseKyc]);
      const result = await service.submit({
        userId: 'user-uuid-0001',
        idDocumentType: 'passport',
        idDocumentUrl: 'kyc/user-uuid-0001/id_document/file.pdf',
      });
      expect(result.status).toBe('pending');
      expect(result.id_document_type).toBe('passport');
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('accepts optional address and selfie URLs', async () => {
      const withExtras = {
        ...baseKyc,
        address_proof_url: 'kyc/user-uuid-0001/address_proof/file.pdf',
        selfie_url: 'kyc/user-uuid-0001/selfie/selfie.jpg',
      };
      mockPrisma.$queryRaw.mockResolvedValueOnce([withExtras]);
      const result = await service.submit({
        userId: 'user-uuid-0001',
        idDocumentType: 'national_id',
        addressProofUrl: 'kyc/user-uuid-0001/address_proof/file.pdf',
        selfieUrl: 'kyc/user-uuid-0001/selfie/selfie.jpg',
      });
      expect(result.address_proof_url).toBeTruthy();
      expect(result.selfie_url).toBeTruthy();
    });
  });

  // ─── getLatestByUser ──────────────────────────────────────────────────────

  describe('getLatestByUser', () => {
    it('returns the most recent KYC record', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseKyc]);
      const result = await service.getLatestByUser('user-uuid-0001');
      expect(result).toEqual(baseKyc);
    });

    it('returns null when no KYC record exists', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.getLatestByUser('user-uuid-0001');
      expect(result).toBeNull();
    });
  });

  // ─── listPending ──────────────────────────────────────────────────────────

  describe('listPending', () => {
    it('returns array of pending and under_review records', async () => {
      const records = [
        baseKyc,
        { ...baseKyc, id: 'kyc-uuid-0002', status: 'under_review' },
      ];
      mockPrisma.$queryRaw.mockResolvedValueOnce(records);
      const result = await service.listPending();
      expect(result).toHaveLength(2);
    });

    it('returns empty array when nothing pending', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.listPending();
      expect(result).toEqual([]);
    });
  });

  // ─── listAll ──────────────────────────────────────────────────────────────

  const baseKycWithUser = {
    ...baseKyc,
    user_email: 'user@example.com',
    user_first_name: 'Jane',
    user_last_name: 'Doe',
    user_phone: null,
  };

  describe('listAll', () => {
    it('returns all records with user data when no status filter given', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseKycWithUser]);
      const result = await service.listAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ user_email: 'user@example.com' });
    });

    it('returns only records matching the status filter when status is provided', async () => {
      const approvedRow = { ...baseKycWithUser, status: 'approved' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([approvedRow]);
      const result = await service.listAll({ status: 'approved' });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('approved');
    });

    it('returns empty array when no records match', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.listAll({ status: 'rejected' });
      expect(result).toEqual([]);
    });
  });

  // ─── sanitizeWithUser ─────────────────────────────────────────────────────

  describe('sanitizeWithUser', () => {
    it('includes user object in output', () => {
      const result = service.sanitizeWithUser(baseKycWithUser);
      expect(result.user).toEqual({
        id: baseKyc.user_id,
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: null,
      });
    });

    it('computes docsCount from non-null document URLs', () => {
      const rowWithDocs = {
        ...baseKycWithUser,
        id_document_url: 'https://storage/id.pdf',
        address_proof_url: 'https://storage/address.pdf',
        business_registration_url: null,
        selfie_url: null,
      };
      const result = service.sanitizeWithUser(rowWithDocs);
      expect(result.docsCount).toBe(2);
    });

    it('reports docsCount of 0 when all document URLs are null', () => {
      const rowNoDocs = {
        ...baseKycWithUser,
        id_document_url: null,
        address_proof_url: null,
        business_registration_url: null,
        selfie_url: null,
      };
      const result = service.sanitizeWithUser(rowNoDocs);
      expect(result.docsCount).toBe(0);
    });
  });

  // ─── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns the KYC record when found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseKyc]);
      const result = await service.getById('kyc-uuid-0001');
      expect(result).toEqual(baseKyc);
    });

    it('throws NotFoundException when record is missing', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.getById('no-such-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── startReview ──────────────────────────────────────────────────────────

  describe('startReview', () => {
    it('updates status to under_review and sets reviewer_id', async () => {
      const updated = {
        ...baseKyc,
        status: 'under_review',
        reviewer_id: 'admin-uuid',
      };
      // first call: getById (state-guard); second call: UPDATE
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseKyc])
        .mockResolvedValueOnce([updated]);

      const result = await service.startReview('kyc-uuid-0001', 'admin-uuid');
      expect(result.record.status).toBe('under_review');
      expect(result.record.reviewer_id).toBe('admin-uuid');
      expect(result.previousStatus).toBe('pending');
    });

    it('throws ConflictException if record is not in pending status', async () => {
      const underReview = { ...baseKyc, status: 'under_review' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([underReview]);
      await expect(
        service.startReview('kyc-uuid-0001', 'admin-uuid'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if KYC record does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.startReview('bad-id', 'admin-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── approve ──────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('sets status to approved and records reviewer', async () => {
      const approved = {
        ...baseKyc,
        status: 'approved',
        reviewer_id: 'admin-uuid',
        reviewed_at: new Date(),
      };
      // first call: getById; second call: UPDATE
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseKyc])
        .mockResolvedValueOnce([approved]);

      const result = await service.approve(
        'kyc-uuid-0001',
        'admin-uuid',
        'All good',
      );
      expect(result.record.status).toBe('approved');
      expect(result.record.reviewer_id).toBe('admin-uuid');
      expect(result.previousStatus).toBe('pending');
    });

    it('allows approval from under_review status', async () => {
      const underReview = { ...baseKyc, status: 'under_review' };
      const approved = {
        ...underReview,
        status: 'approved',
        reviewer_id: 'admin-uuid',
        reviewed_at: new Date(),
      };
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([underReview])
        .mockResolvedValueOnce([approved]);

      const result = await service.approve('kyc-uuid-0001', 'admin-uuid');
      expect(result.record.status).toBe('approved');
      expect(result.previousStatus).toBe('under_review');
    });

    it('throws ConflictException when record is already approved', async () => {
      const alreadyApproved = { ...baseKyc, status: 'approved' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([alreadyApproved]);
      await expect(
        service.approve('kyc-uuid-0001', 'admin-uuid'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when KYC row does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.approve('no-such-id', 'admin-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── reject ───────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('sets status to rejected and records reviewer notes', async () => {
      const rejected = {
        ...baseKyc,
        status: 'rejected',
        reviewer_id: 'admin-uuid',
        reviewer_notes: 'Document unclear',
        reviewed_at: new Date(),
      };
      // first call: getById; second call: UPDATE
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseKyc])
        .mockResolvedValueOnce([rejected]);

      const result = await service.reject(
        'kyc-uuid-0001',
        'admin-uuid',
        'Document unclear',
      );
      expect(result.record.status).toBe('rejected');
      expect(result.record.reviewer_notes).toBe('Document unclear');
      expect(result.previousStatus).toBe('pending');
    });

    it('throws ConflictException when record is already rejected', async () => {
      const alreadyRejected = { ...baseKyc, status: 'rejected' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([alreadyRejected]);
      await expect(
        service.reject('kyc-uuid-0001', 'admin-uuid'),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when KYC row does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.reject('no-such-id', 'admin-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── sanitize ─────────────────────────────────────────────────────────────

  describe('sanitize', () => {
    it('maps snake_case fields to camelCase output', () => {
      const result = service.sanitize(baseKyc);
      expect(result).toMatchObject({
        id: baseKyc.id,
        userId: baseKyc.user_id,
        status: baseKyc.status,
        idDocumentType: baseKyc.id_document_type,
        idDocumentUrl: baseKyc.id_document_url,
      });
    });

    it('omits internal DB fields like user_id from the output', () => {
      const result = service.sanitize(baseKyc);
      expect(Object.keys(result)).not.toContain('user_id');
    });

    it('preserves null optional fields', () => {
      const result = service.sanitize(baseKyc);
      expect(result.reviewerId).toBeNull();
      expect(result.reviewedAt).toBeNull();
    });
  });
});
