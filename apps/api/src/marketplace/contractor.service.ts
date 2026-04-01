import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService as DatabaseService } from '../database';
import { MarketplaceAuditService } from './marketplace-audit.service';
import { MARKETPLACE_AUDIT_ACTIONS } from './marketplace.constants';
import {
  AddPortfolioItemDto,
  ContractorListQueryDto,
  CreateContractorProfileDto,
  UpdateContractorProfileDto,
} from './marketplace.dto';

@Injectable()
export class ContractorService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly audit: MarketplaceAuditService,
  ) {}

  async createProfile(
    dto: CreateContractorProfileDto,
    actorId: string,
    ipAddress?: string,
  ) {
    // Enforce: exactly one of userId or companyId must be set
    const existing = await this.prisma.contractorProfile.findFirst({
      where: dto.userId
        ? { userId: dto.userId }
        : { companyId: dto.companyId },
    });
    if (existing) {
      throw new ConflictException(
        'A contractor profile already exists for this user or company.',
      );
    }

    const profile = await this.prisma.contractorProfile.create({
      data: {
        userId: dto.userId,
        companyId: dto.companyId,
        businessName: dto.businessName,
        registrationNumber: dto.registrationNumber,
        specializations: (dto.specializations as never) ?? [],
        experienceYears: dto.experienceYears,
        maxProjectValue: dto.maxProjectValue,
        serviceAreas: (dto.serviceAreas as never) ?? [],
        certifications: (dto.certifications as never) ?? [],
        insuranceCertUrl: dto.insuranceCertUrl,
        insuranceExpiry: dto.insuranceExpiry
          ? new Date(dto.insuranceExpiry)
          : undefined,
        bio: dto.bio,
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.CONTRACTOR_PROFILE_CREATED,
      resourceType: 'contractor_profile',
      resourceId: profile.id,
      payload: { businessName: profile.businessName },
      ipAddress,
    });

    return profile;
  }

  async findAll(query: ContractorListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.verificationStatus) {
      where['verificationStatus'] = query.verificationStatus;
    }
    if (query.specialization) {
      where['specializations'] = { array_contains: [query.specialization] };
    }
    if (query.region) {
      where['serviceAreas'] = { array_contains: [query.region] };
    }

    const [data, total] = await Promise.all([
      this.prisma.contractorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reputationScore: 'desc' },
        include: { portfolio: { take: 3, orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.contractorProfile.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const profile = await this.prisma.contractorProfile.findUnique({
      where: { id },
      include: { portfolio: { orderBy: { createdAt: 'desc' } } },
    });
    if (!profile) throw new NotFoundException('Contractor profile not found.');
    return profile;
  }

  async updateProfile(
    id: string,
    dto: UpdateContractorProfileDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.contractorProfile.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Contractor profile not found.');

    const updated = await this.prisma.contractorProfile.update({
      where: { id },
      data: {
        businessName: dto.businessName ?? existing.businessName,
        registrationNumber:
          dto.registrationNumber ?? existing.registrationNumber,
        specializations: dto.specializations
          ? (dto.specializations as never)
          : (existing.specializations as never),
        experienceYears: dto.experienceYears ?? existing.experienceYears,
        maxProjectValue: dto.maxProjectValue ?? existing.maxProjectValue,
        serviceAreas: dto.serviceAreas
          ? (dto.serviceAreas as never)
          : (existing.serviceAreas as never),
        certifications: dto.certifications
          ? (dto.certifications as never)
          : (existing.certifications as never),
        insuranceCertUrl: dto.insuranceCertUrl ?? existing.insuranceCertUrl,
        insuranceExpiry: dto.insuranceExpiry
          ? new Date(dto.insuranceExpiry)
          : existing.insuranceExpiry,
        bio: dto.bio ?? existing.bio,
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.CONTRACTOR_PROFILE_UPDATED,
      resourceType: 'contractor_profile',
      resourceId: id,
      ipAddress,
    });

    return updated;
  }

  async addPortfolioItem(
    contractorProfileId: string,
    dto: AddPortfolioItemDto,
    actorId: string,
    ipAddress?: string,
  ) {
    const profile = await this.prisma.contractorProfile.findUnique({
      where: { id: contractorProfileId },
    });
    if (!profile) throw new NotFoundException('Contractor profile not found.');

    const item = await this.prisma.contractorPortfolioItem.create({
      data: {
        contractorProfileId,
        projectTitle: dto.projectTitle,
        projectType: dto.projectType,
        projectValue: dto.projectValue,
        completionDate: dto.completionDate
          ? new Date(dto.completionDate)
          : undefined,
        description: dto.description,
        mediaUrls: (dto.mediaUrls as never) ?? [],
      },
    });

    await this.audit.log({
      actorId,
      action: MARKETPLACE_AUDIT_ACTIONS.CONTRACTOR_PORTFOLIO_ADDED,
      resourceType: 'contractor_portfolio',
      resourceId: item.id,
      payload: { contractorProfileId, projectTitle: dto.projectTitle },
      ipAddress,
    });

    return item;
  }
}
