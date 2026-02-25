import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';

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
  private readonly storageRoot =
    process.env.LOCAL_STORAGE_DIR || join(homedir(), '.pribec', 'storage');

  private readonly publicBaseUrl =
    process.env.PUBLIC_STORAGE_BASE_URL ||
    `http://localhost:${process.env.PORT || '3001'}/storage`;

  async upload(params: {
    context: string;
    userId: string;
    documentType: string;
    file: Express.Multer.File;
  }): Promise<{ storagePath: string; signedUrl: string; publicUrl: string }> {
    this.validateFile(params.file);
    await this.scanForVirus(params.file);

    const extension = this.getFileExtension(
      params.file.originalname,
      params.file.mimetype,
    );
    const key = `${params.context}/${params.userId}/${params.documentType}/${randomUUID()}.${extension}`;
    const targetPath = join(this.storageRoot, key);
    const fileContents = await this.resolveFileContents(params.file);

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, fileContents);

    const normalizedKey = key.replace(/\\/g, '/');
    const publicUrl = `${this.publicBaseUrl}/${normalizedKey}`;

    return {
      storagePath: key,
      signedUrl: `${publicUrl}?expiresIn=3600`,
      publicUrl,
    };
  }

  generateDownloadUrl(params: {
    storagePath: string;
    expiresInSeconds?: number;
  }): { signedUrl: string } {
    if (!params.storagePath || !params.storagePath.startsWith('kyc/')) {
      throw new BadRequestException('Invalid KYC document storage path');
    }

    const expiresInSeconds = params.expiresInSeconds ?? 3600;
    return {
      signedUrl: `${this.publicBaseUrl}/${params.storagePath}?expiresIn=${expiresInSeconds}`,
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
    if (!file.buffer) {
      return;
    }

    if (file.buffer.length === 0) {
      throw new BadRequestException('Empty file upload is not allowed');
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
