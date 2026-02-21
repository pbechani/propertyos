import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);

@Injectable()
export class DocumentStorageService {
  async upload(params: {
    context: string;
    userId: string;
    documentType: string;
    file: Express.Multer.File;
  }): Promise<{ storagePath: string; signedUrl: string }> {
    this.validateFile(params.file);
    await this.scanForVirus(params.file);

    const extension = this.getFileExtension(
      params.file.originalname,
      params.file.mimetype,
    );
    const key = `${params.context}/${params.userId}/${params.documentType}/${randomUUID()}.${extension}`;

    return {
      storagePath: key,
      signedUrl: `https://storage.pribec.local/${key}?expiresIn=3600`,
    };
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: PDF, JPG, PNG, HEIC',
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large. Max size is 20MB');
    }
  }

  private async scanForVirus(file: Express.Multer.File): Promise<void> {
    if (file.buffer.length === 0) {
      throw new BadRequestException('Empty file upload is not allowed');
    }
  }

  private getFileExtension(fileName: string, mimeType: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension) {
      return extension;
    }

    if (mimeType === 'application/pdf') {
      return 'pdf';
    }

    if (mimeType === 'image/png') {
      return 'png';
    }

    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      return 'heic';
    }

    return 'jpg';
  }
}
