import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'showing',
  'offer',
  'closed',
  'inactive',
] as const;

export const ACTIVITY_TYPES = [
  'call',
  'email',
  'viewing_scheduled',
  'offer_submitted',
  'note',
] as const;

export const LEAD_SOURCES = [
  'portal_enquiry',
  'referral',
  'walk_in',
  'social_media',
  'open_house',
] as const;

export class CreateLeadDto {
  @IsString()
  @MaxLength(255)
  contactName!: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsIn(LEAD_SOURCES)
  leadSource?: string;

  @IsOptional()
  buyerRequirements?: {
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    areas?: string[];
    propertyTypes?: string[];
  };

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  assignedPropertyId?: string;
}

export class UpdateLeadStatusDto {
  @IsIn(LEAD_STATUSES)
  status!: string;
}

export class LogActivityDto {
  @IsIn(ACTIVITY_TYPES)
  activityType!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  scheduledAt?: string;

  @IsOptional()
  completedAt?: string;
}
