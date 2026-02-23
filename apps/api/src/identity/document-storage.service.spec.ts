import { BadRequestException } from '@nestjs/common';
import { DocumentStorageService } from './document-storage.service';

describe('DocumentStorageService', () => {
  let service: DocumentStorageService;

  beforeEach(() => {
    service = new DocumentStorageService();
  });

  it('generates signed download URL for valid kyc path', () => {
    const result = service.generateDownloadUrl({
      storagePath: 'kyc/user-uuid/id_document/file.pdf',
      expiresInSeconds: 3600,
    });

    expect(result.signedUrl).toContain('expiresIn=3600');
  });

  it('throws for invalid non-kyc storage path', () => {
    expect(() =>
      service.generateDownloadUrl({
        storagePath: 'property-media/x/y.jpg',
      }),
    ).toThrow(BadRequestException);
  });
});
