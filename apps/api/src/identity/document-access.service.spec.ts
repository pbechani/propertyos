import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentAccessService } from './document-access.service';
import { KycService } from './kyc.service';
import { DocumentStorageService } from './document-storage.service';
import { AuditService } from './audit.service';

describe('DocumentAccessService', () => {
  let service: DocumentAccessService;
  let module: TestingModule;

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'SIGNED_URL_EXPIRY_SECONDS') return 3600;
      return undefined;
    }),
  };

  const mockKycService = {
    getById: jest.fn(),
  };

  const mockStorageService = {
    generateDownloadUrl: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const baseKycRecord = {
    id: 'kyc-uuid-1',
    user_id: 'user-uuid-1',
    id_document_url: 'kyc/user-uuid-1/id_document/a.pdf',
    address_proof_url: null,
    business_registration_url: null,
    selfie_url: null,
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DocumentAccessService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: KycService, useValue: mockKycService },
        { provide: DocumentStorageService, useValue: mockStorageService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get(DocumentAccessService);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('issues a signed URL for document owner', async () => {
    mockKycService.getById.mockResolvedValueOnce(baseKycRecord);
    mockStorageService.generateDownloadUrl.mockReturnValueOnce({
      signedUrl: 'https://storage.pribec.local/kyc/user-uuid-1/id_document/a.pdf?expiresIn=3600',
    });

    const result = await service.issueKycDocumentDownloadUrl({
      kycId: baseKycRecord.id,
      documentType: 'id_document',
      actorId: 'user-uuid-1',
      actorRoles: ['buyer_seller'],
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result.expiresInSeconds).toBe(3600);
    expect(result.downloadUrl).toContain('expiresIn=3600');
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'kyc.document_download_url_issued' }),
    );
  });

  it('allows admin to issue URL for other user document', async () => {
    mockKycService.getById.mockResolvedValueOnce(baseKycRecord);
    mockStorageService.generateDownloadUrl.mockReturnValueOnce({
      signedUrl: 'https://storage.pribec.local/kyc/user-uuid-1/id_document/a.pdf?expiresIn=3600',
    });

    await expect(
      service.issueKycDocumentDownloadUrl({
        kycId: baseKycRecord.id,
        documentType: 'id_document',
        actorId: 'admin-uuid',
        actorRoles: ['admin'],
      }),
    ).resolves.toBeDefined();
  });

  it('throws ForbiddenException for non-owner non-admin', async () => {
    mockKycService.getById.mockResolvedValueOnce(baseKycRecord);

    await expect(
      service.issueKycDocumentDownloadUrl({
        kycId: baseKycRecord.id,
        documentType: 'id_document',
        actorId: 'user-uuid-2',
        actorRoles: ['buyer_seller'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when requested document path is missing', async () => {
    mockKycService.getById.mockResolvedValueOnce(baseKycRecord);

    await expect(
      service.issueKycDocumentDownloadUrl({
        kycId: baseKycRecord.id,
        documentType: 'selfie',
        actorId: 'user-uuid-1',
        actorRoles: ['buyer_seller'],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
