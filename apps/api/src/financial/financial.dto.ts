import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PAYMENT_METHOD, SUPPORTED_CURRENCIES } from './financial.constants';

// ─── Deposit / Payment ────────────────────────────────────────────────────────

export class InitiateDepositDto {
  /** Provide either escrowAccountId or saleId — saleId auto-resolves the escrow account. */
  @IsUUID()
  @IsOptional()
  escrowAccountId?: string;

  @IsUUID()
  @IsOptional()
  saleId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsEnum(SUPPORTED_CURRENCIES)
  currency!: string;

  /** Accepts gateway names (stripe, flutterwave, bank_transfer) as well as PAYMENT_METHOD enum values. */
  @IsEnum(Object.values(PAYMENT_METHOD))
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  idempotencyKey?: string;
}

export class ConfirmDepositDto {
  @IsUUID()
  @IsNotEmpty()
  paymentRequestId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  gatewayReference?: string;

  @IsString()
  @IsOptional()
  gatewayStatus?: string;
}

// ─── Escrow Release ───────────────────────────────────────────────────────────

export class RequestEscrowReleaseDto {
  @IsUUID()
  @IsNotEmpty()
  escrowAccountId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  releaseAmount!: number;

  @IsEnum(SUPPORTED_CURRENCIES)
  currency!: string;

  /** Optional — defaults to platform incoming account when omitted. */
  @IsUUID()
  @IsOptional()
  destinationAccountId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  mfaToken?: string;
}

export class ApproveEscrowReleaseDto {
  @IsUUID()
  @IsNotEmpty()
  releaseId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  mfaToken?: string;
}

export class RejectEscrowReleaseDto {
  @IsUUID()
  @IsNotEmpty()
  releaseId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  rejectionReason!: string;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export class CreateEscrowAccountDto {
  @IsUUID()
  @IsNotEmpty()
  saleId!: string;

  @IsEnum(SUPPORTED_CURRENCIES)
  currency!: string;
}

// ─── Exchange Rate ────────────────────────────────────────────────────────────

export class ConvertCurrencyDto {
  @IsNumber({ maxDecimalPlaces: 8 })
  @IsPositive()
  amount!: number;

  @IsString()
  @Length(3, 3)
  fromCurrency!: string;

  @IsString()
  @Length(3, 3)
  toCurrency!: string;
}

// ─── Commission ───────────────────────────────────────────────────────────────

export class CalculateCommissionDto {
  @IsUUID()
  @IsNotEmpty()
  saleId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  saleAmount!: number;

  @IsEnum(SUPPORTED_CURRENCIES)
  currency!: string;

  @IsUUID()
  @IsOptional()
  agentId?: string;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export class LedgerQueryDto {
  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
