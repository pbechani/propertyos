import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PermissionDto {
  @IsString()
  resource!: string;

  @IsString()
  action!: string;
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  role!: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions?: PermissionDto[];
}

export class UpdateMemberPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions!: PermissionDto[];
}

export class AssignOrphanedTaskDto {
  @IsUUID()
  assignee_id!: string;
}
