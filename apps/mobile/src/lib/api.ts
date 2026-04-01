const API_BASE = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

// ── Token storage helpers (async – backed by expo-secure-store) ──────────────

import { secureDelete, secureGet, secureSet } from './storage';

const STORAGE_KEYS = {
  accessToken: 'mob_access_token',
  refreshToken: 'mob_refresh_token',
} as const;

// In-memory cache so synchronous callers that already awaited once don't block
let _cachedAccessToken: string | null = null;
let _cachedRefreshToken: string | null = null;

export async function getAccessToken(): Promise<string | null> {
  if (_cachedAccessToken !== null) return _cachedAccessToken;
  _cachedAccessToken = await secureGet(STORAGE_KEYS.accessToken);
  return _cachedAccessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  if (_cachedRefreshToken !== null) return _cachedRefreshToken;
  _cachedRefreshToken = await secureGet(STORAGE_KEYS.refreshToken);
  return _cachedRefreshToken;
}

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  _cachedAccessToken = accessToken;
  _cachedRefreshToken = refreshToken;
  await secureSet(STORAGE_KEYS.accessToken, accessToken);
  await secureSet(STORAGE_KEYS.refreshToken, refreshToken);
}

export async function clearTokens(): Promise<void> {
  _cachedAccessToken = null;
  _cachedRefreshToken = null;
  await secureDelete(STORAGE_KEYS.accessToken);
  await secureDelete(STORAGE_KEYS.refreshToken);
}

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Token refresh logic ───────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return null;
    }
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    await storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (token: string | null) => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  };

  let res = await makeRequest(await getAccessToken());

  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (!newToken) throw new ApiError(401, 'Session expired. Please log in again.');
    res = await makeRequest(newToken);
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else {
        message = body.message ?? message;
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  roles: string[];
  kyc_status?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  /** Maps to API role: 'homeowner' → 'buyer', 'contractor' → 'contractor' */
  role?: string;
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterData) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken: string) =>
    apiFetch<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ── Jobs API ──────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  reference: string;
  clientId: string;
  title: string;
  description?: string | null;
  category: string;
  locationLabel?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency: string;
  isUrgent: boolean;
  mediaUrls: string[];
  status: string;
  assignedContractorId?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  createdAt: string;
  _count?: { quotes: number };
}

export interface JobQuote {
  id: string;
  jobId: string;
  contractorId: string;
  price: number;
  laborAmount?: number | null;
  materialsAmount?: number | null;
  breakdown: Array<{ label: string; amount: number }>;
  timelineDays?: number | null;
  message?: string | null;
  status: string;
  submittedAt: string;
}

export interface JobMilestone {
  id: string;
  jobId: string;
  title: string;
  description?: string | null;
  amount: number;
  dueDate?: string | null;
  status: string;
  mediaUrls: string[];
  createdAt: string;
}

export interface JobMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: string[];
  readBy: string[];
  createdAt: string;
}

export interface CreateJobPayload {
  title: string;
  description?: string;
  category: string;
  locationLat?: number;
  locationLng?: number;
  locationLabel?: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  isUrgent?: boolean;
  mediaUrls?: string[];
  scheduledStart?: string;
  scheduledEnd?: string;
}

export const jobsApi = {
  create: (data: CreateJobPayload) =>
    apiFetch<Job>('/jobs', { method: 'POST', body: JSON.stringify(data) }),

  publish: (jobId: string) =>
    apiFetch<Job>(`/jobs/${jobId}/publish`, { method: 'POST' }),

  list: (params?: Record<string, string | number | boolean | undefined>) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return apiFetch<Job[]>(`/jobs${qs}`);
  },

  myJobs: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return apiFetch<Job[]>(`/jobs/my${qs}`);
  },

  assignedJobs: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return apiFetch<Job[]>(`/jobs/assigned${qs}`);
  },

  feed: (params?: {
    category?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    limit?: number;
    offset?: number;
  }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return apiFetch<Job[]>(`/jobs/feed${qs}`);
  },

  getById: (jobId: string) => apiFetch<Job>(`/jobs/${jobId}`),

  cancel: (jobId: string) =>
    apiFetch<Job>(`/jobs/${jobId}/cancel`, { method: 'POST' }),

  start: (jobId: string) =>
    apiFetch<Job>(`/jobs/${jobId}/start`, { method: 'POST' }),

  complete: (jobId: string) =>
    apiFetch<Job>(`/jobs/${jobId}/complete`, { method: 'POST' }),

  // Quotes
  submitQuote: (jobId: string, data: {
    price: number;
    laborAmount?: number;
    materialsAmount?: number;
    breakdown?: Array<{ label: string; amount: number }>;
    timelineDays?: number;
    message?: string;
  }) =>
    apiFetch<JobQuote>(`/jobs/${jobId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listQuotes: (jobId: string) =>
    apiFetch<JobQuote[]>(`/jobs/${jobId}/quotes`),

  respondToQuote: (jobId: string, quoteId: string, decision: 'ACCEPTED' | 'REJECTED') =>
    apiFetch<JobQuote>(`/jobs/${jobId}/quotes/${quoteId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),

  // Milestones
  createMilestone: (jobId: string, data: {
    title: string;
    description?: string;
    amount: number;
    dueDate?: string;
  }) =>
    apiFetch<JobMilestone>(`/jobs/${jobId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listMilestones: (jobId: string) =>
    apiFetch<JobMilestone[]>(`/jobs/${jobId}/milestones`),

  updateMilestoneStatus: (
    jobId: string,
    milestoneId: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED',
    mediaUrls?: string[],
  ) =>
    apiFetch<JobMilestone>(`/jobs/${jobId}/milestones/${milestoneId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, mediaUrls }),
    }),

  // Messaging
  sendMessage: (jobId: string, content: string, attachments?: string[]) =>
    apiFetch<JobMessage>(`/jobs/${jobId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    }),

  getMessages: (jobId: string, params?: { limit?: number; before?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return apiFetch<JobMessage[]>(`/jobs/${jobId}/messages${qs}`);
  },

  markRead: (jobId: string, messageIds: string[]) =>
    apiFetch<{ updated: number }>(`/jobs/${jobId}/messages/read`, {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    }),
};
