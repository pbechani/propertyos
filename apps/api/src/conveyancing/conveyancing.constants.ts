export const CASE_TYPES = ['transfer', 'bond_registration', 'bond_cancellation', 'sectional_title', 'development'] as const;
export type CaseType = typeof CASE_TYPES[number];

export const CASE_STATUSES = ['open', 'on_hold', 'lodged', 'registered', 'closed', 'cancelled'] as const;
export type CaseStatus = typeof CASE_STATUSES[number];

export const CASE_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type CasePriority = typeof CASE_PRIORITIES[number];

export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'waived', 'escalated'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const DEADLINE_TYPES = [
  'transfer_duty',
  'rates_clearance',
  'compliance_cert',
  'deeds_lodgement',
  'bond_registration',
  'occupation',
  'sectional_title_scheme',
  'other',
] as const;
export type DeadlineType = typeof DEADLINE_TYPES[number];

export const DEADLINE_STATUSES = ['active', 'met', 'extended', 'missed'] as const;
export type DeadlineStatus = typeof DEADLINE_STATUSES[number];

export const TRUST_ENTRY_TYPES = [
  'deposit',         // buyer deposit
  'transfer_costs',  // conveyancing fees received
  'transfer_duty_paid',
  'rates_clearance_paid',
  'bond_proceeds',
  'disbursement',    // payment to seller / third-party
  'refund',
] as const;
export type TrustEntryType = typeof TRUST_ENTRY_TYPES[number];

export const TRUST_DIRECTIONS = ['credit', 'debit'] as const;
export type TrustDirection = typeof TRUST_DIRECTIONS[number];

export const INVOICE_TYPES = ['attorney_fees', 'disbursements', 'transfer_duty', 'combined'] as const;
export type InvoiceType = typeof INVOICE_TYPES[number];

export const INVOICE_STATUSES = ['draft', 'sent', 'partial', 'paid', 'cancelled'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export const INVOICE_LINE_TYPES = [
  'professional_fee',
  'transfer_duty',
  'deeds_office_fee',
  'rates_clearance',
  'compliance_cert',
  'bank_charges',
  'vat',
  'other',
] as const;
export type InvoiceLineType = typeof INVOICE_LINE_TYPES[number];

export const DOCUMENT_STATUSES = ['draft', 'sent_for_signature', 'fully_signed', 'rejected', 'superseded'] as const;
export type DocumentStatus = typeof DOCUMENT_STATUSES[number];

export const PORTAL_PARTY_ROLES = ['buyer', 'seller', 'mortgage_bank'] as const;
export type PortalPartyRole = typeof PORTAL_PARTY_ROLES[number];

export const FEE_TYPES = ['transfer', 'bond_registration', 'bond_cancellation'] as const;
export type FeeType = typeof FEE_TYPES[number];

export const SUPPORTED_COUNTRIES = ['ZA'] as const;
export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

export const PORTAL_TOKEN_TTL_DAYS = 90;
export const PORTAL_TOKEN_BYTES = 32;
