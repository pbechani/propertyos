'use client';

import type { AuthResponse, AuthTokens, AuthUser, CompanyContext } from './api-client';

const ACCESS_TOKEN_KEY = 'pribec.access_token';
const REFRESH_TOKEN_KEY = 'pribec.refresh_token';
const USER_KEY = 'pribec.user';
const PENDING_COMPANIES_KEY = 'pribec.pending_companies';
const USER_COMPANIES_KEY = 'pribec.user_companies';
const ACTIVE_COMPANY_KEY = 'pribec.active_company';
const SESSION_UPDATED_EVENT = 'pribec:session-updated';

type JwtPayload = {
  sub?: string;
  roles?: string[];
  email?: string;
  kyc_status?: string | null;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payloadBase64] = token.split('.');
    if (!payloadBase64) {
      return null;
    }

    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function saveAuthSession(response: AuthResponse): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, response.tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(response.user));

  // Store pending companies for the context-selection screen
  if (response.requires_context_selection && response.companies?.length) {
    sessionStorage.setItem(PENDING_COMPANIES_KEY, JSON.stringify(response.companies));
    // Also persist the full list to localStorage so the sidebar knows the user
    // has multiple companies even after context selection clears the pending list.
    localStorage.setItem(USER_COMPANIES_KEY, JSON.stringify(response.companies));
  } else {
    sessionStorage.removeItem(PENDING_COMPANIES_KEY);
  }

  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_COMPANIES_KEY);
  localStorage.removeItem(ACTIVE_COMPANY_KEY);
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

/** Returns all companies the user belongs to, or null if only one / unknown. */
export function getUserCompanies(): CompanyContext[] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_COMPANIES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompanyContext[];
  } catch {
    return null;
  }
}

/** Persist the active company context after context selection. */
export function saveActiveCompanyContext(company: CompanyContext): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_COMPANY_KEY, JSON.stringify(company));
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

/** Returns the active company context, or null if not yet selected. */
export function getActiveCompanyContext(): CompanyContext | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ACTIVE_COMPANY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompanyContext;
  } catch {
    return null;
  }
}

export function updateStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function getSessionUpdatedEventName(): string {
  return SESSION_UPDATED_EVENT;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getSessionClaims(): JwtPayload | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  return decodeJwtPayload(token);
}

export function getPrimaryRole(): string | null {
  const claims = getSessionClaims();
  return claims?.roles?.[0] ?? null;
}

export function getAuthTokens(): AuthTokens | null {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: '',
    refreshTokenExpiresIn: '',
  };
}

/** Returns the companies list stored during a multi-company login, or null. */
export function getPendingCompanies(): CompanyContext[] | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_COMPANIES_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompanyContext[];
  } catch {
    return null;
  }
}

/** Replace the stored access/refresh tokens after context selection and clear pending companies. */
export function saveSelectedContextTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  sessionStorage.removeItem(PENDING_COMPANIES_KEY);
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

/** Persist a fresh companies list (e.g. after re-fetching from the API). */
export function saveUserCompanies(companies: CompanyContext[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_COMPANIES_KEY, JSON.stringify(companies));
}

/** Update the pending companies in sessionStorage (e.g. after a fresh getContexts call refreshes logos). */
export function savePendingCompanies(companies: CompanyContext[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PENDING_COMPANIES_KEY, JSON.stringify(companies));
}
