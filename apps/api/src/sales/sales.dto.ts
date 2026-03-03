import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsUUID,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsNotEmpty,
  IsDateString,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SALE_STATUSES,
  STAGE_STATUSES,
  DOCUMENT_STATUSES,
  GOV_STATUSES,
  ISSUE_TYPES,
  ISSUE_STATUSES,
} from './sales.constants';

// ─────────────────────────────────────────────────────────────────────────────
// Initiate Sale
// ─────────────────────────────────────────────────────────────────────────────

export class InitiateSaleDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  sellerId!: string;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  agreedPrice!: number;

  @IsString()
  @MaxLength(3)
  currency!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Conveyancer
// ─────────────────────────────────────────────────────────────────────────────

export class AssignConveyancerDto {
  @IsOptional()
  @IsUUID()
  buyerConveyancerId?: string;

  @IsOptional()
  @IsUUID()
  sellerConveyancerId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage Actions
// ─────────────────────────────────────────────────────────────────────────────

export class StartStageDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CompleteStageDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class FlagStageDto {
  @IsIn(ISSUE_TYPES)
  issueType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  documentName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentType?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateDocumentStatusDto {
  @IsIn(DOCUMENT_STATUSES)
  status!: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Government Interactions
// ─────────────────────────────────────────────────────────────────────────────

export class CreateGovernmentInteractionDto {
  @IsInt()
  @Min(1)
  @Max(14)
  stageNumber!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  departmentName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  applicationReference?: string;

  @IsOptional()
  @IsDateString()
  submissionDate?: string;

  @IsOptional()
  @IsDateString()
  expectedCompletionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateGovernmentInteractionDto {
  @IsOptional()
  @IsIn(GOV_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  applicationReference?: string;

  @IsOptional()
  @IsDateString()
  submissionDate?: string;

  @IsOptional()
  @IsDateString()
  expectedCompletionDate?: string;

  @IsOptional()
  @IsDateString()
  actualCompletionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];

  @IsOptional()
  @IsArray()
  visibleToRoles?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Query / List
// ─────────────────────────────────────────────────────────────────────────────

export class ListSalesQueryDto {
  @IsOptional()
  @IsIn(SALE_STATUSES)
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  @Type(() => Number)
  stage?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
