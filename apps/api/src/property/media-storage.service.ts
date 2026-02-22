import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
} from './property.constants';

@Injectable()
export class MediaStorageService {
  /**
   * Validates and "uploads" a media file (image or video) for a property listing.
   * Storage path is set up for MinIO/S3 — real signed URL wired in a later sprint.
   */
  async uploadPropertyMedia(params: {
    propertyId: string;
    agentId: string;
    file: Express.Multer.File;
  }): Promise<{ storagePath: string; signedUrl: string; mediaType: 'image' | 'video' }> {
    this.validateFile(params.file);

    const mediaType = this.detectMediaType(params.file.mimetype);
    const extension = this.getExtension(params.file.originalname, params.file.mimetype);
    const key = `property-media/${params.propertyId}/${params.agentId}/${randomUUID()}.${extension}`;

    // TODO (D2): Replace with real MinIO/S3 signed URL
    return {
      storagePath: key,
      signedUrl: `https://storage.pribec.local/${key}?expiresIn=3600`,
      mediaType,
    };
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MEDIA_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPEG, PNG, WEBP, HEIC, MP4, MOV, WEBM',
      );
    }

    if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large. Max size is 50MB');
    }

    if (file.buffer.length === 0) {
      throw new BadRequestException('Empty file upload is not allowed');
    }
  }

  private detectMediaType(mimeType: string): 'image' | 'video' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    throw new BadRequestException('Unsupported media type');
  }

  private getExtension(fileName: string, mimeType: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) return ext;

    const fallback: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/webm': 'webm',
    };
    return fallback[mimeType] ?? 'bin';
  }
}
