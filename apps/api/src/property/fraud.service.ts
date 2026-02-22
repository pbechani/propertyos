import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import { CreateFraudReportDto, ResolveFraudReportDto } from './property.dto';

@Injectable()
export class FraudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
  ) {}

  async create(
    propertyId: string,
    reporterId: string,
    reporterRole: string,
    dto: CreateFraudReportDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<unknown> {
    const property = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!property[0]) throw new NotFoundException('Property not found');

    const result = await this.prisma.$queryRaw`
      INSERT INTO property.fraud_reports
        (property_id, reporter_id, report_type, description, evidence_urls)
      VALUES (
        ${propertyId}::uuid,
        ${reporterId}::uuid,
        ${dto.reportType},
        ${dto.description},
        ${JSON.stringify(dto.evidenceUrls ?? [])}::jsonb
      )
      RETURNING *
    `;

    // Flag the property for admin review
    await this.prisma.$executeRaw`
      UPDATE property.properties
      SET verification_status = 'flagged', updated_at = NOW()
      WHERE id = ${propertyId}::uuid
        AND verification_status NOT IN ('flagged')
    `;

    await this.audit.log({
      actorId: reporterId,
      actorRole: reporterRole,
      action: 'property.fraud.reported',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { reportType: dto.reportType },
      ipAddress,
      userAgent,
    });

    return (result as unknown[])[0];
  }

  async findAll(params: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: unknown[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const allowedStatuses = new Set([
      'submitted',
      'under_investigation',
      'resolved',
      'dismissed',
    ]);

    if (params.status && !allowedStatuses.has(params.status)) {
      throw new BadRequestException('Invalid fraud report status filter');
    }

    const [rows, countRows] = await Promise.all(
      params.status
        ? [
            this.prisma.$queryRaw`
              SELECT fr.*, p.title as property_title
              FROM property.fraud_reports fr
              JOIN property.properties p ON fr.property_id = p.id
              WHERE fr.status = ${params.status}
              ORDER BY fr.created_at DESC
              LIMIT ${limit} OFFSET ${offset}
            `,
            this.prisma.$queryRaw<[{ total: string }]>`
              SELECT COUNT(*)::text as total
              FROM property.fraud_reports fr
              WHERE fr.status = ${params.status}
            `,
          ]
        : [
            this.prisma.$queryRaw`
              SELECT fr.*, p.title as property_title
              FROM property.fraud_reports fr
              JOIN property.properties p ON fr.property_id = p.id
              ORDER BY fr.created_at DESC
              LIMIT ${limit} OFFSET ${offset}
            `,
            this.prisma.$queryRaw<[{ total: string }]>`
              SELECT COUNT(*)::text as total
              FROM property.fraud_reports fr
            `,
          ],
    );

    return {
      data: rows as unknown[],
      total: parseInt((countRows as [{ total: string }])[0].total, 10),
    };
  }

  async resolve(
    reportId: string,
    adminId: string,
    dto: ResolveFraudReportDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<unknown> {
    const report = await this.prisma.$queryRaw<{ id: string; property_id: string }[]>`
      SELECT id, property_id FROM property.fraud_reports
      WHERE id = ${reportId}::uuid LIMIT 1
    `;
    if (!report[0]) throw new NotFoundException('Fraud report not found');

    const result = await this.prisma.$queryRaw`
      UPDATE property.fraud_reports
      SET status = ${dto.resolution},
          resolver_id = ${adminId}::uuid,
          resolution_notes = ${dto.resolutionNotes ?? null},
          resolved_at = NOW()
      WHERE id = ${reportId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: adminId,
      actorRole: 'admin',
      action: `property.fraud.${dto.resolution}`,
      resourceType: 'fraud_report',
      resourceId: reportId,
      ipAddress,
      userAgent,
    });

    return (result as unknown[])[0];
  }
}
