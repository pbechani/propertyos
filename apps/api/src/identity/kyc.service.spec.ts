import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { KycService } from './kyc.service';
import { PrismaService } from '../database';

describe('KycService', () => {
  let service: KycService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(KycService);
  });

  afterEach(() => jest.clearAllMocks());

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
      const records = [baseKyc, { ...baseKyc, id: 'kyc-uuid-0002', status: 'under_review' }];
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

  // ─── getById ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns the KYC record when found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseKyc]);
      const result = await service.getById('kyc-uuid-0001');
      expect(result).toEqual(baseKyc);
    });

    it('throws NotFoundException when record is missing', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.getById('no-such-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── startReview ──────────────────────────────────────────────────────────

  describe('startReview', () => {
    it('updates status to under_review and sets reviewer_id', async () => {
      const updated = { ...baseKyc, status: 'under_review', reviewer_id: 'admin-uuid' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([updated]);

      const result = await service.startReview('kyc-uuid-0001', 'admin-uuid');
      expect(result.status).toBe('under_review');
      expect(result.reviewer_id).toBe('admin-uuid');
    });

    it('throws NotFoundException if KYC record does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.startReview('bad-id', 'admin-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── approve ──────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('sets status to approved and records reviewer', async () => {
      const approved = { ...baseKyc, status: 'approved', reviewer_id: 'admin-uuid', reviewed_at: new Date() };
      mockPrisma.$queryRaw.mockResolvedValueOnce([approved]);
      const result = await service.approve('kyc-uuid-0001', 'admin-uuid', 'All good');
      expect(result.status).toBe('approved');
      expect(result.reviewer_id).toBe('admin-uuid');
    });

    it('throws NotFoundException when KYC row does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.approve('no-such-id', 'admin-uuid')).rejects.toThrow(NotFoundException);
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
      mockPrisma.$queryRaw.mockResolvedValueOnce([rejected]);
      const result = await service.reject('kyc-uuid-0001', 'admin-uuid', 'Document unclear');
      expect(result.status).toBe('rejected');
      expect(result.reviewer_notes).toBe('Document unclear');
    });

    it('throws NotFoundException when KYC row does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(service.reject('no-such-id', 'admin-uuid')).rejects.toThrow(NotFoundException);
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
