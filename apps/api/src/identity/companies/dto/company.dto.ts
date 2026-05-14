import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type CompanyCategory =
  | 'agent'
  | 'contractor'
  | 'supplier'
  | 'conveyancer'
  | 'inspector'
  | 'logistics'
  | 'developing';

export const COMPANY_CATEGORIES: CompanyCategory[] = [
  'agent',
  'contractor',
  'supplier',
  'conveyancer',
  'inspector',
  'logistics',
  'developing',
];

export type CompanyStatus =
  | 'pending_verification'
  | 'active'
  | 'suspended'
  | 'under_investigation'
  | 'deactivated';

export type CompanyVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

class AddressDto {
  @IsOptional()
  @IsString()
  line1?: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;
}

export class CreateCompanyDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsEnum(COMPANY_CATEGORIES)
  category!: CompanyCategory;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registration_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tax_number?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'brand_color must be a valid hex colour (e.g. #4A9E8E)' })
  brand_color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registration_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tax_number?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'brand_color must be a valid hex colour (e.g. #4A9E8E)' })
  brand_color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RejectCompanyDto {
  @IsString()
  reason!: string;
}

export class SuspendCompanyDto {
  @IsString()
  reason!: string;
}

export class ReinstateCompanyDto {}

export class InvestigateCompanyDto {
  @IsString()
  reason!: string;
}

export class ListCompaniesQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
