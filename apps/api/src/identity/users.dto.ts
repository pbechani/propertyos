import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  yearsExperience?: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(['active', 'suspended', 'under_investigation', 'deleted'])
  status!: 'active' | 'suspended' | 'under_investigation' | 'deleted';

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignRoleDto {
  @IsString()
  role!: string;
}
