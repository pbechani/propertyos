// Common types shared across all PRIBEC applications

// ==============================================
// API Response Types
// ==============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    timestamp?: string;
    requestId?: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ==============================================
// Health Check Types
// ==============================================

export interface HealthCheck {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: Record<
    string,
    {
      status: 'ok' | 'error';
      message?: string;
    }
  >;
}

// ==============================================
// Base Entity Types
// ==============================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditInfo {
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface SoftDeletable {
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

// ==============================================
// Financial Types
// ==============================================

export type CurrencyCode = 'USD' | 'ZAR' | 'KES' | 'NGN' | 'GHS' | 'EUR' | 'GBP';

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface PaymentMethod {
  type: 'bank_transfer' | 'card' | 'wallet' | 'cash';
  details?: Record<string, unknown>;
}

// ==============================================
// User & Authentication Types
// ==============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  AGENT = 'AGENT',
  CONTRACTOR = 'CONTRACTOR',
  SUPPLIER = 'SUPPLIER',
  INSPECTOR = 'INSPECTOR',
  CONVEYANCER = 'CONVEYANCER',
  TRUCK_OPERATOR = 'TRUCK_OPERATOR',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface UserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
}

// ==============================================
// Address & Location Types
// ==============================================

export interface Address {
  street?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

// ==============================================
// File & Upload Types
// ==============================================

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  exif?: Record<string, unknown>;
}

// ==============================================
// Property Types
// ==============================================

export enum PropertyType {
  LAND = 'LAND',
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  OFF_PLAN = 'OFF_PLAN',
}

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  WITHDRAWN = 'WITHDRAWN',
}

// ==============================================
// Project & Construction Types
// ==============================================

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ==============================================
// Rating & Review Types
// ==============================================

export interface Rating {
  overall: number;
  quality?: number;
  communication?: number;
  timeliness?: number;
  professionalism?: number;
}

export interface Review {
  id: string;
  rating: Rating;
  comment?: string;
  reviewedBy: string;
  reviewedAt: Date;
  response?: {
    comment: string;
    respondedAt: Date;
  };
}

// ==============================================
// Notification Types
// ==============================================

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// ==============================================
// Search & Filter Types
// ==============================================

export interface SearchParams {
  query?: string;
  filters?: Record<string, unknown>;
  pagination?: PaginationParams;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: CurrencyCode;
}

// ==============================================
// Error Types
// ==============================================

export enum ErrorCode {
  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Business Logic
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // External Services
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  stack?: string;
}

// ==============================================
// WebSocket Event Types
// ==============================================

export interface WebSocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ==============================================
// Configuration Types
// ==============================================

export interface AppConfig {
  environment: 'development' | 'staging' | 'production' | 'test';
  apiUrl: string;
  wsUrl?: string;
  features: {
    [key: string]: boolean;
  };
}

// ==============================================
// Utility Types
// ==============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ==============================================
// Export all types
// ==============================================

export * from './constants';
