'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { getAccessToken } from '@/lib/auth-session';

interface AuthenticatedShellProps {
  children: ReactNode;
}

const AUTH_EXEMPT_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/email-verification',
  '/oauth-connect',
  '/mfa-setup',
  '/mfa-verify',
  '/auth-flow',
  '/session-expired',
];

function isAuthExemptRoute(pathname: string): boolean {
  return AUTH_EXEMPT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(getAccessToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [pathname]);

  if (!isAuthenticated || isAuthExemptRoute(pathname)) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
}