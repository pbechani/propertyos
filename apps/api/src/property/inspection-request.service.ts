import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';

export interface InspectionRequestRow {
  id: string;
  property_id: string;
  requested_by: string;
  status: string;
  inspection_types: string[];
  urgency: string;
  preferred_date: string;
  preferred_time: string;
  alternate_date: string | null;
  alternate_time: string | null;
  inspector_name: string | null;
  inspector_company: string | null;
  inspector_phone: string | null;
  inspector_email: string | null;
  access_method: string;
  lockbox_code: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  areas_of_concern: string | null;
  special_instructions: string | null;
  notify_client: boolean;
  send_report_to: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInspectionRequestParams {
  propertyId: string;
  requestedBy: string;
  inspectionTypes: string[];
  urgency: string;
  preferredDate: string;
  preferredTime: string;
  alternateDate?: string;
  alternateTime?: string;
  inspectorName?: string;
  inspectorCompany?: string;
  inspectorPhone?: string;
  inspectorEmail?: string;
  accessMethod: string;
  lockboxCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  areasOfConcern?: string;
  specialInstructions?: string;
  notifyClient: boolean;
  sendReportTo: string;
}

@Injectable()
export class InspectionRequestService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(propertyId: string, userId: string): Promise<void> {
    const rows = await this.prisma.$queryRaw<
      { agent_id: string | null; owner_id: string | null }[]
    >`
      SELECT agent_id, owner_id FROM property.properties
      WHERE id = ${propertyId}::uuid LIMIT 1
    `;
    if (!rows.length) {
      throw new NotFoundException('Property not found');
    }
    const { agent_id, owner_id } = rows[0];
    if (agent_id !== userId && owner_id !== userId) {
      throw new ForbiddenException('You do not have access to this property');
    }
  }

  async create(params: CreateInspectionRequestParams): Promise<InspectionRequestRow> {
    await this.assertAccess(params.propertyId, params.requestedBy);

    const typesJson = JSON.stringify(params.inspectionTypes);

    const rows = await this.prisma.$queryRaw<InspectionRequestRow[]>`
      INSERT INTO property.inspection_requests (
        property_id, requested_by, inspection_types, urgency,
        preferred_date, preferred_time, alternate_date, alternate_time,
        inspector_name, inspector_company, inspector_phone, inspector_email,
        access_method, lockbox_code, contact_person, contact_phone, contact_email,
        areas_of_concern, special_instructions, notify_client, send_report_to
      ) VALUES (
        ${params.propertyId}::uuid,
        ${params.requestedBy}::uuid,
        ${typesJson}::jsonb,
        ${params.urgency},
        ${params.preferredDate}::date,
        ${params.preferredTime},
        ${params.alternateDate ?? null}::date,
        ${params.alternateTime ?? null},
        ${params.inspectorName ?? null},
        ${params.inspectorCompany ?? null},
        ${params.inspectorPhone ?? null},
        ${params.inspectorEmail ?? null},
        ${params.accessMethod},
        ${params.lockboxCode ?? null},
        ${params.contactPerson ?? null},
        ${params.contactPhone ?? null},
        ${params.contactEmail ?? null},
        ${params.areasOfConcern ?? null},
        ${params.specialInstructions ?? null},
        ${params.notifyClient},
        ${params.sendReportTo}
      )
      RETURNING *
    `;
    return rows[0];
  }

  async list(propertyId: string, requesterId: string): Promise<InspectionRequestRow[]> {
    await this.assertAccess(propertyId, requesterId);

    return this.prisma.$queryRaw<InspectionRequestRow[]>`
      SELECT * FROM property.inspection_requests
      WHERE property_id = ${propertyId}::uuid
      ORDER BY created_at DESC
    `;
  }
}
