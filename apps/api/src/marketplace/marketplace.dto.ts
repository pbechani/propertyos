import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  DELIVERY_CONDITION,
  PRICE_TIER,
  RATING_ENTITY_TYPE,
  RFQ_TYPE,
} from './marketplace.constants';

// ─────────────────────────────────────────────────────────────────────────────
// Contractor DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateContractorProfileDto {
  @ValidateIf((o: CreateContractorProfileDto) => !o.companyId)
  @IsUUID()
  userId?: string;

  @ValidateIf((o: CreateContractorProfileDto) => !o.userId)
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxProjectValue?: number;

  @IsOptional()
  @IsArray()
  serviceAreas?: string[];

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsString()
  insuranceCertUrl?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class UpdateContractorProfileDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsArray()
  specializations?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxProjectValue?: number;

  @IsOptional()
  @IsArray()
  serviceAreas?: string[];

  @IsOptional()
  @IsArray()
  certifications?: string[];

  @IsOptional()
  @IsString()
  insuranceCertUrl?: string;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class AddPortfolioItemDto {
  @IsNotEmpty()
  @IsString()
  projectTitle!: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  projectValue?: number;

  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
}

export class ContractorListQueryDto {
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  verificationStatus?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// Supplier DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateSupplierProfileDto {
  @ValidateIf((o: CreateSupplierProfileDto) => !o.companyId)
  @IsUUID()
  userId?: string;

  @ValidateIf((o: CreateSupplierProfileDto) => !o.userId)
  @IsUUID()
  companyId?: string;

  @IsNotEmpty()
  @IsString()
  businessName!: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsArray()
  deliveryAreas?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  minimumOrderValue?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;
}

export class UpdateSupplierProfileDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsArray()
  deliveryAreas?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  minimumOrderValue?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;
}

export class CreateSupplierProductDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsNotEmpty()
  @IsString()
  productName!: string;

  @IsNotEmpty()
  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  unit!: string;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  @IsNotEmpty()
  @IsString()
  currency!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  minOrderQty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @IsOptional()
  specifications?: Record<string, unknown>;
}

export class UpdateSupplierProductDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
}

export class ProductListQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// RFQ DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateRfqDto {
  @IsEnum(Object.values(RFQ_TYPE))
  rfqType!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scopeOfWork?: string;

  @IsOptional()
  @IsArray()
  requiredSkills?: string[];

  @IsOptional()
  siteLocation?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budgetEstimate?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNotEmpty()
  @IsDateString()
  deadlineForQuotes!: string;
}

export class SubmitQuoteDto {
  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @IsNotEmpty()
  @IsString()
  currency!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  laborAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  materialsAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadAmount?: number;

  @IsOptional()
  @IsArray()
  lineItems?: unknown[];

  @IsOptional()
  @IsInt()
  @IsPositive()
  timelineDays?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  validityDays?: number;

  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  documents?: string[];
}

export class RfqListQueryDto {
  @IsOptional()
  @IsString()
  rfqType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// Order DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateOrderDto {
  @IsUUID()
  supplierId!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @IsNotEmpty()
  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @IsOptional()
  @IsDateString()
  requestedDeliveryDate?: string;
}

export class ShipOrderDto {
  @IsOptional()
  @IsString()
  trackingReference?: string;

  @IsOptional()
  @IsString()
  carrierName?: string;
}

export class ConfirmDeliveryDto {
  @IsOptional()
  @IsString()
  proofPhotoUrl?: string;

  @IsOptional()
  @IsNumber()
  proofPhotoLat?: number;

  @IsOptional()
  @IsNumber()
  proofPhotoLng?: number;

  @IsOptional()
  @IsEnum(Object.values(DELIVERY_CONDITION))
  condition?: string;

  @IsOptional()
  @IsString()
  damageNotes?: string;

  @IsOptional()
  @IsString()
  recipientSignatureUrl?: string;
}

export class OrderListQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rating DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class CreateRatingDto {
  @IsUUID()
  ratedEntityId!: string;

  @IsEnum(Object.values(RATING_ENTITY_TYPE))
  entityType!: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  overallScore!: number;

  @IsOptional()
  dimensionScores?: Record<string, number>;

  @IsOptional()
  @IsString()
  reviewText?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Market Intelligence DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class MaterialPricesQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(Object.values(PRICE_TIER))
  priceTier?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PriceTrendQueryDto {
  @IsNotEmpty()
  @IsString()
  materialName!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  days?: number = 30;
}
