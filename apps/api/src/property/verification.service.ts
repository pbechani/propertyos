import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import { AdminRejectDto, AdminVerifyDto, SubmitVerificationDto } from './property.dto';
import { VerificationStorageService } from './verification-storage.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
    private readonly verificationStorageService: VerificationStorageService,
  ) {}

  async submitVerificationRequest(
    propertyId: string,
    agentId: string,
    agentRole: string,
    dto: SubmitVerificationDto,
    titleDeedFile: Express.Multer.File | undefined,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ id: string; status: string }> {
    if (!titleDeedFile) {
      throw new BadRequestException('Title deed upload is required');
    }

    // Validate property ownership
    const property = await this.prisma.$queryRaw<
      { agent_id: string; verification_status: string }[]
    >`
      SELECT agent_id, verification_status FROM property.properties
      WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!property[0]) throw new NotFoundException('Property not found');
    if (agentRole !== 'admin' && property[0].agent_id !== agentId) {
      throw new ForbiddenException('You can only request verification for your own listings');
    }
    if (property[0].verification_status === 'verified') {
      throw new ConflictException('Property is already verified');
    }

    // Check for pending or active verification
    const existing = await this.prisma.$queryRaw<{ id: string; status: string }[]>`
      SELECT id, status FROM property.verifications
      WHERE property_id = ${propertyId}::uuid AND status = 'pending'
      LIMIT 1
    `;
    if (existing[0]) {
      throw new ConflictException(
        'A verification request is already pending for this property',
      );
    }

    const uploadedTitleDeed = await this.verificationStorageService.uploadTitleDeed({
      propertyId,
      agentId,
      file: titleDeedFile,
    });

    const result = await this.prisma.$queryRaw<{ id: string; status: string }[]>`
      INSERT INTO property.verifications
        (property_id, title_deed_url, deed_number, registry_reference)
      VALUES (
        ${propertyId}::uuid,
        ${uploadedTitleDeed.storagePath},
        ${dto.deedNumber ?? null},
        ${dto.registryReference ?? null}
      )
      RETURNING id, status
    `;

    // Update verification_status on the property to 'pending'
    await this.prisma.$executeRaw`
      UPDATE property.properties
      SET verification_status = 'pending', updated_at = NOW()
      WHERE id = ${propertyId}::uuid
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      action: 'property.verification.submitted',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { verificationId: result[0].id },
      ipAddress,
      userAgent,
    });

    return result[0];
  }

  async getPendingVerifications(params: {
    limit?: number;
    offset?: number;
  }): Promise<{ data: unknown[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT v.*, p.title, p.property_type, p.agent_id
        FROM property.verifications v
        JOIN property.properties p ON v.property_id = p.id
        WHERE v.status = 'pending'
        ORDER BY v.submitted_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ total: string }]>`
        SELECT COUNT(*)::text as total FROM property.verifications WHERE status = 'pending'
      `,
    ]);

    return {
      data: rows as unknown[],
      total: parseInt((countRows as [{ total: string }])[0].total, 10),
    };
  }

  async approveVerification(
    propertyId: string,
    adminId: string,
    dto: AdminVerifyDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.updateVerificationStatus(propertyId, adminId, 'approved', dto.reviewerNotes);

    await this.prisma.$executeRaw`
      UPDATE property.properties
      SET verification_status = 'verified',
          verified_at = NOW(),
          verified_by = ${adminId}::uuid,
          updated_at = NOW()
      WHERE id = ${propertyId}::uuid
    `;

    await this.audit.log({
      actorId: adminId,
      actorRole: 'admin',
      action: 'property.verification.approved',
      resourceType: 'property',
      resourceId: propertyId,
      ipAddress,
      userAgent,
    });
  }

  async rejectVerification(
    propertyId: string,
    adminId: string,
    dto: AdminRejectDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.updateVerificationStatus(propertyId, adminId, 'rejected', dto.reviewerNotes);

    await this.prisma.$executeRaw`
      UPDATE property.properties
      SET verification_status = 'flagged',
          updated_at = NOW()
      WHERE id = ${propertyId}::uuid
    `;

    await this.audit.log({
      actorId: adminId,
      actorRole: 'admin',
      action: 'property.verification.rejected',
      resourceType: 'property',
      resourceId: propertyId,
      ipAddress,
      userAgent,
    });
  }

  private async updateVerificationStatus(
    propertyId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    reviewerNotes?: string,
  ): Promise<void> {
    const verification = await this.prisma.$queryRaw<{ id: string; status: string }[]>`
      SELECT id, status FROM property.verifications
      WHERE property_id = ${propertyId}::uuid AND status = 'pending'
      LIMIT 1
    `;
    if (!verification[0]) {
      throw new NotFoundException('No pending verification found for this property');
    }

    await this.prisma.$executeRaw`
      UPDATE property.verifications
      SET status = ${status},
          reviewer_id = ${reviewerId}::uuid,
          reviewer_notes = ${reviewerNotes ?? null},
          reviewed_at = NOW()
      WHERE id = ${verification[0].id}::uuid
    `;
  }
}
