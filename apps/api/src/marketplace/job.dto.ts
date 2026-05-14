import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JOB_CATEGORIES } from './job.constants';

// ─────────────────────────────────────────────────────────────────────────────
// Job DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(JOB_CATEGORIES)
  category!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationLabel?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budgetMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(JOB_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationLabel?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budgetMax?: number;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;
}

export class JobListQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(JOB_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  /** Radius in km for geo search */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Quote DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateJobQuoteDto {
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  laborAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  materialsAmount?: number;

  @IsOptional()
  @IsArray()
  breakdown?: Array<{ label: string; amount: number }>;

  @IsOptional()
  @IsInt()
  @Min(1)
  timelineDays?: number;

  @IsOptional()
  @IsString()
  message?: string;
}

export class RespondToQuoteDto {
  @IsString()
  @IsIn(['ACCEPTED', 'REJECTED'])
  decision!: 'ACCEPTED' | 'REJECTED';
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Milestone DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
}

export class UpdateMilestoneStatusDto {
  @IsString()
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'APPROVED'])
  status!: 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Messaging DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class MarkReadDto {
  @IsArray()
  @IsUUID('4', { each: true })
  messageIds!: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Contractor Matching DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class FindContractorsDto {
  @IsString()
  @IsIn(JOB_CATEGORIES)
  category!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxBudget?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
