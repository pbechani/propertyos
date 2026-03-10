import { IsString, IsNumber, IsIn, Min, Max, IsUUID, IsOptional } from 'class-validator';

// ─────────────────────────────────────────────────────────────────────────────
// DTOs for MindsDB prediction queries
// ─────────────────────────────────────────────────────────────────────────────

export const PROPERTY_TYPES = [
  'house',
  'apartment',
  'townhouse',
  'land',
  'commercial',
  'industrial',
] as const;

export const LISTING_TYPES = ['sale', 'rent', 'off_plan'] as const;

export class PropertyValuationQueryDto {
  @IsIn(PROPERTY_TYPES)
  propertyType!: string;

  @IsNumber()
  @Min(0)
  @Max(50)
  bedrooms!: number;

  @IsNumber()
  @Min(0)
  @Max(30)
  bathrooms!: number;

  @IsNumber()
  @Min(1)
  floorAreaSqm!: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsIn(LISTING_TYPES)
  @IsOptional()
  listingType?: string;
}

export class MaterialForecastQueryDto {
  @IsUUID()
  materialId!: string;

  @IsString()
  region!: string;
}

export interface PropertyValuationResult {
  predictedPrice: number;
  confidence: number;
}

export interface ContractorRiskResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface MaterialForecastRow {
  recordedAt: string;
  unitPrice: number;
}

export interface ProjectDelayResult {
  delayed: boolean;
  confidence: number;
}
