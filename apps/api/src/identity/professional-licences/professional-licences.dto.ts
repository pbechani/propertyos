import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const LICENCE_TYPES = [
  'eaab_agent',
  'conveyancer',
  'inspector',
  'valuer',
  'quantity_surveyor',
  'mortgage_broker',
] as const;

export type LicenceType = (typeof LICENCE_TYPES)[number];

export class CreateProfessionalLicenceDto {
  @IsIn(LICENCE_TYPES)
  licenceType!: LicenceType;

  @IsString()
  @MaxLength(100)
  licenceNumber!: string;

  @IsString()
  @MaxLength(255)
  issuingBody!: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  autoCheckUrl?: string;
}

export class VerifyLicenceDto {
  @IsIn(['verified', 'pending_review', 'revoked'])
  status!: 'verified' | 'pending_review' | 'revoked';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  notes?: string;
}
