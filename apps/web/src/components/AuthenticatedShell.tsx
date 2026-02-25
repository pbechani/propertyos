'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { getAccessToken, getSessionUpdatedEventName } from '@/lib/auth-session';
import { isAuthExemptRoute, shouldUseAuthenticatedShell } from '@/lib/route-policy';

interface AuthenticatedShellProps {
  children: ReactNode;
}

export default function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const sessionUpdatedEventName = getSessionUpdatedEventName();
    const syncAuth = () => setIsAuthenticated(Boolean(getAccessToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener(sessionUpdatedEventName, syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener(sessionUpdatedEventName, syncAuth);
    };
  }, [pathname]);

  if (!isAuthenticated || isAuthExemptRoute(pathname) || !shouldUseAuthenticatedShell(pathname)) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
}