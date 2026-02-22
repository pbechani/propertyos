import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MediaStorageService } from './media-storage.service';

describe('MediaStorageService', () => {
  let service: MediaStorageService;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [MediaStorageService],
    }).compile();

    service = module.get<MediaStorageService>(MediaStorageService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadPropertyMedia', () => {
    const propertyId = 'prop-uuid-0001';
    const agentId = 'agent-uuid-0001';

    it('should successfully upload a valid image', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await service.uploadPropertyMedia({ propertyId, agentId, file });

      expect(result).toBeDefined();
      expect(result.mediaType).toBe('image');
      expect(result.storagePath).toContain(`property-media/${propertyId}/${agentId}/`);
      expect(result.storagePath).toContain('.jpg');
      expect(result.signedUrl).toContain(result.storagePath);
    });

    it('should successfully upload a valid video', async () => {
      const file = {
        originalname: 'test.mp4',
        mimetype: 'video/mp4',
        size: 10 * 1024 * 1024, // 10MB
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await service.uploadPropertyMedia({ propertyId, agentId, file });

      expect(result).toBeDefined();
      expect(result.mediaType).toBe('video');
      expect(result.storagePath).toContain('.mp4');
    });

    it('should throw BadRequestException for invalid mime type', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      await expect(
        service.uploadPropertyMedia({ propertyId, agentId, file }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file too large', async () => {
      const file = {
        originalname: 'test.mp4',
        mimetype: 'video/mp4',
        size: 60 * 1024 * 1024, // 60MB
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      await expect(
        service.uploadPropertyMedia({ propertyId, agentId, file }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty file', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 0,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      await expect(
        service.uploadPropertyMedia({ propertyId, agentId, file }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});