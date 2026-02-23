import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KycService } from './kyc.service';
import { DocumentStorageService } from './document-storage.service';
import { AuditService } from './audit.service';

type KycDocumentType =
  | 'id_document'
  | 'address_proof'
  | 'business_registration'
  | 'selfie';

type KycRecord = {
  id: string;
  user_id: string;
  id_document_url: string | null;
  address_proof_url: string | null;
  business_registration_url: string | null;
  selfie_url: string | null;
};

@Injectable()
export class DocumentAccessService {
  private readonly signedUrlExpirySeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly kycService: KycService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly auditService: AuditService,
  ) {
    this.signedUrlExpirySeconds =
      this.configService.get<number>('SIGNED_URL_EXPIRY_SECONDS') ?? 3600;
  }

  async issueKycDocumentDownloadUrl(params: {
    kycId: string;
    documentType: string;
    actorId: string;
    actorRoles: string[];
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
    const documentType = this.validateDocumentType(params.documentType);

    const record = (await this.kycService.getById(params.kycId)) as KycRecord;
    const isAdmin = params.actorRoles.includes('admin');

    if (!isAdmin && record.user_id !== params.actorId) {
      throw new ForbiddenException(
        'You are not allowed to access this KYC document',
      );
    }

    const storagePath = this.resolveDocumentPath(record, documentType);
    if (!storagePath) {
      throw new NotFoundException('KYC document not found');
    }

    const { signedUrl } = this.documentStorageService.generateDownloadUrl({
      storagePath,
      expiresInSeconds: this.signedUrlExpirySeconds,
    });

    await this.auditService.log({
      eventId: 'kyc.document_download_url_issued',
      actorId: params.actorId,
      actorRole: params.actorRoles[0] ?? null,
      action: 'issue_kyc_document_download_url',
      resourceType: 'kyc_verification',
      resourceId: record.id,
      payload: {
        document_type: documentType,
        target_user_id: record.user_id,
        expires_in_seconds: this.signedUrlExpirySeconds,
      },
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });

    return {
      downloadUrl: signedUrl,
      expiresInSeconds: this.signedUrlExpirySeconds,
    };
  }

  private validateDocumentType(type: string): KycDocumentType {
    const supported: KycDocumentType[] = [
      'id_document',
      'address_proof',
      'business_registration',
      'selfie',
    ];

    if (!supported.includes(type as KycDocumentType)) {
      throw new BadRequestException(
        `Invalid document type. Allowed: ${supported.join(', ')}`,
      );
    }

    return type as KycDocumentType;
  }

  private resolveDocumentPath(
    record: KycRecord,
    documentType: KycDocumentType,
  ): string | null {
    if (documentType === 'id_document') {
      return record.id_document_url;
    }

    if (documentType === 'address_proof') {
      return record.address_proof_url;
    }

    if (documentType === 'business_registration') {
      return record.business_registration_url;
    }

    return record.selfie_url;
  }
}
