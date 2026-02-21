import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}

export class UpdateUserStatusDto {
  @IsString()
  status!: 'active' | 'suspended' | 'deleted';
}

export class AssignRoleDto {
  @IsString()
  role!: string;
}
