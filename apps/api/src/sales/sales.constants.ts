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

/** Total number of stages in the default pipeline */
export const TOTAL_STAGES = 14;

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
