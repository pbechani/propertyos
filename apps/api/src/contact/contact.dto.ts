import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsEmpty,
} from 'class-validator';

export class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\p{L}\s'\-]+$/u, { message: 'Name contains invalid characters' })
  name!: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsIn(['buying', 'construction', 'suppliers', 'logistics', 'invest', 'other'], {
    message: 'Please select a valid subject',
  })
  subject!: string;

  @IsString()
  @MinLength(20, { message: 'Message must be at least 20 characters' })
  @MaxLength(2000, { message: 'Message must be under 2000 characters' })
  message!: string;

  /**
   * Honeypot field — must be absent or empty.
   * Bots that auto-fill all fields will populate this and be silently rejected.
   */
  @IsOptional()
  @IsEmpty({ message: 'Unexpected value' })
  website?: string;
}
