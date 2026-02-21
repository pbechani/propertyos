import { IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  idDocumentType!: 'national_id' | 'passport' | 'drivers_license';
}

export class ReviewKycDto {
  @IsOptional()
  @IsString()
  reviewerNotes?: string;
}
