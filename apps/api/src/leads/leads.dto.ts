import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  Min,
  IsInt,
  Max,
} from 'class-validator';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const LEAD_TYPES = ['buyer', 'seller', 'renter', 'investor'] as const;
export const LEAD_TEMPERATURES = ['hot', 'warm', 'cold', 'nurture'] as const;
export const LEAD_STAGES = [
  'new',
  'contacted',
  'qualified',
  'active',
  'under_contract',
  'closed',
  'lost',
] as const;
export const TASK_TYPES = ['call', 'email', 'meeting', 'follow_up'] as const;
export const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;
export const ACTIVITY_TYPES = [
  'email',
  'call',
  'sms',
  'meeting',
  'note',
  'stage_change',
  'property-sent',
  'viewing',
  'follow-up',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Create Lead
// ─────────────────────────────────────────────────────────────────────────────

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsIn(LEAD_TYPES)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeline?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  budgetCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preferences?: string;

  @IsOptional()
  @IsIn(LEAD_TEMPERATURES)
  temperature?: string;

  @IsOptional()
  @IsIn(LEAD_STAGES)
  stage?: string;

  @IsOptional()
  @IsBoolean()
  prequalified?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dealValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUp?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Lead  (all fields optional)
// ─────────────────────────────────────────────────────────────────────────────

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsIn(LEAD_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeline?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  budgetCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preferences?: string;

  @IsOptional()
  @IsIn(LEAD_TEMPERATURES)
  temperature?: string;

  @IsOptional()
  @IsIn(LEAD_STAGES)
  stage?: string;

  @IsOptional()
  @IsBoolean()
  prequalified?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dealValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  lostReason?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// List Leads Query
// ─────────────────────────────────────────────────────────────────────────────

export class ListLeadsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsIn(LEAD_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(LEAD_TEMPERATURES)
  temperature?: string;

  @IsOptional()
  @IsIn(LEAD_STAGES)
  stage?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Activity
// ─────────────────────────────────────────────────────────────────────────────

export class CreateLeadActivityDto {
  @IsIn(ACTIVITY_TYPES)
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Task
// ─────────────────────────────────────────────────────────────────────────────

export class CreateLeadTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsIn(TASK_TYPES)
  type!: string;

  @IsIn(TASK_PRIORITIES)
  priority!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Task
// ─────────────────────────────────────────────────────────────────────────────

export class UpdateLeadTaskDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsIn(TASK_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}


// 
// Send Email to Lead
// 

export class SendLeadEmailDto {
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @IsNotEmpty()
  @IsString()
  body!: string;
}
