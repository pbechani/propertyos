import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitBuyerOfferDto {
  @IsString() @IsNotEmpty() buyerFirstName!: string;
  @IsString() @IsNotEmpty() buyerLastName!: string;
  @IsString() @IsNotEmpty() buyerIdNumber!: string;
  @IsString() @IsNotEmpty() buyerNationality!: string;
  @IsString() @IsNotEmpty() buyerEmail!: string;
  @IsString() @IsNotEmpty() buyerPhone!: string;
  @IsOptional() @IsString() buyerWhatsapp?: string;
  @IsOptional() @IsString() buyerPreferredContact?: string;
  @IsOptional() @IsString() buyerAddress?: string;

  @IsIn(['individual', 'company', 'trust', 'joint']) buyingEntity!: string;
  @IsOptional() @IsBoolean() agentRepresented?: boolean;
  @IsOptional() @IsString() agentName?: string;

  @IsIn(['pre_approved', 'pre_qualified', 'cash', 'not_applied']) preQualStatus!: string;
  @IsOptional() @IsString() preQualBank?: string;
  @IsOptional() @IsString() preQualReference?: string;

  @Type(() => Number) @IsNumber() @Min(1) amount!: number;
  @IsOptional() @IsString() currency?: string;
  @Type(() => Number) @IsNumber() @Min(0) depositAmount!: number;
  @Type(() => Number) @IsNumber() @Min(1) depositDueDays!: number;
  @IsOptional() @IsString() depositHeldBy?: string;

  @IsIn(['cash', 'bond', 'part_cash_bond', 'subject_to_bond']) financing!: string;
  @IsOptional() @Type(() => Number) @IsNumber() bondAmount?: number;
  @IsOptional() @IsString() bondLender?: string;
  @IsOptional() @IsString() bondDeadline?: string;

  @IsOptional() @IsBoolean() conditionBuildingInspection?: boolean;
  @IsOptional() @IsBoolean() conditionBondApproval?: boolean;
  @IsOptional() @IsBoolean() conditionSubjectToSale?: boolean;
  @IsOptional() @IsBoolean() conditionVacantOccupation?: boolean;
  @IsOptional() @IsBoolean() conditionElectricalCoc?: boolean;
  @IsOptional() @IsString({ each: true }) inclusions?: string[];
  @IsOptional() @IsString() customConditions?: string;

  @IsOptional() @IsBoolean() escalationEnabled?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() escalationIncrement?: number;
  @IsOptional() @Type(() => Number) @IsNumber() escalationCap?: number;

  @IsString() @IsNotEmpty() expiresAt!: string;
  @IsOptional() @IsString() preferredOccupationDate?: string;
  @IsOptional() @IsString() preferredTransferDate?: string;
  @IsOptional() @IsString() messageToSeller?: string;
}

export class RespondToCounterDto {
  @IsIn(['accept', 'decline', 'counter'])
  action!: 'accept' | 'decline' | 'counter';

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  counterAmount?: number;

  @IsOptional() @IsString()
  counterNotes?: string;

  @IsOptional() @IsString()
  counterExpiresAt?: string;
}
