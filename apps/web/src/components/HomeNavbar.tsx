'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
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
import { isAuthExemptRoute, shouldUseAuthenticatedShell } from '@/lib/route-policy';
import type { AuthUser } from '@/lib/api-client';

export default function HomeNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginActive = pathname === '/login' || pathname === '/auth/login';
  const isHomeRoute = pathname === '/';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

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
    { href: '/app/listings', label: 'Property Hub', compactLabel: 'Property Hub', matchMode: 'exact' as const },
    { href: '/properties/search', label: 'Rent', compactLabel: 'Rent', matchMode: 'exact' as const },
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

  if (shouldHideForAuthenticatedRoute) {
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
    router.push('/');
  };

  return (
    <nav className="bg-black text-white sticky top-0 z-50 border-b border-gray-800">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <HomeIcon suppressHydrationWarning className="w-6 h-6 text-black" />
              </div>
              <span className="font-bold text-xl">PropertyOS</span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center justify-center gap-3 md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href, link.matchMode) ? 'page' : undefined}
                className={`font-medium transition-colors ${
                  isActive(link.href, link.matchMode)
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span className="sm:inline md:hidden">{link.compactLabel}</span>
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 md:gap-6">
            <ThemeToggle className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white" />
            {!showAuthenticatedUserMenu ? (
              <Button
                variant="ghost"
                className={isLoginActive ? 'text-white bg-gray-800' : 'text-white hover:bg-gray-800'}
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-9 h-9 rounded-full bg-white/15 border border-white/20 overflow-hidden flex items-center justify-center text-sm font-semibold hover:bg-white/20 transition-colors"
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