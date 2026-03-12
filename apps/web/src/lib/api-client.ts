'use client';

import { clearAuthSession, getRefreshToken, rotateTokens } from './auth-session';

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

    // POST /auth/refresh returns AuthTokens directly (flat), NOT an AuthResponse wrapper.
    const data = (await response.json()) as AuthTokens;
    const accessToken = data?.accessToken;
    if (!accessToken) {
      clearAuthSession();
      return null;
    }
    rotateTokens(data);
    return accessToken;
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
      | { message?: string | string[]; error?: { message?: string | string[] } }
      | undefined;

    // Handle wrapped error shape: { success: false, error: { message } }
    const msg = data?.message ?? data?.error?.message;

    if (!msg) return fallback;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg;
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

export type CompanyContext = {
  id: string;
  name: string;
  slug: string;
  category: string;
  role: string;
  is_admin: boolean;
  logo_url?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
  /** True when the user belongs to multiple companies — must select a context */
  requires_context_selection?: boolean;
  companies?: CompanyContext[];
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

  /**
   * Fetch the list of companies the authenticated user belongs to.
   * Used by the context-selector screen to get up-to-date logos/data.
   */
  getContexts: (authToken: string) =>
    apiRequest<CompanyContext[]>('/auth/contexts', {
      method: 'GET',
      authToken,
    }),

  /**
   * Exchange a company selection for a fully-scoped JWT pair.
   * Requires the interim access token issued during multi-company login.
   */
  selectContext: (authToken: string, companyId: string) =>
    apiRequest<AuthTokens>('/auth/contexts/select', {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId }),
    }),
};

export type UserSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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

  search: (authToken: string, q: string, role?: string): Promise<UserSearchResult[]> => {
    const qs = new URLSearchParams({ q });
    if (role) qs.set('role', role);
    return apiRequest<UserSearchResult[]>(`/users/search?${qs.toString()}`, { authToken });
  },
};

export const adminUsersApi = {
  list: (
    authToken: string,
    params: { limit?: number; offset?: number; role?: string; status?: string; search?: string } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.offset !== undefined) qs.set('offset', String(params.offset));
    if (params.role) qs.set('role', params.role);
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    const query = qs.toString();
    return apiRequest<{ data: AdminUserRecord[]; total: number }>(
      `/admin/users${query ? `?${query}` : ''}`,
      { authToken },
    );
  },

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

  investigate: (authToken: string, id: string, reason?: string) =>
    apiRequest<AuthUser>(`/admin/users/${id}/investigate`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  suspend: (authToken: string, id: string, reason?: string) =>
    apiRequest<AuthUser>(`/admin/users/${id}/suspend`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  reinstate: (authToken: string, id: string) =>
    apiRequest<AuthUser>(`/admin/users/${id}/reinstate`, {
      method: 'POST',
      authToken,
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
  docsCount?: number;
  // user fields joined by listAll / listPending
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

  list: (
    authToken: string,
    params: { status?: string; limit?: number; offset?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return apiRequest<KycRecord[]>(`/admin/kyc${query ? `?${query}` : ''}`, {
      method: 'GET',
      authToken,
    });
  },

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

// ─── Admin Platform Stats ─────────────────────────────────────────────────────

export type PlatformStats = {
  totalUsers: number;
  activeCompanies: number;
  pendingCompanies: number;
  kycPendingCount: number;
  activeListings: number;
  activeSales: number;
};

export const adminStatsApi = {
  get: (authToken: string) =>
    apiRequest<PlatformStats>('/admin/stats', {
      method: 'GET',
      authToken,
    }),
};

// ─── Admin Users ──────────────────────────────────────────────────────────────

export type AdminUserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string | null;
  kycStatus: string | null;
  status: string;
  companyCount: number;
  createdAt: string;
};

// ─── Admin Companies ──────────────────────────────────────────────────────────

export type AdminCompany = {
  id: string;
  name: string;
  slug?: string | null;
  category: string;
  status: string;
  verification_status: string;
  email?: string | null;
  phone?: string | null;
  registration_number?: string | null;
  logo_url?: string | null;
  address?: { city?: string | null; country?: string | null; region?: string | null; [key: string]: unknown } | null;
  created_at: string;
  updated_at: string;
};

export type AdminCompanyListResponse = {
  data: AdminCompany[];
  page: number;
  limit: number;
};

export const adminCompaniesApi = {
  list: (
    authToken: string,
    params: { status?: string; category?: string; page?: number; limit?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.category) qs.set('category', params.category);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<AdminCompanyListResponse>(
      `/admin/companies${query ? `?${query}` : ''}`,
      { method: 'GET', authToken },
    );
  },

  verify: (authToken: string, id: string) =>
    apiRequest<AdminCompany>(`/admin/companies/${id}/verify`, {
      method: 'POST',
      authToken,
    }),

  reject: (authToken: string, id: string, reason: string) =>
    apiRequest<AdminCompany>(`/admin/companies/${id}/reject`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  getById: (authToken: string, id: string) =>
    apiRequest<CompanyDetail>(`/admin/companies/${id}`, {
      method: 'GET',
      authToken,
    }),

  suspend: (authToken: string, id: string, reason: string) =>
    apiRequest<AdminCompany>(`/admin/companies/${id}/suspend`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  reinstate: (authToken: string, id: string) =>
    apiRequest<AdminCompany>(`/admin/companies/${id}/reinstate`, {
      method: 'POST',
      authToken,
    }),

  investigate: (authToken: string, id: string, reason: string) =>
    apiRequest<AdminCompany>(`/admin/companies/${id}/investigate`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),
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
      action?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.actorId) qs.set('actor_id', params.actorId);
    if (params.resourceType) qs.set('resource_type', params.resourceType);
    if (params.action) qs.set('action', params.action);
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
  listing_type?: 'for_sale' | 'to_rent' | 'development' | null;
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
  /** True = system (Self) company, false = real company, null/undefined = no company set. All non-false values mean privately listed. */
  company_is_system?: boolean | null;
  /** Display name of the company the listing was created under. */
  company_name?: string | null;
  /** Logo URL of the company the listing was created under. */
  company_logo_url?: string | null;
  /** Status of the company the listing was created under (e.g. 'under_investigation'). */
  company_status?: string | null;
  created_at: string;
  updated_at: string;
  /** ISO timestamp of the next scheduled open house for this property, if any. */
  next_open_house_at?: string | null;
  location?: {
    address_line1?: string | null;
    city?: string | null;
    region?: string | null;
    country: string;
    postal_code?: string | null;
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
  /** Slug of the agent's primary non-system company. Null means they only belong to the "Self" personal company. */
  primaryCompanySlug?: string | null;
  /** Display name of the agent's primary non-system company. */
  primaryCompanyName?: string | null;
  /** Logo URL of the agent's primary non-system company. */
  primaryCompanyLogoUrl?: string | null;
  /** UTC timestamp of when the agent's account was created. */
  createdAt?: string | null;
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
  q?: string;
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

// ─── Admin Fraud Reports ──────────────────────────────────────────────────────

export type FraudReport = {
  id: string;
  property_id: string;
  property_title: string;
  reporter_id: string;
  report_type: string;
  description: string;
  evidence_urls: string[];
  status: 'submitted' | 'under_investigation' | 'resolved' | 'dismissed';
  resolver_id: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FraudReportsResponse = {
  data: FraudReport[];
  total: number;
};

export const adminFraudApi = {
  /** GET /admin/fraud-reports */
  list: (
    authToken: string,
    params: { status?: string; limit?: number; offset?: number } = {},
  ) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return apiRequest<FraudReportsResponse>(
      `/admin/fraud-reports${query ? `?${query}` : ''}`,
      { authToken },
    );
  },

  /** PATCH /admin/fraud-reports/:id/resolve */
  resolve: (
    authToken: string,
    id: string,
    resolution: 'resolved' | 'dismissed',
    resolutionNotes?: string,
  ) =>
    apiRequest<FraudReport>(`/admin/fraud-reports/${id}/resolve`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution, resolutionNotes }),
    }),
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

  getById: (id: string, authToken?: string) =>
    apiRequest<PropertyListing>(`/properties/${id}`, {
      method: 'GET',
      ...(authToken ? { authToken } : {}),
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

  getMyListings: (authToken: string, status?: string) =>
    apiRequest<PropertySearchResponse>(
      `/agent/my-listings${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`,
      {
        method: 'GET',
        authToken,
      },
    ),

  getOwnerListings: (authToken: string, status?: string) =>
    apiRequest<{ data: PropertyListing[]; total: number }>(
      `/properties/my-listings${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`,
      {
        method: 'GET',
        authToken,
      },
    ),

  create: (authToken: string, payload: Record<string, unknown>) =>
    apiRequest<PropertyListing>('/properties', {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  addMedia: (authToken: string, id: string, formData: FormData) =>
    apiRequest<{ id: string; url: string; mediaType: string } | { items: Array<{ id: string; url: string; mediaType: string }> }>(
      `/properties/${id}/media`,
      {
        method: 'POST',
        authToken,
        body: formData,
        // NOTE: do NOT set Content-Type — browser sets it with multipart boundary
      },
    ),

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

  getPropertyOpenHouses: (id: string) =>
    apiRequest<OpenHouseRecord[]>(`/properties/${id}/open-houses`, {
      method: 'GET',
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

  compare: (ids: string[]) =>
    apiRequest<PropertyComparison>(`/properties/compare?ids=${ids.map(encodeURIComponent).join(',')}`, {
      method: 'GET',
    }),

  requestValuation: (
    authToken: string,
    propertyId: string,
    payload: ValuationRequestPayload,
  ) =>
    apiRequest<{ id: string }>(`/properties/${propertyId}/valuation-request`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getPropertyValuations: (authToken: string, propertyId: string) =>
    apiRequest<ValuationRecord[]>(`/properties/${propertyId}/valuations`, {
      method: 'GET',
      authToken,
    }),

  getComparableSales: (authToken: string, propertyId: string, radius?: number) =>
    apiRequest<ComparableSale[]>(
      `/properties/${propertyId}/comparable-sales${radius !== undefined ? `?radius=${radius}` : ''}`,
      { method: 'GET', authToken }
    ),

  getAiEstimate: (authToken: string, propertyId: string) =>
    apiRequest<AiValuationEstimate>(`/properties/${propertyId}/ai-estimate`, {
      method: 'GET',
      authToken,
    }),

  getPropertyStats: (authToken: string, propertyId: string) =>
    apiRequest<PropertyStats>(`/properties/${propertyId}/stats`, { method: 'GET', authToken }),

  getPropertyViewings: (authToken: string, propertyId: string) =>
    apiRequest<ListingViewingRecord[]>(`/properties/${propertyId}/viewings`, { method: 'GET', authToken }),

  getPropertyInquiries: (authToken: string, propertyId: string, limit = 50) =>
    apiRequest<{ data: PropertyInquiryRecord[]; total: number }>(
      `/properties/${propertyId}/inquiries?limit=${limit}`,
      { method: 'GET', authToken }
    ),
};

// ─── Compare & Valuation types ───────────────────────────────────────────────

export type ComparisonProperty = {
  id: string;
  title: string;
  price: string;
  currency: string;
  area_sqm: string | null;
  floor_area_sqm: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  monthly_levy: string | null;
  verification_status: string;
  status: string;
  property_type: string;
  city: string | null;
  created_at: string;
  media_url: string | null;
};

export type PropertyComparison = {
  properties: ComparisonProperty[];
  comparison: {
    price: { values: Array<{ propertyId: string; value: number }>; winner: string | null };
    pricePerSqm: { values: Array<{ propertyId: string; value: number | null }>; winner: string | null };
    size: { values: Array<{ propertyId: string; value: number | null }>; winner: string | null };
    bedrooms: { values: Array<{ propertyId: string; value: number | null }> };
    monthlyLevy: { values: Array<{ propertyId: string; value: number | null }> };
    verificationStatus: { values: Array<{ propertyId: string; value: string }> };
    daysOnMarket: { values: Array<{ propertyId: string; value: number | null }>; winner: string | null };
  };
};

export type ValuationRequestPayload = {
  valuationType: 'formal' | 'cma';
  estimatedValue: number;
  currency?: string;
  valuationDate: string;
  marketLow?: number;
  marketHigh?: number;
  methodology?: string;
  requestingPurpose?: 'listing' | 'bond_application' | 'insurance' | 'legal';
  notes?: string;
};

export type ValuationRecord = {
  id: string;
  property_id: string;
  requested_by: string;
  valuer_id: string | null;
  valuation_type: string;
  estimated_value: string;
  market_low: string | null;
  market_high: string | null;
  currency: string;
  valuation_date: string;
  status: string;
  methodology: string | null;
  requesting_purpose: string | null;
  notes: string | null;
  created_at: string;
};

export type CreateOpenHousePayload = {
  scheduledAt: string;
  endAt: string;
  maxAttendees?: number;
  description?: string;
};

export type CancelOpenHousePayload = {
  reason: string;
};

export type RescheduleOpenHousePayload = {
  scheduledAt: string;
  endAt: string;
  reason?: string;
};

export type OpenHouseRecord = {
  id: string;
  property_id: string;
  property_title: string;
  agent_id: string;
  scheduled_at: string;
  end_at: string;
  max_attendees: number | null;
  description: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  cancel_reason: string | null;
  rescheduled_at: string | null;
  rescheduled_reason: string | null;
  created_at: string;
};

// ─── Mandate types ────────────────────────────────────────────────────────────

export type MandateRecord = {
  id: string;
  property_id: string;
  agent_id: string;
  brokerage_id: string | null;
  mandate_type: 'sole' | 'open';
  commission_rate: string;
  commission_vat_inclusive: boolean;
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  status: 'pending_signature' | 'active' | 'expired' | 'cancelled';
  signed_by_seller_at: string | null;
  signed_by_agent_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  terms_document_url: string | null;
  created_at: string;
  seller_name: string | null;
  seller_email: string | null;
  seller_phone: string | null;
  seller_is_platform_user: boolean;
  agreement_document_url: string | null;
};

export type CreateMandatePayload = {
  mandateType: 'sole' | 'open';
  commissionRate: number;
  commissionVatInclusive?: boolean;
  startDate: string;
  endDate: string;
  autoRenewal?: boolean;
  termsDocumentUrl?: string;
  brokerageId?: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerIsPlatformUser?: boolean;
};

// ─── Comparable sales type ─────────────────────────────────────────────────────

export type PropertyStats = {
  views: number;
  saves: number;
  inquiries: number;
  viewings_requested: number;
  viewings_confirmed: number;
  viewings_completed: number;
  viewings_declined: number;
  viewings_cancelled: number;
  open_houses_scheduled: number;
  days_on_market: number;
};

export type ListingViewingRecord = {
  id: string;
  scheduled_at: string;
  status: string;
  viewing_type: string;
  duration_minutes: number | null;
  buyer_feedback: string | null;
  cancel_reason: string | null;
  declined_at: string | null;
  rescheduled_at: string | null;
  created_at: string;
  buyer_first_name: string | null;
  buyer_last_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
};

export type PropertyInquiryRecord = {
  id: string;
  inquiry_type: string;
  message: string | null;
  status: string;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  response: string | null;
  responded_at: string | null;
  created_at: string;
};

export type ComparableSale = {
  id: string;
  address: string;
  city: string | null;
  region: string | null;
  country: string;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_area_sqm: string | null;
  erf_size_sqm: string | null;
  sale_price: string;
  currency: string;
  sale_date: string;
  days_on_market: number | null;
  lat: string | null;
  lng: string | null;
  data_source: string | null;
  created_at: string;
};

export type AiValuationEstimate = {
  estimate: number;
  low: number;
  high: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  methodology: string;
  comparables_count: number;
};

// ─── Commission pipeline type ──────────────────────────────────────────────────

export type CommissionPipelineItem = {
  property_id: string;
  property_title: string;
  mandate_id: string;
  mandate_type: string;
  commission_rate: string;
  listing_price: string;
  currency: string;
  estimated_commission: number;
  status: string;
  listing_status: string;
};

export type CommissionPipelineResponse = {
  deals: CommissionPipelineItem[];
  totalEstimated: number;
};

// ─── Activity feed type ────────────────────────────────────────────────────────

export type ActivityFeedItem = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  property_title?: string;
};

export const agentApi = {
  getViewings: (authToken: string, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<ViewingResponse[]>(`/agent/viewings${query}`, {
      method: 'GET',
      authToken,
    });
  },

  createOpenHouse: (authToken: string, propertyId: string, payload: CreateOpenHousePayload) =>
    apiRequest<{ id: string }>(`/properties/${propertyId}/open-houses`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  cancelOpenHouse: (authToken: string, openHouseId: string, payload: CancelOpenHousePayload) =>
    apiRequest<OpenHouseRecord>(`/open-houses/${openHouseId}/cancel`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  rescheduleOpenHouse: (authToken: string, openHouseId: string, payload: RescheduleOpenHousePayload) =>
    apiRequest<OpenHouseRecord>(`/open-houses/${openHouseId}/reschedule`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getOpenHouses: (authToken: string) =>
    apiRequest<OpenHouseRecord[]>('/agent/open-houses', {
      method: 'GET',
      authToken,
    }),

  getMandates: (authToken: string) =>
    apiRequest<MandateRecord[]>('/agent/mandates', {
      method: 'GET',
      authToken,
    }),

  getCommissionPipeline: (authToken: string) =>
    apiRequest<CommissionPipelineResponse>('/agent/commission-pipeline', {
      method: 'GET',
      authToken,
    }),

  getActivityFeed: (authToken: string) =>
    apiRequest<ActivityFeedItem[]>('/agent/listings/activity-feed', {
      method: 'GET',
      authToken,
    }),
};

export const viewingActionsApi = {
  confirm: (authToken: string, viewingId: string) =>
    apiRequest<ViewingResponse>(`/viewings/${viewingId}/confirm`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),

  complete: (authToken: string, viewingId: string, agentNotes?: string) =>
    apiRequest<ViewingResponse>(`/viewings/${viewingId}/complete`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentNotes }),
    }),

  registerForOpenHouse: (authToken: string, openHouseId: string) =>
    apiRequest<{ id: string }>(`/open-houses/${openHouseId}/register`, {
      method: 'POST',
      authToken,
    }),
};

export const mandateApi = {
  getByProperty: (authToken: string, propertyId: string) =>
    apiRequest<MandateRecord[]>(`/properties/${propertyId}/mandate`, {
      method: 'GET',
      authToken,
    }),

  create: (authToken: string, propertyId: string, payload: CreateMandatePayload) =>
    apiRequest<MandateRecord>(`/properties/${propertyId}/mandate`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  sign: (authToken: string, propertyId: string, mandateId: string, party: 'seller' | 'agent') =>
    apiRequest<MandateRecord>(`/properties/${propertyId}/mandate/${mandateId}/sign`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ party }),
    }),

  cancel: (authToken: string, propertyId: string, mandateId: string, reason?: string) =>
    apiRequest<MandateRecord>(`/properties/${propertyId}/mandate/${mandateId}/cancel`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  markSellerSignedOffline: (
    authToken: string,
    propertyId: string,
    mandateId: string,
    documentUrl: string,
  ) =>
    apiRequest<MandateRecord>(
      `/properties/${propertyId}/mandate/${mandateId}/seller-offline-sign`,
      {
        method: 'POST',
        authToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl }),
      },
    ),
};

// ─── Agent CRM ────────────────────────────────────────────────────────────────

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'showing', 'offer', 'closed', 'inactive'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

export const ACTIVITY_TYPES = ['call', 'email', 'viewing_scheduled', 'offer_submitted', 'note'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

export const LEAD_SOURCES = ['portal_enquiry', 'referral', 'walk_in', 'social_media', 'open_house'] as const;
export type LeadSource = typeof LEAD_SOURCES[number];

// ─── Leads types ─────────────────────────────────────────────────────────────

export type LeadRow = {
  id: string;
  company_id: string;
  assigned_to: string | null;
  created_by: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  source: string | null;
  type: string;
  timeline: string | null;
  budget_min: string | null;
  budget_max: string | null;
  budget_currency: string;
  preferences: string | null;
  temperature: string;
  stage: string;
  prequalified: boolean;
  deal_value: string | null;
  notes: string | null;
  next_follow_up: string | null;
  last_contact_at: string | null;
  closed_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent_name?: string | null;
};

export type LeadActivityRow = {
  id: string;
  lead_id: string;
  company_id: string;
  actor_id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name?: string | null;
};

export type LeadTaskRow = {
  id: string;
  lead_id: string;
  company_id: string;
  assigned_to: string | null;
  created_by: string;
  title: string;
  type: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent_name?: string | null;
};

export type LeadDashboardResponse = {
  totalLeads: number;
  hotLeads: number;
  activeDeals: number;
  pipelineValue: number;
  pendingTasks: LeadTaskRow[];
  recentActivities: LeadActivityRow[];
  byType: Record<string, number>;
  byTemperature: Record<string, number>;
};

export type LeadPipelineStage = {
  stage: string;
  leads: LeadRow[];
  count: number;
  totalValue: number;
};

export type LeadPipelineResponse = {
  stages: LeadPipelineStage[];
};

export type LeadAnalyticsResponse = {
  conversionRate: number;
  closedRevenue: number;
  activeLeads: number;
  bySource: { source: string; count: number }[];
  byType: { type: string; count: number }[];
  funnel: { stage: string; count: number }[];
  monthlyTrend: { month: string; leads: number; closed: number }[];
  sourcePerformance: {
    source: string;
    count: number;
    closed: number;
    conversion: number;
    value: number;
  }[];
};

export type CreateLeadPayload = {
  name: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
  source?: string;
  timeline?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency?: string;
  preferences?: string;
  temperature?: string;
  stage?: string;
  prequalified?: boolean;
  dealValue?: number;
  notes?: string;
  nextFollowUp?: string;
  assignedTo?: string;
};

export type UpdateLeadPayload = Partial<CreateLeadPayload> & {
  lostReason?: string;
};

export type ListLeadsQuery = {
  search?: string;
  type?: string;
  temperature?: string;
  stage?: string;
  assignedTo?: string;
  limit?: number;
  offset?: number;
};

export type CreateLeadActivityPayload = {
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export type CreateLeadTaskPayload = {
  title: string;
  type: string;
  priority: string;
  dueDate?: string;
  assignedTo?: string;
};

export type UpdateLeadTaskPayload = Partial<CreateLeadTaskPayload> & {
  completed?: boolean;
};

export const leadsApi = {
  list: (authToken: string, params?: ListLeadsQuery) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.type) qs.set('type', params.type);
    if (params?.temperature) qs.set('temperature', params.temperature);
    if (params?.stage) qs.set('stage', params.stage);
    if (params?.assignedTo) qs.set('assignedTo', params.assignedTo);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<{ data: LeadRow[]; total: number }>(`/leads${query}`, {
      method: 'GET',
      authToken,
    });
  },

  create: (authToken: string, payload: CreateLeadPayload) =>
    apiRequest<LeadRow>('/leads', {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getDashboard: (authToken: string) =>
    apiRequest<LeadDashboardResponse>('/leads/dashboard', {
      method: 'GET',
      authToken,
    }),

  getPipeline: (authToken: string) =>
    apiRequest<LeadPipelineResponse>('/leads/pipeline', {
      method: 'GET',
      authToken,
    }),

  getAnalytics: (authToken: string) =>
    apiRequest<LeadAnalyticsResponse>('/leads/analytics', {
      method: 'GET',
      authToken,
    }),

  getById: (authToken: string, leadId: string) =>
    apiRequest<LeadRow>(`/leads/${leadId}`, {
      method: 'GET',
      authToken,
    }),

  update: (authToken: string, leadId: string, payload: UpdateLeadPayload) =>
    apiRequest<LeadRow>(`/leads/${leadId}`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  remove: (authToken: string, leadId: string) =>
    apiRequest<void>(`/leads/${leadId}`, {
      method: 'DELETE',
      authToken,
    }),

  listActivities: (authToken: string, leadId: string) =>
    apiRequest<LeadActivityRow[]>(`/leads/${leadId}/activities`, {
      method: 'GET',
      authToken,
    }),

  createActivity: (authToken: string, leadId: string, payload: CreateLeadActivityPayload) =>
    apiRequest<LeadActivityRow>(`/leads/${leadId}/activities`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  listTasks: (authToken: string, leadId: string) =>
    apiRequest<LeadTaskRow[]>(`/leads/${leadId}/tasks`, {
      method: 'GET',
      authToken,
    }),

  createTask: (authToken: string, leadId: string, payload: CreateLeadTaskPayload) =>
    apiRequest<LeadTaskRow>(`/leads/${leadId}/tasks`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  updateTask: (authToken: string, leadId: string, taskId: string, payload: UpdateLeadTaskPayload) =>
    apiRequest<LeadTaskRow>(`/leads/${leadId}/tasks/${taskId}`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

// ─── Companies ────────────────────────────────────────────────────────────────

export type UserCompany = {
  member_id: string;
  role: string;
  is_admin: boolean;
  status: string;
  permissions: unknown;
  id: string;
  name: string;
  slug: string;
  category: string;
  company_status: string;
  verification_status: string;
  logo_url?: string | null;
};

export type CompanyDocument = {
  id: string;
  company_id: string;
  uploaded_by: string;
  document_type: string;
  document_name: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  status: 'pending' | 'approved' | 'rejected';
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  first_name?: string | null;
  last_name?: string | null;
};

export type CompanyDetail = {
  id: string;
  name: string;
  slug: string;
  category: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
  status: string;
  verification_status: string;
  is_system: boolean;
  registration_number?: string | null;
  tax_number?: string | null;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    country?: string;
    postal_code?: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type CompanyDashboardActivityEntry = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type CompanyDashboardData = {
  company: CompanyDetail;
  stats: {
    activeMembers: number;
    pendingInvitations: number;
    openOrphanedTasks: number;
    todayActivities: number;
  };
  recentActivity: CompanyDashboardActivityEntry[];
};

export type CompanyAuditLogEntry = {
  id: string;
  event_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type OrphanedTaskEntry = {
  id: string;
  company_id: string;
  original_user_id: string;
  original_user_email: string | null;
  assignee_id: string | null;
  assignee_email: string | null;
  resource_type: string;
  resource_id: string | null;
  description: string | null;
  requires_notification: boolean;
  notification_notes: string | null;
  status: 'unassigned' | 'assigned' | 'closed';
  assigned_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const companiesApi = {
  getMyCompanies: (authToken: string) =>
    apiRequest<UserCompany[]>('/users/me/companies', {
      method: 'GET',
      authToken,
    }),

  getCompany: (authToken: string, id: string) =>
    apiRequest<CompanyDetail>(`/companies/${id}`, {
      method: 'GET',
      authToken,
    }),

  getDashboard: (authToken: string, id: string) =>
    apiRequest<CompanyDashboardData>(`/companies/${id}/dashboard`, {
      method: 'GET',
      authToken,
    }),

  createCompany: (
    authToken: string,
    payload: {
      name: string;
      category: string;
      email: string;
      phone?: string;
      website?: string;
      registration_number?: string;
      tax_number?: string;
      description?: string;
      logo_url?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        region?: string;
        postal_code?: string;
        country?: string;
      };
    },
  ) =>
    apiRequest<{ id: string; name: string; status: string }>('/companies', {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  submitVerification: (authToken: string, companyId: string) =>
    apiRequest<{ id: string; status: string }>(`/companies/${companyId}/submit-verification`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
    }),

  deactivateCompany: (authToken: string, companyId: string) =>
    apiRequest<{ id: string; status: string }>(`/companies/${companyId}/deactivate`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
    }),

  updateCompany: (
    authToken: string,
    companyId: string,
    payload: {
      name?: string;
      email?: string;
      phone?: string;
      website?: string;
      description?: string;
      registration_number?: string;
      tax_number?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        region?: string;
        postal_code?: string;
        country?: string;
      };
    },
  ) =>
    apiRequest<CompanyDetail>(`/companies/${companyId}`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  uploadCompanyLogo: (authToken: string, companyId: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiRequest<{ url: string }>(`/companies/${companyId}/logo`, {
      method: 'POST',
      authToken,
      body: formData,
    });
  },

  getDocuments: (authToken: string, companyId: string) =>
    apiRequest<CompanyDocument[]>(`/companies/${companyId}/documents`, {
      method: 'GET',
      authToken,
    }),

  uploadDocument: (
    authToken: string,
    companyId: string,
    file: File,
    documentType: string,
    documentName: string,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('document_name', documentName);
    return apiRequest<CompanyDocument[]>(`/companies/${companyId}/documents`, {
      method: 'POST',
      authToken,
      body: formData,
    });
  },

  listMembers: (authToken: string, companyId: string) =>
    apiRequest<CompanyMember[]>(`/companies/${companyId}/members`, {
      method: 'GET',
      authToken,
    }),

  getRolePermissions: (authToken: string, companyId: string, role: string) =>
    apiRequest<CompanyMemberPermission[]>(
      `/companies/${companyId}/roles/${role}/permissions`,
      { method: 'GET', authToken },
    ),

  getAllowedRoles: (authToken: string, companyId: string) =>
    apiRequest<string[]>(`/companies/${companyId}/allowed-roles`, {
      method: 'GET',
      authToken,
    }),

  updateMemberPermissions: (
    authToken: string,
    companyId: string,
    memberId: string,
    permissions: CompanyMemberPermission[],
  ) =>
    apiRequest<CompanyMember>(
      `/companies/${companyId}/members/${memberId}/permissions`,
      {
        method: 'PATCH',
        authToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      },
    ),

  inviteMember: (
    authToken: string,
    companyId: string,
    payload: {
      email: string;
      role: string;
      is_admin?: boolean;
      permissions?: CompanyMemberPermission[];
    },
  ) =>
    apiRequest<{ id: string }>(`/companies/${companyId}/members/invite`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getActivityLogs: (authToken: string, companyId: string, limit = 50, offset = 0) =>
    apiRequest<CompanyAuditLogEntry[]>(
      `/companies/${companyId}/audit-logs?limit=${limit}&offset=${offset}`,
      { method: 'GET', authToken },
    ),

  listInvitations: (authToken: string, companyId: string) =>
    apiRequest<CompanyInvitation[]>(`/companies/${companyId}/invitations`, {
      method: 'GET',
      authToken,
    }),

  revokeInvitation: (authToken: string, companyId: string, inviteId: string) =>
    apiRequest<{ success: boolean }>(`/companies/${companyId}/invitations/${inviteId}`, {
      method: 'DELETE',
      authToken,
    }),

  resendInvitation: (authToken: string, companyId: string, inviteId: string) =>
    apiRequest<{ success: boolean; expires_at: string }>(
      `/companies/${companyId}/invitations/${inviteId}/resend`,
      { method: 'POST', authToken },
    ),
};

// ---------------------------------------------------------------------------
// Invitations (public + authenticated flows)
// ---------------------------------------------------------------------------

export type InvitationPreview = {
  id: string;
  invited_email: string;
  role: string;
  is_admin: boolean;
  expires_at: string;
  company_id: string;
  company_name: string;
  company_category: string;
  invited_by: string | null;
};

export type InviteAcceptResult = {
  success: boolean;
  company_id: string;
  user: AuthUser | null;
  tokens: AuthTokens;
};

export type InviteRegisterResult = {
  user: AuthUser;
  tokens: AuthTokens;
  company_id: string;
};

export const invitationsApi = {
  /** Public — check if an email already has an account (used to auto-route login vs register) */
  checkEmail: (email: string) =>
    apiRequest<{ exists: boolean }>(`/invitations/check-email?email=${encodeURIComponent(email)}`, { method: 'GET' }),

  /** Public — fetch invitation details before the user authenticates */
  preview: (token: string) =>
    apiRequest<InvitationPreview>(`/invitations/${token}`, { method: 'GET' }),

  /** Authenticated — existing user accepts an invitation */
  accept: (authToken: string, token: string) =>
    apiRequest<InviteAcceptResult>(`/invitations/${token}/accept`, {
      method: 'POST',
      authToken,
    }),

  /** Public — new user registers and accepts in one step, returns auth tokens */
  registerAndAccept: (
    token: string,
    payload: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    },
  ) =>
    apiRequest<InviteRegisterResult>(`/invitations/${token}/register-and-accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

export const orphanedTasksApi = {
  list: (authToken: string, companyId: string, status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return apiRequest<OrphanedTaskEntry[]>(
      `/companies/${companyId}/orphaned-tasks${qs}`,
      { method: 'GET', authToken },
    );
  },

  assign: (authToken: string, companyId: string, taskId: string, assigneeId: string) =>
    apiRequest<OrphanedTaskEntry>(
      `/companies/${companyId}/orphaned-tasks/${taskId}/assign`,
      {
        method: 'PATCH',
        authToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee_id: assigneeId }),
      },
    ),

  close: (authToken: string, companyId: string, taskId: string) =>
    apiRequest<OrphanedTaskEntry>(
      `/companies/${companyId}/orphaned-tasks/${taskId}/close`,
      { method: 'POST', authToken },
    ),
};

// ─── Seller Dashboard ────────────────────────────────────────────────────────

export type SellerProperty = {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  listing_type: string;
  property_type: string;
  verification_status: string;
  floor_area_sqm: number | null;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
  listing_reference: string | null;
  city: string | null;
  suburb: string | null;
  media_url: string | null;
  completed_viewings: number;
  upcoming_viewings: number;
  total_inquiries: number;
  save_count: number;
  mandate_type: string | null;
  mandate_status: string | null;
  mandate_expiry: string | null;
  agent_first_name: string | null;
  agent_last_name: string | null;
};

export type SellerPropertyViewing = {
  id: string;
  scheduled_at: string;
  status: string;
  buyer_feedback: string | null;
  viewing_type: string;
  duration_minutes: number | null;
  buyer_first_name: string | null;
  buyer_last_name: string | null;
  agent_first_name: string | null;
  agent_last_name: string | null;
};

export type SellerPropertyOffer = {
  id: string;
  stage_number: number;
  stage_name: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  buyer_first_name: string | null;
  buyer_last_name: string | null;
};

export const sellerApi = {
  getMyProperties: (authToken: string) =>
    apiRequest<SellerProperty[]>('/seller/properties', { method: 'GET', authToken }),

  getPropertyViewings: (authToken: string, propertyId: string) =>
    apiRequest<SellerPropertyViewing[]>(`/seller/properties/${propertyId}/viewings`, {
      method: 'GET',
      authToken,
    }),

  getPropertyActivity: (authToken: string, propertyId: string) =>
    apiRequest<Record<string, unknown>[]>(`/seller/properties/${propertyId}/activity`, {
      method: 'GET',
      authToken,
    }),

  getPropertyOffers: (authToken: string, propertyId: string) =>
    apiRequest<SellerPropertyOffer[]>(`/seller/properties/${propertyId}/offers`, {
      method: 'GET',
      authToken,
    }),
};

// ─── Viewings ────────────────────────────────────────────────────────────────

export type CreateViewingPayload = {
  viewingType: 'physical' | 'virtual' | 'open_house';
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
};

export type AgentBookViewingPayload = {
  viewingType: 'physical' | 'virtual';
  scheduledAt: string;
  durationMinutes?: number;
  virtualLink?: string;
  buyerContactName: string;
  buyerContactEmail?: string;
  buyerContactPhone?: string;
  notes?: string;
};

export type ViewingResponse = {
  id: string;
  property_id: string;
  buyer_id: string;
  agent_id: string | null;
  viewing_type: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  notes: string | null;
  cancel_reason: string | null;
  cancelled_by: 'buyer' | 'agent' | 'system' | null;
  rescheduled_at: string | null;
  rescheduled_reason: string | null;
  declined_at: string | null;
  created_at: string;
  // Enriched by backend JOIN queries
  property_title?: string | null;
};

export type AgentDeclineViewingPayload = {
  reason: string;
  alternativeDates?: string[];
  message?: string;
};

export type CancelViewingPayload = {
  reason: string;
};

export type RescheduleViewingPayload = {
  scheduledAt: string;
  durationMinutes?: number;
  virtualLink?: string;
  reason?: string;
};

export type UserNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  resource_type: string | null;
  resource_id: string | null;
  read_at: string | null;
  created_at: string;
};

export const viewingsApi = {
  request: (authToken: string, propertyId: string, payload: CreateViewingPayload) =>
    apiRequest<ViewingResponse>(`/properties/${propertyId}/viewings`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  bookForBuyer: (authToken: string, propertyId: string, payload: AgentBookViewingPayload) =>
    apiRequest<ViewingResponse>(`/properties/${propertyId}/viewings/agent-book`, {
      method: 'POST',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getAgentViewings: (authToken: string, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<ViewingResponse[]>(`/agent/viewings${query}`, {
      method: 'GET',
      authToken,
    });
  },

  confirm: (authToken: string, viewingId: string) =>
    apiRequest<ViewingResponse>(`/viewings/${viewingId}/confirm`, {
      method: 'PATCH',
      authToken,
    }),

  decline: (authToken: string, viewingId: string, payload: AgentDeclineViewingPayload) =>
    apiRequest<ViewingResponse>(`/viewings/${viewingId}/decline`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  cancel: (authToken: string, viewingId: string, payload: CancelViewingPayload) =>
    apiRequest<ViewingResponse>(`/viewings/${viewingId}/cancel`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  reschedule: (authToken: string, viewingId: string, payload: RescheduleViewingPayload) =>
    apiRequest<ViewingResponse>(`/viewings/${viewingId}/reschedule`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getMyViewings: (authToken: string) =>
    apiRequest<ViewingResponse[]>(`/buyer/viewings`, {
      method: 'GET',
      authToken,
    }),
};

export const notificationsApi = {
  getAll: (authToken: string) =>
    apiRequest<UserNotification[]>(`/notifications`, {
      method: 'GET',
      authToken,
    }),

  markRead: (authToken: string, notificationId: string) =>
    apiRequest<{ ok: boolean }>(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
      authToken,
    }),

  markAllRead: (authToken: string) =>
    apiRequest<{ ok: boolean }>(`/notifications/read-all`, {
      method: 'PATCH',
      authToken,
    }),
};

// ─── Inquiries ────────────────────────────────────────────────────────────────

export const inquiriesApi = {
  respond: (authToken: string, inquiryId: string, payload: { response: string }) =>
    apiRequest<{ ok: boolean }>(`/inquiries/${inquiryId}/respond`, {
      method: 'PATCH',
      authToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

// ─── Neighbourhood ────────────────────────────────────────────────────────────

export type NeighbourhoodStats = {
  suburb: string | null;
  city: string | null;
  country: string | null;
  crime_index: number | null;
  crime_label: string | null;
  school_rating: number | null;
  avg_price_per_sqm: number | null;
  price_yoy_change_pct: number | null;
  demand_score: number | null;
  walkability_score: number | null;
  amenities_count: number | null;
  population_density: number | null;
};

export const neighbourhoodApi = {
  getByProperty: (propertyId: string, authToken?: string | null) =>
    apiRequest<NeighbourhoodStats>(`/properties/${propertyId}/neighbourhood`, {
      method: 'GET',
      authToken,
    }),
};

export type SyndicationRecord = {
  id: string;
  property_id: string;
  portal_id: string;
  portal_name: string;
  external_listing_id: string | null;
  external_url: string | null;
  sync_status: 'pending' | 'synced' | 'paused' | 'failed';
  last_synced_at: string | null;
  error_message: string | null;
  created_at: string;
};

export const syndicationApi = {
  syndicate: (token: string, propertyId: string) =>
    apiRequest<SyndicationRecord[]>(`/properties/${propertyId}/syndicate`, {
      method: 'POST',
      authToken: token,
    }),
  getStatus: (token: string, propertyId: string) =>
    apiRequest<SyndicationRecord[]>(`/properties/${propertyId}/syndication-status`, {
      method: 'GET',
      authToken: token,
    }),
  pause: (token: string, propertyId: string, portalId: string) =>
    apiRequest<SyndicationRecord>(`/properties/${propertyId}/syndicate/${portalId}/pause`, {
      method: 'PATCH',
      authToken: token,
    }),
};

export type CompanyMemberPermission = { resource: string; action: string };

export type CompanyInvitation = {
  id: string;
  invited_email: string;
  role: string;
  is_admin: boolean;
  status: 'pending' | 'revoked' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
  accepted_at: string | null;
  invited_by_first_name: string | null;
  invited_by_last_name: string | null;
  invited_by_email: string | null;
};

export type CompanyMember = {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  is_admin: boolean;
  status: 'active' | 'suspended' | 'revoked';
  permissions: CompanyMemberPermission[];
  invited_by: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Intelligence
// ─────────────────────────────────────────────────────────────────────────────

export type AIRecommendationType =
  | 'lead_followup'
  | 'pricing_alert'
  | 'buyer_match'
  | 'deal_risk'
  | 'hot_lead';

export type AIRecommendationPriority = 'urgent' | 'high' | 'medium' | 'low';

export type AIRecommendation = {
  id: string;
  type: AIRecommendationType;
  priority: AIRecommendationPriority;
  title: string;
  description: string;
  entityId?: string;
  entityName?: string;
  actionUrl?: string;
  createdAt: string;
};

export type LeadScore = {
  leadId: string;
  leadName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  temperature: string;
  stage: string;
  reasoning: string[];
};

export type PricingInsight = {
  listingId: string;
  listingTitle: string;
  currentPrice: number;
  avgMarketPrice: number;
  priceDiff: number;
  recommendation: 'overpriced' | 'underpriced' | 'competitive';
  comparablesCount: number;
};

export type BuyerMatch = {
  leadId: string;
  leadName: string;
  listingId: string;
  listingTitle: string;
  matchScore: number;
  matchReasons: string[];
};

export type AIIntelligenceDashboard = {
  recommendations: AIRecommendation[];
  leadScores: LeadScore[];
  pricingInsights: PricingInsight[];
  buyerMatches: BuyerMatch[];
  summary: {
    totalRecommendations: number;
    urgentCount: number;
    leadsScored: number;
    avgLeadScore: number;
    listingsAnalyzed: number;
    buyerMatchesFound: number;
  };
};

export type AssistantListItem = {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'purple';
  href?: string;
};

export type AssistantChartBar = {
  label: string;
  value: number;
  color?: string;
};

export type AssistantSummaryCard = {
  label: string;
  value: string | number;
  color?: string;
};

export type AssistantResponse = {
  responseType: 'list' | 'chart' | 'summary' | 'text' | 'error';
  title?: string;
  text?: string;
  items?: AssistantListItem[];
  chart?: { title: string; bars: AssistantChartBar[] };
  summaryCards?: AssistantSummaryCard[];
  totalCount?: number;
};

// ── Orchestrator / Command Center types ──────────────────────────────────────

export type OrchestratorResult = {
  planId: string;
  intent: string;
  confidence: number;
  response: AssistantResponse;
  durationMs: number;
  traceId: string;
};

export type AgentStatus = 'active' | 'paused' | 'error';

export type AgentDescriptor = {
  name: string;
  description: string;
  capabilities: string[];
  actions: string[];
  allowedTools: string[];
  status: AgentStatus;
  registeredAt: string;
  invocationCount: number;
  successCount: number;
  errorCount: number;
  avgDurationMs: number;
  lastInvokedAt?: string;
  lastError?: string;
};

export type RegistryHealth = {
  totalAgents: number;
  activeAgents: number;
  pausedAgents: number;
  errorAgents: number;
  totalInvocations: number;
  overallSuccessRate: number;
};

export type AgentMetrics = {
  agentName: string;
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  totalEstimatedCostUsd: number;
  callsLast24h: number;
};

export type AgentTrace = {
  traceId: string;
  agentName: string;
  action: string;
  companyId: string;
  userId?: string;
  inputSummary?: string;
  outputSummary?: string;
  matchedIntent?: string;
  intentConfidence?: number;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: 'running' | 'success' | 'failed';
  estimatedTokens?: number;
  estimatedCostUsd?: number;
  error?: string;
};

export type ObservabilityReport = {
  generatedAt: string;
  totalTraces: number;
  activeTraces: number;
  successRate: number;
  avgDurationMs: number;
  totalEstimatedCostUsd: number;
  agentMetrics: AgentMetrics[];
  recentTraces: AgentTrace[];
};

export type CommandCenterOverview = {
  agents: AgentDescriptor[];
  health: RegistryHealth;
  metrics: ObservabilityReport;
  memorySizes: { shortTerm: number; longTerm: number; reasoningSteps: number };
};

export type SafetyRule = {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
};

export const aiIntelligenceApi = {
  getDashboard: (token: string) =>
    apiRequest<AIIntelligenceDashboard>('/ai-intelligence/dashboard', {
      authToken: token,
    }),
  query: (token: string, query: string, pageContext?: string) =>
    apiRequest<AssistantResponse>('/ai-intelligence/assistant', {
      authToken: token,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...(pageContext ? { pageContext } : {}) }),
    }),
  queryOrchestrated: (token: string, query: string, pageContext?: string) =>
    apiRequest<OrchestratorResult>('/ai-intelligence/assistant/orchestrated', {
      authToken: token,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...(pageContext ? { pageContext } : {}) }),
    }),
};

export const aiCommandCenterApi = {
  getOverview: (token: string) =>
    apiRequest<CommandCenterOverview>('/ai-intelligence/command-center/overview', {
      authToken: token,
    }),
  getTraces: (token: string, limit = 50) =>
    apiRequest<AgentTrace[]>(`/ai-intelligence/observability/traces?limit=${limit}`, {
      authToken: token,
    }),
  getMetrics: (token: string) =>
    apiRequest<ObservabilityReport>('/ai-intelligence/observability/metrics', {
      authToken: token,
    }),
  getSafetyRules: (token: string) =>
    apiRequest<SafetyRule[]>('/ai-intelligence/safety/rules', {
      authToken: token,
    }),
  pauseAgent: (token: string, name: string) =>
    apiRequest<{ name: string; status: string }>(
      `/ai-intelligence/agents/${encodeURIComponent(name)}/pause`,
      { method: 'POST', authToken: token },
    ),
  resumeAgent: (token: string, name: string) =>
    apiRequest<{ name: string; status: string }>(
      `/ai-intelligence/agents/${encodeURIComponent(name)}/resume`,
      { method: 'POST', authToken: token },
    ),
};

// ─── Sales Progression Types ────────────────────────────────────────────────

export type SaleStage = {
  stageNumber: number;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  startedAt?: string | null;
  completedAt?: string | null;
  flaggedReason?: string | null;
  daysInStage?: number;
};

export type SaleDocument = {
  id: string;
  stageNumber: number;
  name: string;
  documentType?: string | null;
  status: 'pending' | 'received' | 'verified' | 'rejected';
  uploadedBy?: string | null;
  uploadedAt?: string | null;
  fileUrl?: string | null;
  reviewNotes?: string | null;
};

export type PersonInfo = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type Sale = {
  id: string;
  propertyId: string;
  buyerId: string | null;
  sellerId: string;
  agentId?: string | null;
  conveyancerId?: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  currentStage: number;
  purchasePrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  property?: { title?: string; addressLine1?: string; city?: string } | null;
  buyers: PersonInfo[];
  sellers: PersonInfo[];
  buyer?: { firstName: string; lastName: string; email: string } | null;  // kept for backwards compat
  seller?: { firstName: string; lastName: string; email: string } | null; // kept for backwards compat
  agent?: { firstName: string; lastName: string; email: string } | null;
  conveyancer?: { firstName: string; lastName: string; email: string } | null;
  stages?: SaleStage[];
  commission?: { rate: number; mandateType: string; estimated: number } | null;
};

export type OTPVersion = {
  id: string;
  saleId: string;
  version: number;
  offeredPrice: number;
  currency?: string;
  conditions?: unknown;
  status: 'draft' | 'pending' | 'pending_buyer' | 'pending_seller' | 'signed' | 'counter_offered' | 'withdrawn' | 'expired' | 'accepted' | 'rejected';
  createdBy?: string;
  buyerSignedAt?: string | null;
  sellerSignedAt?: string | null;
  createdAt: string;
};

export type DealRoomMessage = {
  id: string;
  saleId: string;
  senderId: string;
  senderRole: string;
  threadType: 'legal' | 'financial' | 'general' | 'compliance';
  content: string;
  readAt?: string | null;
  createdAt: string;
  sender?: { firstName: string; lastName: string } | null;
};

export type BondApplication = {
  id: string;
  saleId: string;
  buyerId: string;
  bankName: string;
  applicationRef?: string | null;
  loanAmount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'declined' | 'conditional';
  interestRate?: number | null;
  termMonths?: number | null;
  conditions?: unknown;
  submittedAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
};

export type ComplianceItem = {
  certType: string;
  status: 'required' | 'in_progress' | 'received' | 'waived';
  dueDate?: string | null;
  receivedDate?: string | null;
  fileUrl?: string | null;
  notes?: string | null;
};

export type ComplianceStatus = {
  requirements: ComplianceItem[];
  allMet: boolean;
};

export type DisbursementInstruction = {
  id: string;
  saleId: string;
  payee: string;
  payeeType: 'agent' | 'seller' | 'bank' | 'govt' | 'other';
  amount: number;
  currency: string;
  bankDetails: unknown;
  purpose: string;
  status: 'pending' | 'approved' | 'paid';
  approvedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

export type SellerDisclosure = {
  id: string;
  saleId: string;
  disclosureData: unknown;
  sellerSignedAt?: string | null;
  buyerAcknowledgedAt?: string | null;
  status: 'draft' | 'pending_seller' | 'pending_buyer' | 'completed';
  createdAt: string;
};

export type PostSaleChecklist = {
  items: Array<{ key: string; label: string; done: boolean; doneAt?: string | null }>;
  completedAt?: string | null;
};

// ─── salesApi ───────────────────────────────────────────────────────────────

// Stage rows come from raw SQL — normalise snake_case to the SaleStage type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSaleDocument(raw: any): SaleDocument {
  return {
    id:           raw.id,
    stageNumber:  raw.stageNumber  ?? raw.stage_number,
    name:         raw.name         ?? raw.document_name ?? '',
    documentType: raw.documentType ?? raw.document_type ?? null,
    status:       (raw.status      ?? 'pending') as SaleDocument['status'],
    uploadedBy:   raw.uploadedBy   ?? raw.uploaded_by   ?? null,
    uploadedAt:   raw.uploadedAt
                    ? raw.uploadedAt
                    : raw.uploaded_at
                      ? new Date(raw.uploaded_at).toISOString()
                      : null,
    fileUrl:      raw.fileUrl      ?? raw.url           ?? null,
    reviewNotes:  raw.reviewNotes  ?? null,
  };
}

function mapStage(raw: any): SaleStage {
  return {
    stageNumber:   raw.stageNumber   ?? raw.stage_number,
    name:          raw.name          ?? raw.stage_name ?? '',
    status:        (raw.status       ?? 'not_started') as SaleStage['status'],
    startedAt:     raw.startedAt     ?? raw.started_at    ?? null,
    completedAt:   raw.completedAt   ?? raw.completed_at  ?? null,
    flaggedReason: raw.flaggedReason ?? raw.flagged_reason ?? null,
    daysInStage:   raw.daysInStage   ?? raw.days_in_stage,
  };
}

// The backend returns raw SQL snake_case rows — normalise to the camelCase Sale type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(raw: any): Sale {
  const mapPerson = (p: any) => p ? {
    firstName: p.firstName ?? p.first_name ?? '',
    lastName:  p.lastName  ?? p.last_name  ?? '',
    email:     p.email     ?? '',
  } : null;
  const mapPersonInfo = (p: any): PersonInfo => ({
    id:        p.id,
    firstName: p.firstName ?? p.first_name ?? '',
    lastName:  p.lastName  ?? p.last_name  ?? '',
    email:     p.email     ?? '',
  });
  const buyers: PersonInfo[]  = Array.isArray(raw.buyers)  ? raw.buyers.map(mapPersonInfo)  : [];
  const sellers: PersonInfo[] = Array.isArray(raw.sellers) ? raw.sellers.map(mapPersonInfo) : [];
  return {
    id:              raw.id,
    propertyId:      raw.propertyId      ?? raw.property_id,
    buyerId:         raw.buyerId         ?? raw.buyer_id         ?? null,
    sellerId:        raw.sellerId        ?? raw.seller_id,
    agentId:         raw.agentId         ?? raw.agent_id         ?? null,
    conveyancerId:   raw.conveyancerId   ?? raw.buyer_conveyancer_id ?? raw.conveyancer_id ?? null,
    status:          raw.status,
    currentStage:    raw.currentStage    ?? raw.current_stage    ?? 1,
    purchasePrice:   Number(raw.purchasePrice ?? raw.agreed_price ?? 0),
    currency:        raw.currency        ?? 'ZAR',
    createdAt:       raw.createdAt       ?? raw.created_at,
    updatedAt:       raw.updatedAt       ?? raw.updated_at,
    property:        raw.property        ?? null,
    buyers,
    sellers,
    buyer:           buyers[0] ? { firstName: buyers[0].firstName, lastName: buyers[0].lastName, email: buyers[0].email } : mapPerson(raw.buyer),
    seller:          sellers[0] ? { firstName: sellers[0].firstName, lastName: sellers[0].lastName, email: sellers[0].email } : mapPerson(raw.seller),
    agent:           mapPerson(raw.agent),
    conveyancer:     mapPerson(raw.conveyancer),
    stages:          raw.stages          ?? undefined,
    commission:      raw.commission      ?? null,
  };
}

export const salesApi = {
  // ── Base Sale operations ─────────────────────────────────────────────────
  create: (token: string, payload: { propertyId: string; buyerId?: string; sellerId: string; agentId?: string; agreedPrice: number; currency?: string; depositAmount?: number }) =>
    apiRequest<unknown>('/sales', {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(mapSale),

  getMySales: (token: string) =>
    apiRequest<{ data: unknown[]; total: number; page: number; limit: number }>('/sales/me', { authToken: token })
      .then(r => r.data.map(mapSale)),

  getById: (token: string, saleId: string) =>
    apiRequest<unknown>(`/sales/${saleId}`, { authToken: token }).then(mapSale),

  assignConveyancer: (token: string, saleId: string, payload: { conveyancerId: string }) =>
    apiRequest<Sale>(`/sales/${saleId}/assign-conveyancer`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  assignAgent: (token: string, saleId: string, agentId: string) =>
    apiRequest<Sale>(`/sales/${saleId}/assign-agent`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId }),
    }),

  assignBuyer: (token: string, saleId: string, buyerId: string) =>
    apiRequest<{ message: string }>(`/sales/${saleId}/assign-buyer`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyerId }),
    }),

  removeBuyer: (token: string, saleId: string, userId: string) =>
    apiRequest<{ message: string }>(`/sales/${saleId}/buyers/${userId}`, {
      method: 'DELETE',
      authToken: token,
    }),

  assignSeller: (token: string, saleId: string, sellerId: string) =>
    apiRequest<{ message: string }>(`/sales/${saleId}/assign-seller`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerId }),
    }),

  removeSeller: (token: string, saleId: string, userId: string) =>
    apiRequest<{ message: string }>(`/sales/${saleId}/sellers/${userId}`, {
      method: 'DELETE',
      authToken: token,
    }),

  cancel: (token: string, saleId: string, payload: { reason: string }) =>
    apiRequest<Sale>(`/sales/${saleId}/cancel`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getStages: (token: string, saleId: string) =>
    apiRequest<unknown[]>(`/sales/${saleId}/stages`, { authToken: token })
      .then(r => r.map(mapStage)),

  startStage: (token: string, saleId: string, stageNum: number, payload?: object) =>
    apiRequest<unknown>(`/sales/${saleId}/stages/${stageNum}/start`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    }).then(mapStage),

  completeStage: (token: string, saleId: string, stageNum: number, payload?: object) =>
    apiRequest<unknown>(`/sales/${saleId}/stages/${stageNum}/complete`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    }).then(mapStage),

  flagStage: (token: string, saleId: string, stageNum: number, payload: { reason: string }) =>
    apiRequest<unknown>(`/sales/${saleId}/stages/${stageNum}/flag`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(mapStage),

  addDocument: (token: string, saleId: string, stageNum: number, payload: { documentName: string; documentType?: string; url?: string; isRequired?: boolean }) =>
    apiRequest<SaleDocument>(`/sales/${saleId}/stages/${stageNum}/documents`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(mapSaleDocument),

  getDocuments: (token: string, saleId: string) =>
    apiRequest<SaleDocument[]>(`/sales/${saleId}/documents`, { authToken: token })
      .then(r => r.map(mapSaleDocument)),

  updateDocumentStatus: (token: string, saleId: string, docId: string, payload: { status: string; reviewNotes?: string }) =>
    apiRequest<SaleDocument>(`/sales/${saleId}/documents/${docId}/status`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  deleteDocument: (token: string, saleId: string, docId: string) =>
    apiRequest<void>(`/sales/${saleId}/documents/${docId}`, {
      method: 'DELETE',
      authToken: token,
    }),

  getMessages: (token: string, saleId: string) =>
    apiRequest<Array<{ id: string; content: string; senderId: string; senderRole: string; createdAt: string }>>(`/sales/${saleId}/messages`, { authToken: token }),

  addMessage: (token: string, saleId: string, payload: { content: string; recipientId?: string }) =>
    apiRequest<{ id: string; content: string; senderId: string; createdAt: string }>(`/sales/${saleId}/messages`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getGovernmentInteractions: (token: string, saleId: string) =>
    apiRequest<Array<{ id: string; department: string; status: string; notes?: string }>>(`/sales/${saleId}/government-interactions`, { authToken: token }),

  addGovernmentInteraction: (token: string, saleId: string, payload: { department: string; status: string; notes?: string }) =>
    apiRequest<{ id: string }>(`/sales/${saleId}/government-interactions`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  // ── OTP (Offer to Purchase) ──────────────────────────────────────────────
  createOTP: (token: string, saleId: string, payload: { offeredPrice: number; currency?: string; offerValidUntil: string; conditions?: unknown }) =>
    apiRequest<OTPVersion>(`/sales/${saleId}/otp`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getOTPVersions: (token: string, saleId: string) =>
    apiRequest<OTPVersion[]>(`/sales/${saleId}/otp/versions`, { authToken: token }),

  signOTP: (token: string, saleId: string, otpId: string, payload?: { signatureData?: string }) =>
    apiRequest<OTPVersion>(`/sales/${saleId}/otp/${otpId}/sign`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    }),

  counterOfferOTP: (token: string, saleId: string, otpId: string, payload: { offeredPrice: number; offerValidUntil: string; conditions?: unknown }) =>
    apiRequest<OTPVersion>(`/sales/${saleId}/otp/${otpId}/counter-offer`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  withdrawOTP: (token: string, saleId: string, otpId: string, payload?: { reason?: string }) =>
    apiRequest<OTPVersion>(`/sales/${saleId}/otp/${otpId}/withdraw`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    }),

  compareOffers: (token: string, saleId: string) =>
    apiRequest<OTPVersion[]>(`/sales/${saleId}/offers/compare`, { authToken: token }),

  // ── Deal Room ────────────────────────────────────────────────────────────
  sendDealRoomMessage: (token: string, saleId: string, payload: { content: string; threadType: 'legal' | 'financial' | 'general' | 'compliance'; recipientId?: string }) =>
    apiRequest<DealRoomMessage>(`/sales/${saleId}/deal-room/messages`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getDealRoomMessages: (token: string, saleId: string, threadType?: string) =>
    apiRequest<DealRoomMessage[]>(`/sales/${saleId}/deal-room/messages${threadType ? `?threadType=${threadType}` : ''}`, { authToken: token }),

  markDealRoomMessageRead: (token: string, saleId: string, messageId: string) =>
    apiRequest<void>(`/sales/${saleId}/deal-room/messages/${messageId}/read`, {
      method: 'PATCH',
      authToken: token,
    }),

  // ── Bond Application ─────────────────────────────────────────────────────
  createBondApplication: (token: string, saleId: string, payload: { bankName: string; loanAmount: number; applicationRef?: string }) =>
    apiRequest<BondApplication>(`/sales/${saleId}/bond-application`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  updateBondApplication: (token: string, saleId: string, appId: string, payload: Partial<BondApplication>) =>
    apiRequest<BondApplication>(`/sales/${saleId}/bond-application/${appId}/update`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getBondApplication: (token: string, saleId: string) =>
    apiRequest<BondApplication | null>(`/sales/${saleId}/bond-application`, { authToken: token }),

  // ── Compliance ───────────────────────────────────────────────────────────
  setComplianceRequirements: (token: string, saleId: string, payload: { requirements: Array<{ certType: string; dueDate?: string }> }) =>
    apiRequest<ComplianceStatus>(`/sales/${saleId}/compliance-requirements`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  updateComplianceStatus: (token: string, saleId: string, certType: string, payload: { status: string; notes?: string; fileUrl?: string; receivedDate?: string }) =>
    apiRequest<ComplianceItem>(`/sales/${saleId}/compliance/${certType}/status`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getComplianceStatus: (token: string, saleId: string) =>
    apiRequest<ComplianceStatus>(`/sales/${saleId}/compliance-status`, { authToken: token }),

  // ── Disbursement Instructions ────────────────────────────────────────────
  createDisbursementInstruction: (token: string, saleId: string, payload: { payee: string; payeeType: string; amount: number; currency?: string; bankDetails: object; purpose: string }) =>
    apiRequest<DisbursementInstruction>(`/sales/${saleId}/disbursement-instructions`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getDisbursementInstructions: (token: string, saleId: string) =>
    apiRequest<DisbursementInstruction[]>(`/sales/${saleId}/disbursement-instructions`, { authToken: token }),

  approveDisbursementInstruction: (token: string, saleId: string, instrId: string) =>
    apiRequest<DisbursementInstruction>(`/sales/${saleId}/disbursement-instructions/${instrId}/approve`, {
      method: 'PATCH',
      authToken: token,
    }),

  // ── Seller Disclosure ────────────────────────────────────────────────────
  createSellerDisclosure: (token: string, saleId: string, payload: { disclosureData: object }) =>
    apiRequest<SellerDisclosure>(`/sales/${saleId}/seller-disclosure`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getSellerDisclosure: (token: string, saleId: string) =>
    apiRequest<SellerDisclosure | null>(`/sales/${saleId}/seller-disclosure`, { authToken: token }),

  signSellerDisclosure: (token: string, saleId: string, payload?: { signatureData?: string }) =>
    apiRequest<SellerDisclosure>(`/sales/${saleId}/seller-disclosure/sign`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    }),

  // ── Post-Sale Checklist ──────────────────────────────────────────────────
  getPostSaleChecklist: (token: string, saleId: string) =>
    apiRequest<PostSaleChecklist>(`/sales/${saleId}/post-sale-checklist`, { authToken: token }),

  updatePostSaleChecklist: (token: string, saleId: string, payload: { items: Array<{ key: string; done: boolean }> }) =>
    apiRequest<PostSaleChecklist>(`/sales/${saleId}/post-sale-checklist`, {
      method: 'PATCH',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

// ─── Agent Sales Dashboard ──────────────────────────────────────────────────

export const agentSalesApi = {
  getSales: (token: string) =>
    apiRequest<{ data: unknown[]; total: number; page: number; limit: number }>('/agent/sales', { authToken: token })
      .then(r => r.data.map(mapSale)),
};

// ─── Conveyancer API ─────────────────────────────────────────────────────────

export type ConveyancerCase = {
  id: string;
  propertyAddress: string;
  buyer: string;
  seller: string;
  currentStage: number;
  stageName: string;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  priority: 'high' | 'medium' | 'low';
  daysOpen: number;
  purchasePrice: number;
  currency: string;
  sale?: Sale;
};

export const conveyancerApi = {
  getCases: (token: string) =>
    apiRequest<{ data: ConveyancerCase[]; total: number; page: number; limit: number }>('/conveyancer/cases', { authToken: token })
      .then(r => r.data),
};

// ─── Admin Sales Dashboard ──────────────────────────────────────────────────

export const adminSalesApi = {
  getSales: (token: string) =>
    apiRequest<{ data: unknown[]; total: number; page: number; limit: number }>('/admin/sales', { authToken: token })
      .then(r => r.data.map(mapSale)),
};

// ─── Sessions API (Sprint 02 Enhanced) ──────────────────────────────────────

export type UserSession = {
  id: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  current?: boolean;
};

export const sessionsApi = {
  getSessions: (token: string) =>
    apiRequest<UserSession[]>('/users/me/sessions', { authToken: token }),

  revokeAll: (token: string) =>
    apiRequest<void>('/users/me/sessions', {
      method: 'DELETE',
      authToken: token,
    }),

  revokeSession: (token: string, sessionId: string) =>
    apiRequest<void>(`/users/me/sessions/${sessionId}`, {
      method: 'DELETE',
      authToken: token,
    }),
};

// ─── Sprint 05: Escrow & Financial Ledger ───────────────────────────────────

export type EscrowAccount = {
  id: string;
  accountType: string;
  currency: string;
  saleId?: string | null;
  ownerId?: string | null;
  label?: string | null;
  status: string;
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  accountId: string;
  entryType: string;
  amount: number;
  currency: string;
  description?: string | null;
  reference?: string | null;
  createdAt: string;
};

export type EscrowReleaseRequest = {
  id: string;
  escrowAccountId: string;
  requestedBy: string;
  releaseAmount: number;
  currency: string;
  reason: string | null;
  /** Backend status values from ESCROW_RELEASE_STATUS constants */
  status: 'pending' | 'buyer_approved' | 'approved' | 'released' | 'rejected';
  buyerApprovedAt: string | null;
  adminApprovedAt: string | null;
  adminApproverId: string | null;
  releasedAt: string | null;
  mfaVerified: boolean;
  rejectionReason: string | null;
  /** Mapped from requestedAt on the backend */
  requestedAt: string;
};

export type PendingDeposit = {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
};

export type EscrowSummary = {
  account: EscrowAccount;
  balance: number;
  pendingReleases: EscrowReleaseRequest[];
  recentTransactions: LedgerEntry[];
  pendingDeposits: PendingDeposit[];
};

export type PaymentResult = {
  paymentRequestId: string;
  status: string;
  redirectUrl?: string | null;
  reference?: string | null;
};

export type FxRateResult = { from: string; to: string; rate: number };

export type CommissionBreakdown = {
  salePrice: number;
  currency: string;
  platformFee: number;
  platformFeePct: number;
  agentCommission: number;
  agentCommissionPct: number;
  total: number;
};

export const escrowApi = {
  /** POST /escrow/deposit — accepts { saleId, amount, currency, gateway } */
  initiateDeposit: (
    token: string,
    payload: { saleId: string; amount: number; currency: string; gateway: string; metadata?: Record<string, unknown> },
  ) =>
    apiRequest<PaymentResult>('/escrow/deposit', {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      // Map frontend `gateway` field → backend `paymentMethod`
      body: JSON.stringify({ saleId: payload.saleId, amount: payload.amount, currency: payload.currency, paymentMethod: payload.gateway }),
    }),

  /** GET /escrow/by-sale/:saleId — summary including recentTransactions */
  getSummary: (token: string, saleId: string) =>
    apiRequest<EscrowSummary>(`/escrow/by-sale/${saleId}`, { authToken: token }),

  /** POST /escrow/release/request — maps `amount` → `releaseAmount` */
  requestRelease: (
    token: string,
    payload: { escrowAccountId: string; amount: number; currency: string; reason: string; saleId?: string },
  ) =>
    apiRequest<EscrowReleaseRequest>('/escrow/release/request', {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escrowAccountId: payload.escrowAccountId,
        releaseAmount: payload.amount,
        currency: payload.currency,
        reason: payload.reason,
      }),
    }),

  /** POST /escrow/release/:releaseId/buyer-approve */
  approveRelease: (token: string, releaseId: string) =>
    apiRequest<EscrowReleaseRequest>(`/escrow/release/${releaseId}/buyer-approve`, {
      method: 'POST',
      authToken: token,
    }),

  /** GET /escrow/release/:releaseId */
  getRelease: (token: string, releaseId: string) =>
    apiRequest<EscrowReleaseRequest>(`/escrow/release/${releaseId}`, { authToken: token }),
};

export const financialApi = {
  createAccount: (
    token: string,
    payload: { accountType: string; currency: string; saleId?: string; ownerId?: string; label?: string },
  ) =>
    apiRequest<EscrowAccount>('/financial/accounts', {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  getAccount: (token: string, accountId: string) =>
    apiRequest<EscrowAccount & { balance: number }>(`/financial/accounts/${accountId}`, {
      authToken: token,
    }),

  getLedgerEntries: (token: string, accountId: string, params?: { page?: number; limit?: number }) => {
    const qs = params ? `?page=${params.page ?? 1}&limit=${params.limit ?? 20}` : '';
    return apiRequest<{ data: LedgerEntry[]; total: number }>(
      `/financial/ledger/${accountId}${qs}`,
      { authToken: token },
    );
  },

  getFxRate: (token: string, from: string, to: string) =>
    apiRequest<FxRateResult>(`/financial/fx/rate?from=${from}&to=${to}`, { authToken: token }),

  convertAmount: (
    token: string,
    payload: { amount: number; fromCurrency: string; toCurrency: string },
  ) =>
    apiRequest<{ result: number; rate: number; from: string; to: string }>('/financial/fx/convert', {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  calculateCommission: (
    token: string,
    payload: { salePrice: number; currency: string; agentId?: string },
  ) =>
    apiRequest<CommissionBreakdown>('/financial/commission/calculate', {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};

export type AdminPendingDeposit = PendingDeposit & {
  account: { id: string; referenceId: string | null; currency: string };
};

export type CompanyEscrowAccount = {
  id: string;
  accountNumber: string;
  accountType: string;
  referenceId: string | null;
  currency: string;
  status: string;
  createdAt: string;
  balance: number;
  recentTransactions: Array<{
    id: string;
    entryType: string;
    amount: number;
    currency: string;
    description: string | null;
    createdAt: string;
    debitAccountId: string;
    creditAccountId: string;
  }>;
};

export const adminFinanceApi = {
  /** GET /admin/finance/deposits/pending — list all unconfirmed deposits */
  getPendingDeposits: (token: string) =>
    apiRequest<AdminPendingDeposit[]>('/admin/finance/deposits/pending', { authToken: token }),

  /** GET /admin/finance/accounts/:id/balance */
  getBalance: (token: string, accountId: string) =>
    apiRequest<{ balance: number; accountId: string }>(
      `/admin/finance/accounts/${accountId}/balance`,
      { authToken: token },
    ),

  /** POST /admin/finance/deposit/confirm */
  confirmDeposit: (token: string, payload: { paymentRequestId: string; gatewayReference?: string; gatewayStatus?: string }) =>
    apiRequest<void>('/admin/finance/deposit/confirm', {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, gatewayReference: payload.gatewayReference ?? payload.paymentRequestId }),
    }),

  /** POST /admin/finance/release/:id/approve */
  approveRelease: (token: string, releaseId: string, notes?: string) =>
    apiRequest<EscrowReleaseRequest>(`/admin/finance/release/${releaseId}/approve`, {
      method: 'POST',
      authToken: token,
      headers: notes ? { 'Content-Type': 'application/json' } : undefined,
      body: notes ? JSON.stringify({ notes }) : undefined,
    }),

  /** POST /admin/finance/release/:id/reject */
  rejectRelease: (token: string, releaseId: string, reason: string) =>
    apiRequest<EscrowReleaseRequest>(`/admin/finance/release/${releaseId}/reject`, {
      method: 'POST',
      authToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }),

  /** GET /admin/finance/escrow-accounts — company escrow accounts with balances and recent transactions */
  getCompanyEscrowAccounts: (token: string) =>
    apiRequest<CompanyEscrowAccount[]>('/admin/finance/escrow-accounts', { authToken: token }),

  /** GET /admin/finance/releases — list release requests, optionally filtered by status */
  listReleases: (token: string, status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest<EscrowReleaseRequest[]>(`/admin/finance/releases${qs}`, { authToken: token });
  },
};
