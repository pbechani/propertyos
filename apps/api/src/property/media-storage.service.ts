import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE_BYTES,
} from './property.constants';

@Injectable()
export class MediaStorageService {
  private get localStorageDir(): string {
    return process.env.LOCAL_STORAGE_DIR ?? join(homedir(), '.pribec', 'storage');
  }

  private get publicBaseUrl(): string {
    const port = process.env.PORT ?? '3001';
    return process.env.PUBLIC_URL ?? `http://localhost:${port}`;
  }

  /**
   * Validates and saves a media file to local disk, returning a publicly accessible URL.
   * TODO (D2): Replace local storage with MinIO/S3.
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

    const filePath = join(this.localStorageDir, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, params.file.buffer);

    return {
      storagePath: key,
      signedUrl: `${this.publicBaseUrl}/storage/${key}`,
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
