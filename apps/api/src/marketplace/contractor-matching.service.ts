import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { CONTRACTOR_AVAILABILITY, EARTH_RADIUS_KM, MATCHING_WEIGHTS } from './job.constants';
import { FindContractorsDto } from './job.dto';

export interface ContractorMatchResult {
  contractorId: string;
  profileId: string;
  businessName: string | null;
  primaryCategory: string | null;
  reputationScore: number;
  hourlyRate: number | null;
  availabilityStatus: string;
  totalJobsCompleted: number;
  distanceKm: number | null;
  matchScore: number;
}

@Injectable()
export class ContractorMatchingService {
  constructor(private readonly prisma: DatabaseService) {}

  /**
   * Find and rank contractors for a job using the weighted scoring algorithm:
   * Score = (reputation × 0.30) + (proximity × 0.25) + (price × 0.15) + (availability × 0.20) + (response × 0.10)
   */
  async findMatchingContractors(
    dto: FindContractorsDto,
  ): Promise<ContractorMatchResult[]> {
    const contractors = await this.prisma.contractorProfile.findMany({
      where: {
        verificationStatus: 'approved',
        availabilityStatus: { not: CONTRACTOR_AVAILABILITY.UNAVAILABLE },
        // When category filter provided, match against primaryCategory OR specializations JSON array
        ...(dto.category
          ? {
              OR: [
                { primaryCategory: { equals: dto.category, mode: 'insensitive' } },
                // JSON array containment — works with PostgreSQL JSON operators
                { specializations: { array_contains: dto.category } },
              ],
            }
          : {}),
      },
    });

    const scored = contractors.map((c) => {
      const reputationScore = Number(c.reputationScore);
      const hourlyRate = c.hourlyRate ? Number(c.hourlyRate) : null;

      // Distance score (1.0 = very close, 0.0 = beyond radius or unknown)
      let distanceKm: number | null = null;
      let distanceScore = 0.5; // neutral when no geo data

      if (
        dto.lat !== undefined &&
        dto.lng !== undefined &&
        c.locationLat !== null &&
        c.locationLng !== null
      ) {
        distanceKm = haversineKm(
          dto.lat,
          dto.lng,
          Number(c.locationLat),
          Number(c.locationLng),
        );
        const radiusKm = dto.radiusKm ?? 50;
        if (distanceKm > radiusKm) return null; // outside radius
        distanceScore = Math.max(0, 1 - distanceKm / radiusKm);
      }

      // Price score: lower hourly rate = higher score relative to budget
      let priceScore = 0.5;
      if (hourlyRate !== null && dto.maxBudget) {
        if (hourlyRate <= dto.maxBudget) {
          priceScore = 1 - hourlyRate / dto.maxBudget;
        } else {
          priceScore = 0;
        }
      }

      // Availability score
      const availabilityScore =
        c.availabilityStatus === CONTRACTOR_AVAILABILITY.AVAILABLE ? 1.0 : 0.3;

      // Response rate score (based on avgResponseHours — lower = better)
      const responseScore = c.avgResponseHours
        ? Math.max(0, 1 - Number(c.avgResponseHours) / 48)
        : 0.5;

      const matchScore =
        reputationScore / 5 * MATCHING_WEIGHTS.REPUTATION +
        distanceScore * MATCHING_WEIGHTS.DISTANCE +
        priceScore * MATCHING_WEIGHTS.PRICE +
        availabilityScore * MATCHING_WEIGHTS.AVAILABILITY +
        responseScore * MATCHING_WEIGHTS.RESPONSE_RATE;

      return {
        contractorId: c.userId ?? c.id,
        profileId: c.id,
        businessName: c.businessName,
        primaryCategory: c.primaryCategory,
        reputationScore,
        hourlyRate,
        availabilityStatus: c.availabilityStatus,
        totalJobsCompleted: c.totalJobsCompleted,
        distanceKm,
        matchScore: Math.round(matchScore * 100) / 100,
      };
    });

    return (scored.filter(Boolean) as ContractorMatchResult[])
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, dto.limit ?? 20);
  }

  async getContractorProfile(contractorId: string) {
    const profile = await this.prisma.contractorProfile.findFirst({
      where: { userId: contractorId },
      include: { portfolio: { take: 6, orderBy: { createdAt: 'desc' } } },
    });

    if (!profile) {
      throw new NotFoundException(`Contractor profile not found for user ${contractorId}`);
    }

    return profile;
  }

  async updateAvailability(
    contractorId: string,
    status: string,
  ) {
    return this.prisma.contractorProfile.updateMany({
      where: { userId: contractorId },
      data: { availabilityStatus: status },
    });
  }

  async getJobFeed(
    contractorId: string,
    category?: string,
    lat?: number,
    lng?: number,
    radiusKm = 50,
    limit = 20,
    offset = 0,
  ) {
    const where: Record<string, unknown> = {
      status: 'OPEN',
    };
    if (category) where['category'] = category;

    const jobs = await this.prisma.marketplaceJob.findMany({
      where,
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
      take: limit * 3, // over-fetch for geo filtering
      skip: offset,
      include: { _count: { select: { quotes: true } } },
    });

    // Geo filter
    let filtered = jobs;
    if (lat !== undefined && lng !== undefined) {
      filtered = jobs.filter((j) => {
        if (!j.locationLat || !j.locationLng) return true;
        const d = haversineKm(lat, lng, Number(j.locationLat), Number(j.locationLng));
        return d <= radiusKm;
      });
    }

    // Exclude jobs where this contractor already has a pending/accepted quote
    const quotedJobIds = await this.prisma.jobQuote.findMany({
      where: {
        contractorId,
        status: { in: ['PENDING', 'ACCEPTED'] },
        jobId: { in: filtered.map((j) => j.id) },
      },
      select: { jobId: true },
    });
    const quotedSet = new Set(quotedJobIds.map((q) => q.jobId));

    return filtered.filter((j) => !quotedSet.has(j.id)).slice(0, limit);
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
