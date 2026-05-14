/**
 * Unit tests for getAccessToken() and getStoredUser() expiry/validity logic.
 */

import { getAccessToken, getStoredUser } from '../auth-session';

// ── helpers ────────────────────────────────────────────────────────────────

function base64url(obj: object): string {
  const json = JSON.stringify(obj);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeJwt(payload: object): string {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const body = base64url(payload);
  return `${header}.${body}.fake-signature`;
}

const ACCESS_KEY = 'pribec.access_token';
const REFRESH_KEY = 'pribec.refresh_token';
const USER_KEY = 'pribec.user';

const MOCK_USER = JSON.stringify({
  id: '1',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'Demo',
  roles: ['buyer'],
});

// ── getAccessToken ─────────────────────────────────────────────────────────

describe('getAccessToken()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no token is stored', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('returns null and clears session for a malformed / non-JWT token', () => {
    localStorage.setItem(ACCESS_KEY, 'mock-token');
    localStorage.setItem(USER_KEY, MOCK_USER);

    const result = getAccessToken();

    expect(result).toBeNull();
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('returns null for an expired JWT but does NOT destroy the refresh token', () => {
    const expiredJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) - 60 });
    localStorage.setItem(ACCESS_KEY, expiredJwt);
    localStorage.setItem(REFRESH_KEY, 'valid-refresh-token');
    localStorage.setItem(USER_KEY, MOCK_USER);

    const result = getAccessToken();

    expect(result).toBeNull();
    // Refresh token must survive so the API layer can rotate the access token.
    expect(localStorage.getItem(REFRESH_KEY)).toBe('valid-refresh-token');
    // User data must also survive.
    expect(localStorage.getItem(USER_KEY)).toBe(MOCK_USER);
  });

  it('returns the token when it has a valid exp in the future', () => {
    const validJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem(ACCESS_KEY, validJwt);

    expect(getAccessToken()).toBe(validJwt);
  });

  it('returns the token when it has no exp field (non-expiring service token)', () => {
    const noExpJwt = makeJwt({ sub: '1', roles: ['admin'] });
    localStorage.setItem(ACCESS_KEY, noExpJwt);

    expect(getAccessToken()).toBe(noExpJwt);
  });
});

// ── getStoredUser ──────────────────────────────────────────────────────────

describe('getStoredUser()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when there is no refresh token', () => {
    // Access token present but no refresh token → no live session.
    const validJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem(ACCESS_KEY, validJwt);
    localStorage.setItem(USER_KEY, MOCK_USER);
    expect(getStoredUser()).toBeNull();
  });

  it('returns user data when access token is expired but refresh token is present', () => {
    // This is the key case that was broken: navigating while access token has
    // just expired should not sign the user out — the refresh token is still valid.
    const expiredJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) - 1 });
    localStorage.setItem(ACCESS_KEY, expiredJwt);
    localStorage.setItem(REFRESH_KEY, 'valid-refresh-token');
    localStorage.setItem(USER_KEY, MOCK_USER);

    const user = getStoredUser();
    expect(user).not.toBeNull();
    expect(user?.firstName).toBe('Demo');
  });

  it('returns null when there is no refresh token (malformed access token)', () => {
    localStorage.setItem(ACCESS_KEY, 'mock-token');
    localStorage.setItem(USER_KEY, MOCK_USER);

    expect(getStoredUser()).toBeNull();
  });

  it('returns the user when the session is fully valid', () => {
    const validJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem(ACCESS_KEY, validJwt);
    localStorage.setItem(REFRESH_KEY, 'valid-refresh-token');
    localStorage.setItem(USER_KEY, MOCK_USER);

    const user = getStoredUser();
    expect(user).not.toBeNull();
    expect(user?.firstName).toBe('Demo');
  });
});
