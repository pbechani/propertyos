'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { getRefreshToken, getSessionUpdatedEventName } from '@/lib/auth-session';
import { isAuthExemptRoute, isPublicShellRoute, shouldUseAuthenticatedShell } from '@/lib/route-policy';

interface AuthenticatedShellProps {
  children: ReactNode;
}

export default function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  // null = not yet read from storage (hydrating), true/false = known auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const sessionUpdatedEventName = getSessionUpdatedEventName();
    // Use refresh token as the "session alive" signal. The access token may be expired
    // and awaiting rotation — that's handled by the API layer, not here.
    const syncAuth = () => setIsAuthenticated(Boolean(getRefreshToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener(sessionUpdatedEventName, syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener(sessionUpdatedEventName, syncAuth);
    };
  }, [pathname]);

  // Redirect unauthenticated users away from protected routes (including after logout).
  // Public shell routes (e.g. /app/listings) are exempt — they are browseable anonymously.
  useEffect(() => {
    if (
      isAuthenticated === false &&
      shouldUseAuthenticatedShell(pathname) &&
      !isAuthExemptRoute(pathname) &&
      !isPublicShellRoute(pathname)
    ) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, pathname, router]);

  // Still hydrating — render nothing on protected routes to prevent content flash.
  // Public shell routes are shown immediately (no token needed).
  if (isAuthenticated === null) {
    return shouldUseAuthenticatedShell(pathname) && !isPublicShellRoute(pathname)
      ? null
      : <>{children}</>;
  }

  if (!isAuthenticated || isAuthExemptRoute(pathname) || !shouldUseAuthenticatedShell(pathname)) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
}