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

  it('returns null and clears session when the JWT is expired', () => {
    const expiredJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) - 60 });
    localStorage.setItem(ACCESS_KEY, expiredJwt);
    localStorage.setItem(USER_KEY, MOCK_USER);

    const result = getAccessToken();

    expect(result).toBeNull();
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
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

  it('returns null when there is no token', () => {
    localStorage.setItem(USER_KEY, MOCK_USER);
    expect(getStoredUser()).toBeNull();
  });

  it('returns null when the token is expired even if user data exists', () => {
    const expiredJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) - 1 });
    localStorage.setItem(ACCESS_KEY, expiredJwt);
    localStorage.setItem(USER_KEY, MOCK_USER);

    expect(getStoredUser()).toBeNull();
  });

  it('returns null when the token is a dev placeholder string', () => {
    localStorage.setItem(ACCESS_KEY, 'mock-token');
    localStorage.setItem(USER_KEY, MOCK_USER);

    expect(getStoredUser()).toBeNull();
  });

  it('returns the user when the token is valid', () => {
    const validJwt = makeJwt({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
    localStorage.setItem(ACCESS_KEY, validJwt);
    localStorage.setItem(USER_KEY, MOCK_USER);

    const user = getStoredUser();
    expect(user).not.toBeNull();
    expect(user?.firstName).toBe('Demo');
  });
});
