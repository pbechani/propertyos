import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsUUID,
  IsArray,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
  IsDateString,
  IsEmail,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  SORT_OPTIONS,
  FRAUD_REPORT_TYPES,
  INQUIRY_TYPES,
  PropertyType,
  PropertyStatus,
  SortOption,
  FraudReportType,
  InquiryType,
  LISTING_TYPES,
  ListingType,
} from './property.constants';

// ────────────────────────────────────────────────────────────
// Location sub-DTO
// ────────────────────────────────────────────────────────────

export class CreateLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address_line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsString()
  @MaxLength(2)
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;
}

// ────────────────────────────────────────────────────────────
// Create / Update Property
// ────────────────────────────────────────────────────────────

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf((o) => o.property_type === undefined)
  @IsIn(PROPERTY_TYPES)
  propertyType!: PropertyType;

  @ValidateIf((o) => o.propertyType === undefined)
  @IsIn(PROPERTY_TYPES)
  property_type?: PropertyType;

  @IsOptional()
  @IsIn(LISTING_TYPES)
  listingType?: ListingType;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  @MaxLength(3)
  currency: string = 'USD';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  areaSqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  area_sqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  parkingSpaces?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  parking_spaces?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(PROPERTY_STATUSES)
  status?: PropertyStatus;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  propertyType?: PropertyType;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  property_type?: PropertyType;

  @IsOptional()
  @IsIn(LISTING_TYPES)
  listingType?: ListingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  areaSqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  area_sqm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  parkingSpaces?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  parking_spaces?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto;
}

// ────────────────────────────────────────────────────────────
// Search / Filter
// ────────────────────────────────────────────────────────────

export class SearchPropertiesDto {
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  type?: PropertyType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bathrooms?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  @Type(() => Number)
  radiusKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  @Type(() => Number)
  radius_km?: number;

  @IsOptional()
  @IsIn(['verified', 'unverified', 'pending', 'flagged'])
  verificationStatus?: string;

  @IsOptional()
  @IsIn(['verified', 'unverified', 'pending', 'flagged'])
  verification_status?: string;

  @IsOptional()
  @IsString()
  features?: string; // comma-separated

  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: SortOption;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ────────────────────────────────────────────────────────────
// Verification
// ────────────────────────────────────────────────────────────

export class SubmitVerificationDto {
  @IsOptional()
  @IsString()
  deedNumber?: string;

  @IsOptional()
  @IsString()
  registryReference?: string;
}

export class AdminVerifyDto {
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}

export class AdminRejectDto {
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}

// ────────────────────────────────────────────────────────────
// Inquiries
// ────────────────────────────────────────────────────────────

export class CreateInquiryDto {
  @IsIn(INQUIRY_TYPES)
  inquiryType!: InquiryType;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;
}

export class RespondInquiryDto {
  @IsString()
  @IsNotEmpty()
  response!: string;
}

// ────────────────────────────────────────────────────────────
// Fraud Reports
// ────────────────────────────────────────────────────────────

export class CreateFraudReportDto {
  @IsIn(FRAUD_REPORT_TYPES)
  reportType!: FraudReportType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

export class ResolveFraudReportDto {
  @IsIn(['resolved', 'dismissed'])
  resolution!: 'resolved' | 'dismissed';

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

// ────────────────────────────────────────────────────────────
// Agent Contact & Schedule Call
// ────────────────────────────────────────────────────────────

export class ContactAgentDto {
  /** Optional free-text message for the agent */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  /** Requester's display name (for anonymous / public requests) */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  requesterName?: string;

  /** Requester's email (for anonymous / public requests) */
  @IsOptional()
  @IsEmail()
  requesterEmail?: string;

  /** Requester's phone (for anonymous / public requests) */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  requesterPhone?: string;
}

export class ScheduleCallDto {
  /** ISO date-time for the preferred call slot */
  @IsDateString()
  preferredDate!: string;

  /** Optional message / notes for the agent */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  /** Requester's display name */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  requesterName?: string;

  /** Requester's email */
  @IsOptional()
  @IsEmail()
  requesterEmail?: string;

  /** Requester's phone */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  requesterPhone?: string;
}
