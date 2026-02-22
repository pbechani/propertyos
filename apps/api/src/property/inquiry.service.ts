import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';
import { PropertyAuditService } from './property-audit.service';
import { CreateInquiryDto, RespondInquiryDto } from './property.dto';

@Injectable()
export class InquiryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PropertyAuditService,
  ) {}

  async create(
    propertyId: string,
    buyerId: string,
    buyerRole: string,
    dto: CreateInquiryDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<unknown> {
    const property = await this.prisma.$queryRaw<{ id: string; agent_id: string }[]>`
      SELECT id, agent_id FROM property.properties
      WHERE id = ${propertyId}::uuid AND status = 'active'
      LIMIT 1
    `;
    if (!property[0]) throw new NotFoundException('Property not found or not active');

    const result = await this.prisma.$queryRaw`
      INSERT INTO property.inquiries
        (property_id, buyer_id, inquiry_type, message, preferred_date)
      VALUES (
        ${propertyId}::uuid,
        ${buyerId}::uuid,
        ${dto.inquiryType},
        ${dto.message ?? null},
        ${dto.preferredDate ? new Date(dto.preferredDate) : null}::timestamptz
      )
      RETURNING *
    `;

    await this.audit.log({
      actorId: buyerId,
      actorRole: buyerRole,
      action: 'property.inquiry.created',
      resourceType: 'property',
      resourceId: propertyId,
      payload: { inquiryType: dto.inquiryType },
      ipAddress,
      userAgent,
    });

    return (result as unknown[])[0];
  }

  async findByProperty(
    propertyId: string,
    agentId: string,
    agentRole: string,
    params: { limit?: number; offset?: number },
  ): Promise<{ data: unknown[]; total: number }> {
    // Ensure agent owns the property (admins can see all)
    const property = await this.prisma.$queryRaw<{ agent_id: string }[]>`
      SELECT agent_id FROM property.properties
      WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!property[0]) throw new NotFoundException('Property not found');
    if (agentRole !== 'admin' && property[0].agent_id !== agentId) {
      throw new ForbiddenException('You can only view inquiries for your own listings');
    }

    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT * FROM property.inquiries
        WHERE property_id = ${propertyId}::uuid
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ total: string }]>`
        SELECT COUNT(*)::text as total
        FROM property.inquiries WHERE property_id = ${propertyId}::uuid
      `,
    ]);

    return {
      data: rows as unknown[],
      total: parseInt((countRows as [{ total: string }])[0].total, 10),
    };
  }

  async respond(
    inquiryId: string,
    agentId: string,
    agentRole: string,
    dto: RespondInquiryDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<unknown> {
    const inquiry = await this.prisma.$queryRaw<
      { id: string; property_id: string; status: string }[]
    >`
      SELECT i.id, i.property_id, i.status
      FROM property.inquiries i
      JOIN property.properties p ON i.property_id = p.id
      WHERE i.id = ${inquiryId}::uuid
        AND (p.agent_id = ${agentId}::uuid OR ${agentRole === 'admin'})
      LIMIT 1
    `;
    if (!inquiry[0]) {
      throw new NotFoundException('Inquiry not found or not authorized');
    }

    const result = await this.prisma.$queryRaw`
      UPDATE property.inquiries
      SET response = ${dto.response},
          status = 'responded',
          responded_at = NOW()
      WHERE id = ${inquiryId}::uuid
      RETURNING *
    `;

    await this.audit.log({
      actorId: agentId,
      actorRole: agentRole,
      action: 'property.inquiry.responded',
      resourceType: 'inquiry',
      resourceId: inquiryId,
      ipAddress,
      userAgent,
    });

    return (result as unknown[])[0];
  }
}
