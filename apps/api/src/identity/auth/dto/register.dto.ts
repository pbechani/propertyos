import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IdentityRole, IDENTITY_ROLES } from '../../identity.constants';

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

    return (IDENTITY_ROLES as readonly string[]).includes(this.role);
  }
}
