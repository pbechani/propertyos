import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database';

@Injectable()
export class SavedPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, propertyId: string): Promise<void> {
    const property = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM property.properties WHERE id = ${propertyId}::uuid AND status = 'active'
      LIMIT 1
    `;
    if (!property[0]) throw new NotFoundException('Property not found or not active');

    await this.prisma.$executeRaw`
      INSERT INTO property.saved_properties (user_id, property_id)
      VALUES (${userId}::uuid, ${propertyId}::uuid)
      ON CONFLICT DO NOTHING
    `;
  }

  async unsave(userId: string, propertyId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM property.saved_properties
      WHERE user_id = ${userId}::uuid AND property_id = ${propertyId}::uuid
    `;
  }

  async findSavedByUser(
    userId: string,
    params: { limit?: number; offset?: number },
  ): Promise<{ data: unknown[]; total: number }> {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT p.*, sp.created_at as saved_at
        FROM property.saved_properties sp
        JOIN property.properties p ON sp.property_id = p.id
        WHERE sp.user_id = ${userId}::uuid
        ORDER BY sp.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.prisma.$queryRaw<[{ total: string }]>`
        SELECT COUNT(*)::text as total
        FROM property.saved_properties
        WHERE user_id = ${userId}::uuid
      `,
    ]);

    return {
      data: rows as unknown[],
      total: parseInt((countRows as [{ total: string }])[0].total, 10),
    };
  }
}
