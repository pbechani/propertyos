import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  authApi,
  AuthUser,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  RegisterData,
  storeTokens,
} from '../lib/api';
import { Buffer } from 'buffer';

// ── Role mapping ──────────────────────────────────────────────────────────────
// Mobile app uses 'homeowner' / 'contractor' UI roles.
// API roles are open-ended strings (e.g. 'buyer', 'contractor', 'agent').
// We map from API roles to mobile roles here.

export type MobileRole = 'homeowner' | 'contractor';

function deriveMobileRole(roles: string[]): MobileRole {
  if (roles.includes('contractor')) return 'contractor';
  return 'homeowner';
}

// ── Context types ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  mobileRole: MobileRole;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ user: AuthUser; mobileRole: MobileRole }>;
  register: (
    data: RegisterData & { mobileRole?: MobileRole },
  ) => Promise<{ user: AuthUser; mobileRole: MobileRole }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobileRole, setMobileRole] = useState<MobileRole>('homeowner');
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored JWT on mount
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      setIsLoading(true);
      const token = await getAccessToken();
      if (cancelled) return;
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [, payloadB64] = token.split('.');
        // React Native does not have window.atob; use Buffer from the 'buffer' package
        const json = Buffer.from(payloadB64, 'base64').toString('utf-8');
        const decoded = JSON.parse(json) as {
          sub: string;
          email: string;
          firstName?: string;
          lastName?: string;
          roles?: string[];
          kyc_status?: string;
          exp?: number;
        };

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          await clearTokens();
        } else {
          const restoredUser: AuthUser = {
            id: decoded.sub,
            email: decoded.email,
            firstName: decoded.firstName ?? '',
            lastName: decoded.lastName ?? '',
            roles: decoded.roles ?? [],
            kyc_status: decoded.kyc_status ?? null,
          };
          if (!cancelled) {
            setUser(restoredUser);
            setMobileRole(deriveMobileRole(restoredUser.roles));
          }
        }
      } catch {
        await clearTokens();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restore();
    return () => { cancelled = true; };
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ user: AuthUser; mobileRole: MobileRole }> => {
    const res = await authApi.login(email, password);
    await storeTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    const role = deriveMobileRole(res.user.roles);
    setMobileRole(role);
    return { user: res.user, mobileRole: role };
  };

  const register = async (
    data: RegisterData & { mobileRole?: MobileRole },
  ): Promise<{ user: AuthUser; mobileRole: MobileRole }> => {
    // Map mobile role to API role; 'homeowner' → 'buyer', 'contractor' stays 'contractor'
    const apiRole = data.mobileRole === 'contractor' ? 'contractor' : 'buyer';
    const res = await authApi.register({ ...data, role: apiRole });
    await storeTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    const role = deriveMobileRole(res.user.roles);
    setMobileRole(role);
    return { user: res.user, mobileRole: role };
  };

  const logout = async (): Promise<void> => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Clear locally regardless
      }
    }
    await clearTokens();
    setUser(null);
    setMobileRole('homeowner');
  };

  const forgotPassword = async (email: string): Promise<void> => {
    await authApi.forgotPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{ user, mobileRole, isLoading, login, register, logout, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
