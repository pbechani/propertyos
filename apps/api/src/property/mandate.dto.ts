import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export const MANDATE_TYPES = ['sole', 'open'] as const;
export type MandateType = (typeof MANDATE_TYPES)[number];

export const MANDATE_STATUSES = ['pending_signature', 'active', 'expired', 'cancelled'] as const;

export const MANDATE_SIGNING_PARTIES = ['seller', 'agent'] as const;
export type MandateSigningParty = (typeof MANDATE_SIGNING_PARTIES)[number];

export class CreateMandateDto {
  @IsIn(MANDATE_TYPES)
  mandateType!: MandateType;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  commissionRate!: number;

  @IsOptional()
  commissionVatInclusive?: boolean;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  autoRenewal?: boolean;

  @IsOptional()
  @IsString()
  termsDocumentUrl?: string;

  @IsOptional()
  @IsUUID()
  brokerageId?: string;

  /** Seller contact info — required when seller is not a platform user */
  @IsOptional()
  @IsString()
  sellerName?: string;

  @IsOptional()
  @IsString()
  sellerEmail?: string;

  @IsOptional()
  @IsString()
  sellerPhone?: string;

  /** Defaults to true. Set to false when the seller has no platform account. */
  @IsOptional()
  @IsBoolean()
  sellerIsPlatformUser?: boolean;
}

/** Used by agents to confirm an offline seller has signed a physical agreement. */
export class MarkSellerSignedOfflineDto {
  @IsString()
  @IsNotEmpty()
  documentUrl!: string;
}

export class SignMandateDto {
  @IsIn(MANDATE_SIGNING_PARTIES)
  party!: MandateSigningParty;
}

export class CancelMandateDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ValuationRequestDto {
  @IsIn(['formal', 'cma'])
  valuationType!: 'formal' | 'cma';

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedValue!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  marketLow?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  marketHigh?: number;

  @IsString()
  @IsNotEmpty()
  currency: string = 'ZAR';

  @IsDateString()
  valuationDate!: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  comparables?: object[];

  @IsOptional()
  @IsString()
  reportDocumentUrl?: string;

  @IsOptional()
  isBankAccepted?: boolean;

  @IsOptional()
  @IsIn(['listing', 'bond_application', 'insurance', 'legal'])
  requestingPurpose?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitValuationReportDto {
  @IsString()
  @IsNotEmpty()
  reportDocumentUrl!: string;

  @IsOptional()
  isBankAccepted?: boolean;
}

export class CreateViewingDto {
  @IsIn(['physical', 'virtual', 'open_house'])
  viewingType!: 'physical' | 'virtual' | 'open_house';

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  virtualLink?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AgentBookViewingDto {
  @IsIn(['physical', 'virtual'])
  viewingType!: 'physical' | 'virtual';

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  virtualLink?: string;

  /** Buyer contact — stored in agent_notes as JSON for offline-booked viewings */
  @IsString()
  buyerContactName!: string;

  @IsOptional()
  @IsString()
  buyerContactEmail?: string;

  @IsOptional()
  @IsString()
  buyerContactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ViewingFeedbackDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  interested?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AgentViewingUpdateDto {
  @IsOptional()
  @IsString()
  agentNotes?: string;

  @IsOptional()
  @IsString()
  noShowReason?: string;
}

// ──────────────────────────────────────────────────────────
// VIEWING LIFECYCLE DTOs
// ──────────────────────────────────────────────────────────

export class AgentDeclineViewingDto {
  /** Reason shown to the buyer (min 10 chars) */
  @IsString()
  @MinLength(10)
  reason!: string;

  /** ISO date-time strings the agent is available on */
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  alternativeDates?: string[];

  /** Optional longer message to accompany the declined notification */
  @IsOptional()
  @IsString()
  message?: string;
}

export class CancelViewingDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}

export class RescheduleViewingDto {
  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  @Type(() => Number)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  virtualLink?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateOpenHouseDto {
  @IsDateString()
  scheduledAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxAttendees?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CancelOpenHouseDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}

export class RescheduleOpenHouseDto {
  @IsDateString()
  scheduledAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
