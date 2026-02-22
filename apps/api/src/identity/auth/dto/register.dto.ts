import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  IdentityRole,
  SELF_REGISTRATION_ROLES,
} from '../../identity.constants';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  role?: IdentityRole;

  isValidRole(): boolean {
    if (!this.role) {
      return true;
    }

    // admin cannot be self-assigned at registration — must be granted by an existing admin
    return (SELF_REGISTRATION_ROLES as readonly string[]).includes(this.role);
  }
}
