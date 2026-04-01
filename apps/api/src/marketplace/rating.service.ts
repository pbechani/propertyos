import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { MARKETPLACE_AUDIT_ACTIONS } from './marketplace.constants';
import { CreateRatingDto } from './marketplace.dto';

@Injectable()
export class RatingService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly audit: MarketplaceAuditService,
  ) {}

  async create(dto: CreateRatingDto, raterId: string, ipAddress?: string) {
    // Prevent self-rating
    if (dto.ratedEntityId === raterId) {
      throw new BadRequestException('You cannot rate yourself.');
    }

    const rating = await this.prisma.marketplaceRating.create({
      data: {
        raterId,
        ratedEntityId: dto.ratedEntityId,
        entityType: dto.entityType,
        referenceId: dto.referenceId,
        overallScore: dto.overallScore,
        dimensionScores: (dto.dimensionScores as never) ?? undefined,
        reviewText: dto.reviewText,
      },
    });

    // Recalculate reputation score for rated entity
    await this.recalculateReputationScore(dto.ratedEntityId, dto.entityType);

    await this.audit.log({
      actorId: raterId,
      action: MARKETPLACE_AUDIT_ACTIONS.RATING_SUBMITTED,
      resourceType: 'rating',
      resourceId: rating.id,
      payload: {
        ratedEntityId: dto.ratedEntityId,
        entityType: dto.entityType,
        overallScore: dto.overallScore,
      },
      ipAddress,
    });

    return rating;
  }

  async findByEntity(
    ratedEntityId: string,
    entityType: string,
    opts: { page?: number; limit?: number } = {},
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ratedEntityId,
      entityType,
      isPublished: true,
    };

    const [data, total] = await Promise.all([
      this.prisma.marketplaceRating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceRating.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  private async recalculateReputationScore(
    entityId: string,
    entityType: string,
  ) {
    const agg = await this.prisma.marketplaceRating.aggregate({
      where: { ratedEntityId: entityId, entityType, isPublished: true },
      _avg: { overallScore: true },
    });

    const score = agg._avg.overallScore ?? 0;

    if (entityType === 'contractor') {
      await this.prisma.contractorProfile
        .updateMany({
          where: { id: entityId },
          data: { reputationScore: score },
        })
        .catch(() => {
          // Profile may not exist; ignore silently
        });
    } else if (entityType === 'supplier') {
      await this.prisma.supplierProfile
        .updateMany({
          where: { id: entityId },
          data: { reputationScore: score },
        })
        .catch(() => {
          // Profile may not exist; ignore silently
        });
    }
  }

  async findByContractor(contractorId: string, opts?: { page?: number; limit?: number }) {
    const profile = await this.prisma.contractorProfile.findUnique({
      where: { id: contractorId },
    });
    if (!profile) throw new NotFoundException('Contractor profile not found.');
    return this.findByEntity(contractorId, 'contractor', opts);
  }

  async findBySupplier(supplierId: string, opts?: { page?: number; limit?: number }) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { id: supplierId },
    });
    if (!profile) throw new NotFoundException('Supplier profile not found.');
    return this.findByEntity(supplierId, 'supplier', opts);
  }
}
