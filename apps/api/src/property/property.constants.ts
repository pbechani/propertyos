export const PROPERTY_TYPES = ['land', 'residential', 'commercial', 'off_plan'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ['draft', 'active', 'under_offer', 'sold', 'withdrawn'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified', 'flagged'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const INQUIRY_TYPES = ['viewing', 'offer', 'question'] as const;
export type InquiryType = (typeof INQUIRY_TYPES)[number];

export const FRAUD_REPORT_TYPES = [
  'double_sale',
  'fake_title',
  'non_existent',
  'misrepresentation',
  'other',
] as const;
export type FraudReportType = (typeof FRAUD_REPORT_TYPES)[number];

export const SORT_OPTIONS = ['price_asc', 'price_desc', 'newest', 'relevance'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const DEFAULT_RADIUS_KM = 10;
export const MAX_MEDIA_PER_PROPERTY = 20;
export const MAX_MEDIA_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

export function resolvePropertyActorRole(
  roles: string[] | undefined,
  fallback: string,
): string {
  if (!roles || roles.length === 0) {
    return fallback;
  }

  if (roles.includes('admin')) {
    return 'admin';
  }

  if (roles.includes('agent')) {
    return 'agent';
  }

  return roles[0] ?? fallback;
}
