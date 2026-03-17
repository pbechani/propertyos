import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database';

export interface PropertyConditionAssessmentRow {
  id: string;
  property_id: string;
  submitted_by: string;
  inspection_date: string;
  inspector_name: string | null;
  year_built: string | null;
  last_renovation: string | null;
  overall_notes: string | null;
  room_conditions: Record<string, unknown>;
  created_at: string;
}

export interface CreateAssessmentParams {
  propertyId: string;
  submittedBy: string;
  inspectionDate: string;
  inspectorName?: string;
  yearBuilt?: string;
  lastRenovation?: string;
  overallNotes?: string;
  roomConditions: Record<string, unknown>;
}

@Injectable()
export class PropertyConditionService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(
    propertyId: string,
    userId: string,
  ): Promise<void> {
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

  async create(
    params: CreateAssessmentParams,
  ): Promise<PropertyConditionAssessmentRow> {
    await this.assertAccess(params.propertyId, params.submittedBy);

    const roomJson = JSON.stringify(params.roomConditions);

    const rows = await this.prisma.$queryRaw<PropertyConditionAssessmentRow[]>`
      INSERT INTO property.property_condition_assessments (
        property_id, submitted_by, inspection_date, inspector_name,
        year_built, last_renovation, overall_notes, room_conditions
      ) VALUES (
        ${params.propertyId}::uuid,
        ${params.submittedBy}::uuid,
        ${params.inspectionDate}::date,
        ${params.inspectorName ?? null},
        ${params.yearBuilt ?? null},
        ${params.lastRenovation ?? null},
        ${params.overallNotes ?? null},
        ${roomJson}::jsonb
      )
      RETURNING *
    `;
    return rows[0];
  }

  async list(
    propertyId: string,
    requesterId: string,
  ): Promise<PropertyConditionAssessmentRow[]> {
    await this.assertAccess(propertyId, requesterId);

    return this.prisma.$queryRaw<PropertyConditionAssessmentRow[]>`
      SELECT * FROM property.property_condition_assessments
      WHERE property_id = ${propertyId}::uuid
      ORDER BY created_at DESC
    `;
  }
}
