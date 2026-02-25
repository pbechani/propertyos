'use client';

import type { AuthResponse, AuthTokens, AuthUser } from './api-client';

const ACCESS_TOKEN_KEY = 'pribec.access_token';
const REFRESH_TOKEN_KEY = 'pribec.refresh_token';
const USER_KEY = 'pribec.user';
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
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
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
