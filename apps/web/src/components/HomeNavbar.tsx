'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const BT = {
  parchment: '#F2E8D5',
  cream: '#EAD9C4',
  forest: '#1A3C28',
  terracotta: '#C4562A',
  carbon: '#0C0D10',
};
import { Button } from '@/components/ui/button';

import { UserAvatarContent } from '@/components/UserAvatarContent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authExtApi } from '@/lib/api-client';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getSessionUpdatedEventName,
  getStoredUser,
} from '@/lib/auth-session';
import { isAuthExemptRoute, isNoNavbarRoute, shouldUseAuthenticatedShell } from '@/lib/route-policy';
import type { AuthUser } from '@/lib/api-client';

export default function HomeNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginActive = pathname === '/login' || pathname === '/auth/login';
  const isHomeRoute = pathname === '/';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sessionUpdatedEventName = getSessionUpdatedEventName();
    const syncSession = () => {
      setIsAuthenticated(Boolean(getAccessToken()));
      setCurrentUser(getStoredUser());
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    window.addEventListener(sessionUpdatedEventName, syncSession);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener(sessionUpdatedEventName, syncSession);
    };
  }, [pathname]);

  const navLinks = [
    { href: '/listings', label: 'Listings', compactLabel: 'Listings', matchMode: 'exact' as const },
    { href: '/service-providers', label: 'Service Providers', compactLabel: 'Providers', matchMode: 'exact' as const },
    { href: '/construction', label: 'Project Management', compactLabel: 'Projects', matchMode: 'exact' as const },
    { href: '/properties', label: 'Marketplace', compactLabel: 'Market', matchMode: 'exact' as const },
  ];

  const isActive = (href: string, matchMode: 'exact' | 'prefix' = 'prefix') => {
    if (href === '/') return pathname === '/';
    if (matchMode === 'exact') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const initials = `${currentUser?.firstName?.[0] ?? ''}${currentUser?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  const isExemptRoute = isAuthExemptRoute(pathname);
  const shouldTreatAsPublicNavbar = isHomeRoute;
  const shouldHideForAuthenticatedRoute =
    isAuthenticated &&
    !isExemptRoute &&
    !shouldTreatAsPublicNavbar &&
    shouldUseAuthenticatedShell(pathname);

  const showAuthenticatedUserMenu = isAuthenticated && !shouldTreatAsPublicNavbar;

  if (shouldHideForAuthenticatedRoute || isNoNavbarRoute(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (accessToken && refreshToken) {
      try {
        await authExtApi.logout(accessToken, refreshToken);
      } catch {
        // Continue local sign-out even if API logout fails.
      }
    }

    clearAuthSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    window.location.href = '/';
  };

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-200"
      style={{
        background: scrolled ? `${BT.parchment}F0` : BT.parchment,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${scrolled ? BT.cream : BT.cream}`,
      }}
    >
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3">
              <span
                className="font-bold text-2xl tracking-tight"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  color: BT.forest,
                  letterSpacing: '-0.01em',
                }}
              >
                BuildTrust
              </span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center justify-center gap-3 md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href, link.matchMode) ? 'page' : undefined}
                className="font-medium transition-colors text-sm"
                style={{
                  color: isActive(link.href, link.matchMode) ? BT.forest : `${BT.forest}80`,
                  fontFamily: 'var(--font-jakarta)',
                }}
              >
                <span className="sm:inline md:hidden">{link.compactLabel}</span>
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 md:gap-6">
            {!showAuthenticatedUserMenu ? (
              <Button
                variant="ghost"
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                style={{
                  color: BT.parchment,
                  background: isLoginActive ? BT.forest : BT.forest,
                  fontFamily: 'var(--font-jakarta)',
                }}
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold transition-colors"
                  style={{ background: BT.forest, color: BT.parchment, border: `2px solid ${BT.cream}` }}
                    aria-label="Open user menu"
                    title={`${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim() || 'User'}
                  >
                    <UserAvatarContent avatarUrl={currentUser?.avatarUrl} initials={initials} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href="/profile-dashboard">View Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}