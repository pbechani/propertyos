import {
  IsUUID,
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
  IsInt,
  IsPositive,
} from 'class-validator';
import {
  CASE_TYPES,
  CASE_STATUSES,
  CASE_PRIORITIES,
  TASK_STATUSES,
  DEADLINE_TYPES,
  DEADLINE_STATUSES,
  TRUST_ENTRY_TYPES,
  TRUST_DIRECTIONS,
  INVOICE_TYPES,
  INVOICE_STATUSES,
  INVOICE_LINE_TYPES,
  PORTAL_PARTY_ROLES,
  FEE_TYPES,
} from './conveyancing.constants';

// ─── Case ──────────────────────────────────────────────────────────────────

export class CreateCaseDto {
  @IsUUID()
  saleId!: string;

  @IsUUID()
  firmId!: string;

  @IsUUID()
  leadConveyancerId!: string;

  @IsIn(CASE_TYPES)
  caseType!: string;

  @IsOptional()
  @IsIn(CASE_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsDateString()
  targetRegistrationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateCaseDto {
  @IsOptional()
  @IsIn(CASE_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(CASE_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsUUID()
  leadConveyancerId?: string;

  @IsOptional()
  @IsDateString()
  targetRegistrationDate?: string;

  @IsOptional()
  @IsDateString()
  actualRegistrationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export class CreateTaskDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  stageNumber?: number;

  @IsOptional()
  @IsUUID()
  responsibleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  responsibleRole?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(CASE_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsBoolean()
  isBlocker?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  responsibleId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  escalationReason?: string;
}

// ─── Notes ─────────────────────────────────────────────────────────────────

export class CreateNoteDto {
  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

// ─── Deadlines ─────────────────────────────────────────────────────────────

export class CreateDeadlineDto {
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsIn(DEADLINE_TYPES)
  deadlineType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsDateString()
  dueDate!: string;
}

export class ExtendDeadlineDto {
  @IsIn(DEADLINE_STATUSES)
  status!: string;

  @IsOptional()
  @IsDateString()
  extendedDueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  extensionReason?: string;
}

// ─── Trust Ledger ──────────────────────────────────────────────────────────

export class CreateTrustEntryDto {
  @IsIn(TRUST_ENTRY_TYPES)
  entryType!: string;

  @IsString()
  @MaxLength(500)
  description!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsIn(TRUST_DIRECTIONS)
  direction!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  receivedFrom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  paidTo?: string;

  @IsDateString()
  paymentDate!: string;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;
}

// ─── Fee Calculator ────────────────────────────────────────────────────────

export class CalculateFeeDto {
  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @IsIn(FEE_TYPES)
  feeType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}

// ─── Invoice ───────────────────────────────────────────────────────────────

export class CreateInvoiceDto {
  @IsUUID()
  billedToId!: string;

  @IsIn(INVOICE_TYPES)
  invoiceType!: string;

  @IsArray()
  lineItems!: CreateLineItemDto[];

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateLineItemDto {
  @IsString()
  @MaxLength(255)
  description!: string;

  @IsIn(INVOICE_LINE_TYPES)
  lineType!: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateInvoiceStatusDto {
  @IsIn(INVOICE_STATUSES)
  status!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;
}

// ─── Documents ─────────────────────────────────────────────────────────────

export class GenerateDocumentDto {
  @IsUUID()
  templateId!: string;

  @IsString()
  @MaxLength(255)
  documentName!: string;

  fieldValues!: Record<string, unknown>;
}

export class RequestSignatureDto {
  @IsUUID()
  documentId!: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  signerIds!: string[];
}

// ─── Client Portal ─────────────────────────────────────────────────────────

export class CreatePortalAccessDto {
  @IsUUID()
  userId!: string;

  @IsIn(PORTAL_PARTY_ROLES)
  partyRole!: string;
}
