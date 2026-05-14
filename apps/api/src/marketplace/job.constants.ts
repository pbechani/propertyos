// Sprint 07-B: Job Execution Constants

export const JOB_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  QUOTING: 'QUOTING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_QUOTE_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
  EXPIRED: 'EXPIRED',
} as const;
export type JobQuoteStatus =
  (typeof JOB_QUOTE_STATUS)[keyof typeof JOB_QUOTE_STATUS];

export const JOB_MILESTONE_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
} as const;
export type JobMilestoneStatus =
  (typeof JOB_MILESTONE_STATUS)[keyof typeof JOB_MILESTONE_STATUS];

export const CONTRACTOR_AVAILABILITY = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  UNAVAILABLE: 'unavailable',
} as const;
export type ContractorAvailability =
  (typeof CONTRACTOR_AVAILABILITY)[keyof typeof CONTRACTOR_AVAILABILITY];

// Job categories matching mobile UI
export const JOB_CATEGORIES = [
  'plumbing',
  'electrical',
  'carpentry',
  'painting',
  'roofing',
  'tiling',
  'landscaping',
  'cleaning',
  'hvac',
  'masonry',
  'general',
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

// Contractor matching weights
export const MATCHING_WEIGHTS = {
  REPUTATION: 0.3,
  DISTANCE: 0.25,
  PRICE: 0.15,
  AVAILABILITY: 0.2,
  RESPONSE_RATE: 0.1,
} as const;

export const JOB_AUDIT_ACTIONS = {
  JOB_CREATED: 'job.created',
  JOB_PUBLISHED: 'job.published',
  JOB_QUOTE_SUBMITTED: 'job_quote.submitted',
  JOB_QUOTE_ACCEPTED: 'job_quote.accepted',
  JOB_QUOTE_REJECTED: 'job_quote.rejected',
  JOB_ASSIGNED: 'job.assigned',
  JOB_STARTED: 'job.started',
  JOB_MILESTONE_COMPLETED: 'job_milestone.completed',
  JOB_MILESTONE_APPROVED: 'job_milestone.approved',
  JOB_COMPLETED: 'job.completed',
  JOB_CANCELLED: 'job.cancelled',
  JOB_MESSAGE_SENT: 'job_message.sent',
} as const;

// Haversine earth radius in km
export const EARTH_RADIUS_KM = 6371;
