// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 Enhanced — DTOs
// ─────────────────────────────────────────────────────────────────────────────
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
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ── OTP ───────────────────────────────────────────────────────────────────────

export class CreateOtpDto {
  @IsNumber()
  @Min(1)
  offeredPrice!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsNumber()
  depositDueDays?: number;

  @IsOptional()
  @IsDateString()
  occupationalDate?: string;

  @IsOptional()
  @IsNumber()
  occupationalRentalPerDay?: number;

  @IsOptional()
  @IsBoolean()
  bondCondition?: boolean;

  @IsOptional()
  @IsNumber()
  bondAmount?: number;

  @IsOptional()
  @IsString()
  bondInstitution?: string;

  @IsOptional()
  @IsNumber()
  bondDeadlineDays?: number;

  @IsOptional()
  @IsBoolean()
  inspectionCondition?: boolean;

  @IsOptional()
  @IsNumber()
  inspectionDeadlineDays?: number;

  @IsOptional()
  @IsBoolean()
  subjectToSale?: boolean;

  @IsOptional()
  @IsDateString()
  subjectToSaleDeadlineDate?: string;

  @IsOptional()
  @IsBoolean()
  voetstoetsAccepted?: boolean;

  @IsOptional()
  @IsString()
  sellerDisclosureUrl?: string;

  @IsDateString()
  offerValidUntil!: string;

  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @IsOptional()
  @IsUUID()
  sellerId?: string;
}

export class SignOtpDto {
  @IsString()
  @IsNotEmpty()
  signatureUrl!: string;
}

export class CounterOfferDto {
  @IsNumber()
  @Min(1)
  offeredPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsNumber()
  depositDueDays?: number;

  @IsOptional()
  @IsDateString()
  occupationalDate?: string;

  @IsDateString()
  offerValidUntil!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  changes?: Record<string, unknown>;
}

export class WithdrawOtpDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

// ── Deal Room ─────────────────────────────────────────────────────────────────

export class SendDealRoomMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsIn(['offer_negotiation', 'general', 'conveyancer_only', 'agent_only', 'compliance'])
  threadType?: string;

  @IsOptional()
  @IsUUID()
  otpId?: string;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];
}

export class MarkReadDto {
  // placeholder — no body required, actor from JWT
}

// ── Bond Application ─────────────────────────────────────────────────────────

export class CreateBondApplicationDto {
  @IsUUID()
  buyerId!: string;

  @IsOptional()
  @IsUUID()
  mortgageBrokerId?: string;

  @IsOptional()
  @IsArray()
  banksAppliedTo?: unknown[];

  @IsOptional()
  @IsString()
  originator?: string;

  @IsOptional()
  @IsNumber()
  loanAmount?: number;

  @IsOptional()
  @IsNumber()
  propertyValueUsed?: number;

  @IsOptional()
  @IsNumber()
  ltvPct?: number;
}

export class UpdateBondApplicationDto {
  @IsOptional()
  @IsArray()
  banksAppliedTo?: unknown[];

  @IsOptional()
  @IsIn(['in_progress', 'approved', 'approved_with_conditions', 'declined'])
  status?: string;

  @IsOptional()
  @IsNumber()
  approvedAmount?: number;

  @IsOptional()
  @IsNumber()
  interestRatePct?: number;

  @IsOptional()
  @IsNumber()
  loanTermYears?: number;

  @IsOptional()
  @IsArray()
  conditions?: unknown[];

  @IsOptional()
  @IsString()
  grantCertificateUrl?: string;

  @IsOptional()
  @IsString()
  declinedReason?: string;
}

// ── Compliance ────────────────────────────────────────────────────────────────

export class ComplianceRequirementItemDto {
  @IsIn(['electrical', 'plumbing', 'gas', 'electric_fence', 'beetle', 'rates_clearance'])
  certType!: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsIn(['seller', 'conveyancer'])
  requiredBy?: string;

  @IsOptional()
  @IsNumber()
  dueByStage?: number;

  @IsOptional()
  @IsDateString()
  deadlineDate?: string;

  @IsOptional()
  @IsString()
  waiverReason?: string;
}

export class SetupComplianceRequirementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComplianceRequirementItemDto)
  requirements!: ComplianceRequirementItemDto[];
}

export class UpdateComplianceStatusDto {
  @IsIn(['pending', 'booked', 'received', 'verified', 'waived'])
  status!: string;

  @IsOptional()
  @IsUUID()
  certificateId?: string;

  @IsOptional()
  @IsString()
  waiverReason?: string;
}

// ── Disbursement ──────────────────────────────────────────────────────────────

export class OtherDeductionDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class CreateDisbursementInstructionDto {
  @IsNumber()
  @Min(0)
  totalProceeds!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  existingBondSettlement?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  transferDutyPaid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  conveyancerFees?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  agentCommission?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ratesClearancePayment?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherDeductionDto)
  otherDeductions?: OtherDeductionDto[];
}

export class ApproveDisbursementDto {
  // no required fields — approval is an action without extra payload
}

// ── Seller Disclosure ─────────────────────────────────────────────────────────

export class CreateSellerDisclosureDto {
  @IsOptional()
  @IsBoolean()
  structuralDefectsKnown?: boolean;

  @IsOptional()
  @IsString()
  structuralDefectsDescription?: string;

  @IsOptional()
  @IsBoolean()
  waterLeakHistory?: boolean;

  @IsOptional()
  @IsString()
  waterLeakDescription?: string;

  @IsOptional()
  @IsBoolean()
  pestInfestationHistory?: boolean;

  @IsOptional()
  @IsString()
  pestDescription?: string;

  @IsOptional()
  @IsBoolean()
  boundaryDisputes?: boolean;

  @IsOptional()
  @IsString()
  neighbourRelationsNotes?: string;

  @IsOptional()
  @IsBoolean()
  bodyCorporateDisputes?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outstandingLevies?: number;

  @IsOptional()
  @IsBoolean()
  interdictsOrCourtOrders?: boolean;

  @IsOptional()
  @IsBoolean()
  pendingLitigation?: boolean;

  @IsOptional()
  @IsBoolean()
  approvedBuildingPlans?: boolean;

  @IsOptional()
  @IsBoolean()
  unauthorisedStructures?: boolean;

  @IsOptional()
  @IsString()
  unauthorisedStructuresDescription?: string;
}

export class SignSellerDisclosureDto {
  @IsOptional()
  @IsString()
  disclosureDocumentUrl?: string;

  @IsOptional()
  @IsString()
  hash?: string;
}

// ── Post-Sale Checklist ───────────────────────────────────────────────────────

export class UpdatePostSaleChecklistDto {
  @IsOptional()
  @IsBoolean()
  keysHandoverConfirmed?: boolean;

  @IsOptional()
  @IsDateString()
  keysHandoverAt?: string;

  @IsOptional()
  @IsBoolean()
  titleDeedReceivedByBuyer?: boolean;

  @IsOptional()
  @IsDateString()
  titleDeedReceivedAt?: string;

  @IsOptional()
  @IsBoolean()
  newBondRegistered?: boolean;

  @IsOptional()
  @IsBoolean()
  sellerProceedsPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  agentCommissionPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  listingArchived?: boolean;

  @IsOptional()
  @IsBoolean()
  ownershipRegistryUpdated?: boolean;

  @IsOptional()
  @IsBoolean()
  buyerReviewSubmitted?: boolean;

  @IsOptional()
  @IsBoolean()
  sellerReviewSubmitted?: boolean;
}

// suppress unused-import lint warnings
void Transform;
