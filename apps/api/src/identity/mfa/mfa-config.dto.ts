import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class VerifyTotpDto {
  @IsString()
  @Length(6, 8)
  code!: string;
}

export class AddFido2CredentialDto {
  @IsString()
  credentialId!: string;

  @IsString()
  publicKey!: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class UpdateMfaChannelsDto {
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;
}
