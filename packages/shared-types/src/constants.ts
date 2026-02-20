// Application-wide constants

// ==============================================
// API Constants
// ==============================================

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// ==============================================
// Validation Constants
// ==============================================

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==============================================
// File Upload Constants
// ==============================================

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// ==============================================
// Currency Constants
// ==============================================

export const CURRENCY_SYMBOLS = {
  USD: '$',
  ZAR: 'R',
  KES: 'KSh',
  NGN: '₦',
  GHS: '₵',
  EUR: '€',
  GBP: '£',
} as const;

export const CURRENCY_DECIMAL_PLACES = {
  USD: 2,
  ZAR: 2,
  KES: 2,
  NGN: 2,
  GHS: 2,
  EUR: 2,
  GBP: 2,
} as const;

// ==============================================
// Date/Time Constants
// ==============================================

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIME_FORMAT = 'HH:mm:ss';

export const TIMEZONE_UTC = 'UTC';

// ==============================================
// Cache Constants
// ==============================================

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;

// ==============================================
// HTTP Status Codes
// ==============================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ==============================================
// Rate Limiting Constants
// ==============================================

export const RATE_LIMIT = {
  DEFAULT: 100, // requests per minute
  AUTH: 10, // requests per minute for auth endpoints
  UPLOAD: 20, // requests per minute for upload endpoints
  API: 1000, // requests per hour for API
} as const;

// ==============================================
// Property Constants
// ==============================================

export const PROPERTY_SEARCH_RADIUS = {
  MIN: 1, // km
  DEFAULT: 10, // km
  MAX: 100, // km
} as const;

// ==============================================
// Construction Stage Names
// ==============================================

export const CONSTRUCTION_STAGES = [
  'Site Preparation',
  'Foundation',
  'Substructure',
  'Superstructure',
  'Roofing',
  'External Works',
  'Internal Works',
  'Plumbing',
  'Electrical',
  'Finishing',
  'Handover',
] as const;

// ==============================================
// Property Purchase Stages
// ==============================================

export const PURCHASE_STAGES = [
  'Property Search',
  'Offer Submission',
  'Offer Accepted',
  'Sale Agreement',
  'Deposit Payment',
  'Title Deed Search',
  'Mortgage Approval',
  'Property Inspection',
  'Compliance Certificates',
  'Transfer Documentation',
  'Deeds Office Registration',
  'Transfer Duty Payment',
  'Final Payment',
  'Post-Purchase',
] as const;

// ==============================================
// Notification Channels
// ==============================================

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
  WEBHOOK: 'webhook',
} as const;

// ==============================================
// Error Messages
// ==============================================

export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'An internal error occurred',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  DUPLICATE_ENTRY: 'This entry already exists',
} as const;

// ==============================================
// Success Messages
// ==============================================

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  VERIFICATION_SENT: 'Verification email sent',
  PASSWORD_RESET_SENT: 'Password reset link sent',
} as const;

// ==============================================
// Regex Patterns
// ==============================================

export const REGEX_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  POSTAL_CODE: /^[A-Z0-9]{3,10}$/i,
} as const;
