'use client';

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(headers ?? {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new ApiError(await parseApiError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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
  submittedAt?: string;
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
    },
  ) =>
    apiRequest<AuthUser>('/users/me', {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
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

export const auditApi = {
  getMyLogs: (authToken: string, limit = 20, offset = 0) =>
    apiRequest<AuditLogEntry[]>(`/audit-logs/me?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      authToken,
    }),

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
    return apiRequest<AuditLogEntry[]>(`/admin/audit-logs${query ? `?${query}` : ''}`, {
      method: 'GET',
      authToken,
    });
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

export type PropertyListing = {
  id: string;
  title: string;
  description?: string | null;
  property_type: 'land' | 'residential' | 'commercial' | 'off_plan';
  status: PropertyStatus;
  price: string;
  currency: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqm?: string | null;
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

export type PropertySearchParams = {
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
};
