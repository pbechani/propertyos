'use client';

import { clearAuthSession, getRefreshToken, saveAuthSession } from './auth-session';

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  authToken?: string | null;
};

const inFlightGetRequests = new Map<string, Promise<unknown>>();
const getResponseCache = new Map<string, { data: unknown; expiresAt: number }>();
const getRateLimitCooldowns = new Map<string, number>();
const DEFAULT_GET_CACHE_TTL_MS = 15_000;
const RATE_LIMIT_COOLDOWN_MS = 3_000;
let inFlightTokenRefresh: Promise<string | null> | null = null;

function canAttemptTokenRefresh(path: string, authToken: string | null | undefined): boolean {
  if (!authToken) {
    return false;
  }

  return !path.startsWith('/auth/login') && !path.startsWith('/auth/register') && !path.startsWith('/auth/refresh');
}

async function refreshAccessToken(): Promise<string | null> {
  if (inFlightTokenRefresh) {
    return inFlightTokenRefresh;
  }

  inFlightTokenRefresh = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthSession();
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    const data = (await response.json()) as AuthResponse;
    saveAuthSession(data);
    return data.tokens.accessToken;
  })().finally(() => {
    inFlightTokenRefresh = null;
  });

  return inFlightTokenRefresh;
}

function getCacheTtlMs(path: string): number {
  if (path.startsWith('/properties')) {
    return 20_000;
  }

  return DEFAULT_GET_CACHE_TTL_MS;
}

async function parseApiError(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;

  try {
    const data = (await response.json()) as
      | { message?: string | string[] }
      | undefined;
    if (!data?.message) {
      return fallback;
    }

    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }

    return data.message;
  } catch {
    return fallback;
  }
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { authToken, headers, ...rest } = options;

  const method = (rest.method ?? 'GET').toUpperCase();
  const requestUrl = `${API_BASE_URL}${path}`;
  const dedupeKey =
    method === 'GET' ? `${requestUrl}::${authToken ?? ''}` : null;
  const now = Date.now();

  if (dedupeKey) {
    const cooldownUntil = getRateLimitCooldowns.get(dedupeKey) ?? 0;
    if (cooldownUntil > now) {
      const cached = getResponseCache.get(dedupeKey);
      if (cached) {
        return cached.data as T;
      }

      throw new ApiError(
        `Too many requests. Please try again in ${Math.ceil((cooldownUntil - now) / 1000)}s.`,
        429,
      );
    }

    const cached = getResponseCache.get(dedupeKey);
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }
  }

  if (dedupeKey && inFlightGetRequests.has(dedupeKey)) {
    return inFlightGetRequests.get(dedupeKey) as Promise<T>;
  }

  const executeRequest = async (): Promise<T> => {
    const send = (token: string | null | undefined) =>
      fetch(requestUrl, {
        ...rest,
        headers: {
          ...(headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

    let response = await send(authToken);

    if (response.status === 401 && canAttemptTokenRefresh(path, authToken)) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        response = await send(refreshedToken);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Session expired. Please sign in again.', 401);
      }

      if (response.status === 429 && dedupeKey) {
        getRateLimitCooldowns.set(dedupeKey, Date.now() + RATE_LIMIT_COOLDOWN_MS);

        const cached = getResponseCache.get(dedupeKey);
        if (cached) {
          return cached.data as T;
        }
      }

      throw new ApiError(await parseApiError(response), response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await response.json()) as T;

    if (dedupeKey) {
      getResponseCache.set(dedupeKey, {
        data,
        expiresAt: Date.now() + getCacheTtlMs(path),
      });
      getRateLimitCooldowns.delete(dedupeKey);
    }

    return data;
  };

  if (!dedupeKey) {
    return executeRequest();
  }

  const inFlight = executeRequest().finally(() => {
    inFlightGetRequests.delete(dedupeKey);
  });

  inFlightGetRequests.set(dedupeKey, inFlight);
  return inFlight as Promise<T>;
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export type AuthUser = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  emailVerifiedAt: string | null;
  phoneVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  companyName?: string | null;
  businessType?: string | null;
  licenseNumber?: string | null;
  yearsExperience?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  roles?: string[];
  role?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type KycStatusResponse = {
  id?: string;
  status: string;
  userId?: string;
  idDocumentType?: string;
  idDocumentUrl?: string | null;
  addressProofUrl?: string | null;
  businessRegistrationUrl?: string | null;
  selfieUrl?: string | null;
  reviewerNotes?: string | null;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string;
  createdAt?: string;
};

export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  forgotPassword: (payload: { email: string }) =>
    apiRequest<{ success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    apiRequest<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  verifyEmail: (payload: { token: string }) =>
    apiRequest<{ success: boolean }>('/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  resendVerificationEmail: (authToken: string) =>
    apiRequest<{ success: boolean }>('/auth/resend-verification-email', {
      method: 'POST',
      authToken,
    }),

  oauthLogin: (
    provider: 'google' | 'apple' | 'facebook',
    payload: {
      providerToken: string;
      email: string;
      firstName?: string;
      lastName?: string;
    },
  ) =>
    apiRequest<AuthResponse>(`/auth/oauth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

export const usersApi = {
  me: (authToken: string) =>
    apiRequest<AuthUser>('/users/me', {
      method: 'GET',
      authToken,
    }),

  updateMe: (
    authToken: string,
    payload: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
      companyName?: string;
      businessType?: string;
      licenseNumber?: string;
      yearsExperience?: string;
    },
  ) =>
    apiRequest<AuthUser>('/users/me', {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  uploadAvatar: (authToken: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiRequest<AuthUser>('/users/me/avatar', {
      method: 'POST',
      authToken,
      body: formData,
    });
  },
};

export const adminUsersApi = {
  getUser: (authToken: string, id: string) =>
    apiRequest<AuthUser>(`/users/${id}`, {
      method: 'GET',
      authToken,
    }),

  updateUserStatus: (
    authToken: string,
    id: string,
    status: 'active' | 'suspended' | 'deleted',
  ) =>
    apiRequest<AuthUser>(`/users/${id}/status`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
};

export const kycApi = {
  getStatus: (authToken: string) =>
    apiRequest<KycStatusResponse>('/kyc/status', {
      method: 'GET',
      authToken,
    }),

  submit: (authToken: string, payload: FormData) =>
    apiRequest<KycStatusResponse>('/kyc/submit', {
      method: 'POST',
      authToken,
      body: payload,
    }),
};

// ─── Extended Auth ────────────────────────────────────────────────────────────

export type RefreshResponse = AuthResponse;

export const authExtApi = {
  logout: (authToken: string, refreshToken: string) =>
    apiRequest<void>('/auth/logout', {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }),

  refresh: (refreshToken: string) =>
    apiRequest<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }),

  changePassword: (
    authToken: string,
    payload: { currentPassword: string; newPassword: string },
  ) =>
    apiRequest<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

// ─── KYC Record (full, returned by admin endpoints) ──────────────────────────

export type KycRecord = {
  id: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'not_submitted';
  idDocumentType?: string | null;
  idDocumentUrl?: string | null;
  addressProofUrl?: string | null;
  businessRegistrationUrl?: string | null;
  selfieUrl?: string | null;
  reviewerNotes?: string | null;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // user fields joined by listPending
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role?: string | null;
  };
};

export type KycDocumentType =
  | 'id_document'
  | 'address_proof'
  | 'business_registration'
  | 'selfie';

export type KycDownloadUrlResponse = {
  downloadUrl: string;
  expiresInSeconds: number;
};

export const adminKycApi = {
  listPending: (authToken: string, limit = 20, offset = 0) =>
    apiRequest<KycRecord[]>(`/admin/kyc/pending?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      authToken,
    }),

  getById: (authToken: string, id: string) =>
    apiRequest<KycRecord>(`/admin/kyc/${id}`, {
      method: 'GET',
      authToken,
    }),

  startReview: (authToken: string, id: string) =>
    apiRequest<KycRecord>(`/admin/kyc/${id}/start-review`, {
      method: 'POST',
      authToken,
    }),

  approve: (authToken: string, id: string, reviewerNotes?: string) =>
    apiRequest<KycRecord>(`/admin/kyc/${id}/approve`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerNotes }),
    }),

  reject: (authToken: string, id: string, reviewerNotes?: string) =>
    apiRequest<KycRecord>(`/admin/kyc/${id}/reject`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerNotes }),
    }),

  getDocumentDownloadUrl: (
    authToken: string,
    id: string,
    documentType: KycDocumentType,
  ) =>
    apiRequest<KycDownloadUrlResponse>(
      `/kyc/${id}/documents/${documentType}/download-url`,
      {
        method: 'GET',
        authToken,
      },
    ),
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export type AuditLogEntry = {
  id: string;
  actorId: string;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  previousStatus?: string | null;
  payload?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

type AuditLogApiRow = {
  id: string;
  actor_id?: string;
  actorId?: string;
  actor_role?: string | null;
  actorRole?: string | null;
  action: string;
  resource_type?: string;
  resourceType?: string;
  resource_id?: string | null;
  resourceId?: string | null;
  previous_status?: string | null;
  previousStatus?: string | null;
  payload?: Record<string, unknown> | null;
  ip_address?: string | null;
  ipAddress?: string | null;
  user_agent?: string | null;
  userAgent?: string | null;
  created_at?: string;
  createdAt?: string;
};

function normalizeAuditLogEntry(row: AuditLogApiRow): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actorId ?? row.actor_id ?? '',
    actorRole: row.actorRole ?? row.actor_role ?? null,
    action: row.action,
    resourceType: row.resourceType ?? row.resource_type ?? '',
    resourceId: row.resourceId ?? row.resource_id ?? null,
    previousStatus: row.previousStatus ?? row.previous_status ?? null,
    payload: row.payload ?? null,
    ipAddress: row.ipAddress ?? row.ip_address ?? null,
    userAgent: row.userAgent ?? row.user_agent ?? null,
    createdAt: row.createdAt ?? row.created_at ?? '',
  };
}

export const auditApi = {
  getMyLogs: async (authToken: string, limit = 20, offset = 0) => {
    const rows = await apiRequest<AuditLogApiRow[]>(`/audit-logs/me?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      authToken,
    });

    return rows.map(normalizeAuditLogEntry);
  },

  getAdminLogs: (
    authToken: string,
    params: {
      actorId?: string;
      resourceType?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.actorId) qs.set('actor_id', params.actorId);
    if (params.resourceType) qs.set('resource_type', params.resourceType);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return apiRequest<AuditLogApiRow[]>(`/admin/audit-logs${query ? `?${query}` : ''}`, {
      method: 'GET',
      authToken,
    }).then((rows) => rows.map(normalizeAuditLogEntry));
  },
};

// ─── Property Marketplace (Sprint 03) ───────────────────────────────────────

export type PropertyVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'flagged';

export type PropertyStatus =
  | 'draft'
  | 'active'
  | 'under_offer'
  | 'sold'
  | 'withdrawn';

export type FeaturedAgentCard = {
  id: string;
  fullName: string;
  location: string;
  tier: 'gold' | 'silver' | 'bronze';
  deals: number;
};

export type PropertyListing = {
  id: string;
  title: string;
  description?: string | null;
  property_type: 'land' | 'residential' | 'commercial' | 'off_plan';
  status: PropertyStatus;
  agent_id?: string | null;
  price: string;
  currency: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  area_sqm?: string | null;
  features?: string[] | null;
  verification_status: PropertyVerificationStatus;
  created_at: string;
  updated_at: string;
  location?: {
    city?: string | null;
    region?: string | null;
    country: string;
    latitude?: string | null;
    longitude?: string | null;
  } | null;
  media?: Array<{
    id: string;
    media_type: 'image' | 'video' | string;
    url: string;
    thumbnail_url?: string | null;
    is_primary: boolean;
  }>;
};

export type PropertySearchResponse = {
  data: PropertyListing[];
  total: number;
  page: number;
  limit: number;
};

export type AgentProfileResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  totalListings: number;
  activeListings: number;
  verifiedListings: number;
  primaryCity: string;
  listings: Array<{
    id: string;
    title: string;
    location: string;
    price: string;
    currency: string;
    bedrooms: number | null;
    bathrooms: number | null;
    area_sqm: string | null;
    status: string;
    verification_status: PropertyVerificationStatus;
    created_at: string;
    media_url: string | null;
  }>;
};

export type AgentDashboardResponse = {
  totalListings: number;
  byStatus: Record<string, number>;
  newInquiries7d: number;
  verificationSummary: Record<string, number>;
  listingViewsLast7d: number;
  listingViewsPrevious7d: number;
  listingViewsTrendPct: number;
  inquiryResponseRatePct: number;
};

export type PropertySearchParams = {
  agentId?: string;
  agent_id?: string;
  type?: 'land' | 'residential' | 'commercial' | 'off_plan';
  min_price?: number;
  max_price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  verification_status?: PropertyVerificationStatus;
  features?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'relevance';
  page?: number;
  limit?: number;
};

export type CreateInquiryPayload = {
  inquiryType: 'viewing' | 'offer' | 'question';
  message?: string;
  preferredDate?: string;
};

export type ContactAgentPayload = {
  message?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
};

export type ScheduleCallPayload = {
  preferredDate: string;
  message?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
};

export type AgentContactResponse = {
  id: string;
  status: string;
  createdAt: string;
};

export type AgentReview = {
  id: string;
  reviewerName: string | null;
  reviewerEmail: string | null;
  rating: number;
  comment: string | null;
  propertyType: string | null;
  propertyId: string | null;
  createdAt: string;
};

export type AgentReviewsResponse = {
  reviews: AgentReview[];
  total: number;
  averageRating: number;
};

export type CreateFraudReportPayload = {
  reportType:
    | 'double_sale'
    | 'fake_title'
    | 'non_existent'
    | 'misrepresentation'
    | 'other';
  description: string;
  evidenceUrls?: string[];
};

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    query.set(key, String(value));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export const propertiesApi = {
  search: (params: PropertySearchParams = {}) =>
    apiRequest<PropertySearchResponse>(
      `/properties${buildQueryString(params)}`,
      {
        method: 'GET',
      },
    ),

  getById: (id: string) =>
    apiRequest<PropertyListing>(`/properties/${id}`, {
      method: 'GET',
    }),

  getAgentProfile: (id: string) =>
    apiRequest<AgentProfileResponse>(`/properties/agents/${id}/profile`, {
      method: 'GET',
    }),

  getAgentDashboard: (authToken: string) =>
    apiRequest<AgentDashboardResponse>('/agent/dashboard', {
      method: 'GET',
      authToken,
    }),

  create: (authToken: string, payload: Record<string, unknown>) =>
    apiRequest<PropertyListing>('/properties', {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  update: (authToken: string, id: string, payload: Record<string, unknown>) =>
    apiRequest<PropertyListing>(`/properties/${id}`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  remove: (authToken: string, id: string) =>
    apiRequest<{ message: string }>(`/properties/${id}`, {
      method: 'DELETE',
      authToken,
    }),

  save: (authToken: string, id: string) =>
    apiRequest<{ message: string }>(`/properties/${id}/save`, {
      method: 'POST',
      authToken,
    }),

  unsave: (authToken: string, id: string) =>
    apiRequest<{ message: string }>(`/properties/${id}/save`, {
      method: 'DELETE',
      authToken,
    }),

  createInquiry: (
    authToken: string,
    id: string,
    payload: CreateInquiryPayload,
  ) =>
    apiRequest<unknown>(`/properties/${id}/inquiries`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  submitVerificationRequest: (
    authToken: string,
    id: string,
    payload: FormData,
  ) =>
    apiRequest<unknown>(`/properties/${id}/verification-request`, {
      method: 'POST',
      authToken,
      body: payload,
    }),

  submitFraudReport: (
    authToken: string,
    id: string,
    payload: CreateFraudReportPayload,
  ) =>
    apiRequest<unknown>(`/properties/${id}/fraud-reports`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  contactAgent: (agentId: string, payload: ContactAgentPayload, authToken?: string) =>
    apiRequest<AgentContactResponse>(`/properties/agents/${agentId}/contact`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  scheduleCall: (agentId: string, payload: ScheduleCallPayload, authToken?: string) =>
    apiRequest<AgentContactResponse>(`/properties/agents/${agentId}/schedule-call`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getAgentReviews: (agentId: string, limit = 10, offset = 0) =>
    apiRequest<AgentReviewsResponse>(
      `/properties/agents/${agentId}/reviews?limit=${limit}&offset=${offset}`,
      { method: 'GET' },
    ),

  getFeaturedAgents: (limit = 20) =>
    apiRequest<FeaturedAgentCard[]>(`/properties/agents/featured?limit=${limit}`, {
      method: 'GET',
    }),

  getSavedProperties: (authToken: string) =>
    apiRequest<{ data: PropertyListing[]; total: number }>('/users/me/saved-properties', {
      method: 'GET',
      authToken,
    }),
};
