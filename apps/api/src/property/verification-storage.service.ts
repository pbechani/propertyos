import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { homedir } from 'os';

const MAX_TITLE_DEED_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TITLE_DEED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);

@Injectable()
export class VerificationStorageService {
  private readonly storageRoot =
    process.env.LOCAL_STORAGE_DIR || join(homedir(), '.pribec', 'storage');

  private readonly publicBaseUrl =
    process.env.PUBLIC_STORAGE_BASE_URL ||
    `http://localhost:${process.env.PORT || '3001'}/storage`;

  async uploadTitleDeed(params: {
    propertyId: string;
    agentId: string;
    file: Express.Multer.File;
  }): Promise<{ storagePath: string; publicUrl: string }> {
    this.validateFile(params.file);

    const extension = this.getFileExtension(
      params.file.originalname,
      params.file.mimetype,
    );
    const key =
      `property-verifications/${params.propertyId}/${params.agentId}/title_deed/` +
      `${randomUUID()}.${extension}`;

    const targetPath = join(this.storageRoot, key);
    const contents = await this.resolveFileContents(params.file);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, contents);

    const normalizedKey = key.replace(/\\/g, '/');
    return {
      storagePath: key,
      publicUrl: `${this.publicBaseUrl}/${normalizedKey}`,
    };
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_TITLE_DEED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: PDF, JPG, PNG, HEIC',
      );
    }

    if (file.size > MAX_TITLE_DEED_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large. Max size is 20MB');
    }
  }

  private async resolveFileContents(
    file: Express.Multer.File,
  ): Promise<Buffer> {
    if (file.buffer && file.buffer.length > 0) {
      return file.buffer;
    }

    if (file.path) {
      return readFile(file.path);
    }

    throw new BadRequestException('Uploaded file content is unavailable');
  }

  private getFileExtension(fileName: string, mimeType: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) {
      return ext;
    }

    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'heic';
    return 'jpg';
  }
}