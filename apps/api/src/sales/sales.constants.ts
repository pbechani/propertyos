// ─────────────────────────────────────────────────────────────────────────────
// Sprint 04 — Sales Progression constants
// ─────────────────────────────────────────────────────────────────────────────

export const SALE_STATUSES = ['active', 'completed', 'cancelled', 'disputed'] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const STAGE_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
  'blocked',
  'skipped',
] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const DOCUMENT_STATUSES = ['pending', 'received', 'verified', 'rejected'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const GOV_STATUSES = [
  'pending',
  'submitted',
  'in_review',
  'approved',
  'rejected',
] as const;
export type GovStatus = (typeof GOV_STATUSES)[number];

export const ISSUE_TYPES = ['delay', 'missing_doc', 'dispute', 'other'] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

/** Roles that are valid participants in a sale (used by access guard). */
export const SALE_PARTICIPANT_ROLES = [
  'buyer',
  'seller',
  'agent',
  'conveyancer',
  'admin',
] as const;
export type SaleParticipantRole = (typeof SALE_PARTICIPANT_ROLES)[number];

/** Stage state-machine: maps current status → allowed next statuses. */
export const STAGE_TRANSITIONS: Record<StageStatus, readonly StageStatus[]> = {
  not_started: ['in_progress', 'skipped'],
  in_progress: ['completed', 'blocked'],
  blocked: ['in_progress'],
  completed: [],
  skipped: [],
};

/** Sale state-machine */
export const SALE_TRANSITIONS: Record<SaleStatus, readonly SaleStatus[]> = {
  active: ['completed', 'cancelled', 'disputed'],
  disputed: ['active', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Total number of stages in the default pipeline (includes 2 pre-transaction stages) */
export const TOTAL_STAGES = 16;

// ── Sprint 04 Enhanced constants ──────────────────────────────────────────────

export const OTP_STATUSES = [
  'draft',
  'pending_buyer_signature',
  'pending_seller_signature',
  'accepted',
  'counter_offered',
  'withdrawn',
  'expired',
] as const;
export type OtpStatus = (typeof OTP_STATUSES)[number];

export const BOND_APP_STATUSES = [
  'pending',
  'submitted',
  'pre_approved',
  'approved',
  'declined',
  'cancelled',
] as const;
export type BondAppStatus = (typeof BOND_APP_STATUSES)[number];

export const COMPLIANCE_CERT_TYPES = [
  'electrical',
  'plumbing',
  'gas',
  'electric_fence',
  'beetle',
  'rates_clearance',
] as const;
export type ComplianceCertType = (typeof COMPLIANCE_CERT_TYPES)[number];

export const CERT_STATUSES = ['required', 'in_progress', 'obtained', 'waived'] as const;
export type CertStatus = (typeof CERT_STATUSES)[number];

export const DEAL_ROOM_THREAD_TYPES = [
  'offer_negotiation',
  'general',
  'conveyancer_only',
  'agent_only',
  'compliance',
] as const;
export type DealRoomThreadType = (typeof DEAL_ROOM_THREAD_TYPES)[number];

export const DISBURSEMENT_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'transferred',
] as const;
export type DisbursementStatus = (typeof DISBURSEMENT_STATUSES)[number];

/** Default pagination limit */
export const DEFAULT_PAGE_LIMIT = 20;

/** Days before a missing-document reminder is issued */
export const MISSING_DOC_REMINDER_DAYS = 2;

/** Generate a human-readable sale reference  e.g. SALE-20260302-ABCD */
export function generateSaleReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SALE-${date}-${suffix}`;
}

/** Resolve the primary role of a user for sales context */
export function resolveSalesActorRole(roles: string[]): SaleParticipantRole {
  const priority: SaleParticipantRole[] = ['admin', 'conveyancer', 'agent', 'seller', 'buyer'];
  for (const r of priority) {
    if (roles.includes(r)) return r;
  }
  return 'buyer';
}
