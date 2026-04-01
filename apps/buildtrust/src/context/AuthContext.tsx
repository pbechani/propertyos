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

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored access token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const [, payloadB64] = token.split('.');
      const decoded = JSON.parse(atob(payloadB64));
      // Check expiry before trusting stored token
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        clearTokens();
      } else {
        setUser({
          id: decoded.sub as string,
          email: decoded.email as string,
          firstName: (decoded.firstName ?? '') as string,
          lastName: (decoded.lastName ?? '') as string,
          roles: (decoded.roles ?? []) as string[],
          kyc_status: (decoded.kyc_status ?? null) as string | null,
        });
      }
    } catch {
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await authApi.login(email, password);
    storeTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: RegisterData): Promise<AuthUser> => {
    const res = await authApi.register(data);
    storeTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
    return res.user;
  };

  const logout = async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Clear locally regardless of server response
      }
    }
    clearTokens();
    setUser(null);
  };

  const forgotPassword = async (email: string): Promise<void> => {
    await authApi.forgotPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
