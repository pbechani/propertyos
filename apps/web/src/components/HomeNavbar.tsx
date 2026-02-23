'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authExtApi } from '@/lib/api-client';
import { clearAuthSession, getAccessToken, getRefreshToken, getStoredUser } from '@/lib/auth-session';
import type { AuthUser } from '@/lib/api-client';

export default function HomeNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginActive = pathname === '/login' || pathname === '/auth/login';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const syncSession = () => {
      setIsAuthenticated(Boolean(getAccessToken()));
      setCurrentUser(getStoredUser());
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinks = [
    { href: '/app/listings', label: 'Property Listings' },
    { href: '/contractor-supplier-marketplace', label: 'Service Providers' },
    { href: '/safety', label: 'Safety Center' },
  ];

  const initials = `${currentUser?.firstName?.[0] ?? ''}${currentUser?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-black" />
              </div>
              <span className="font-bold text-xl">PropertyOS</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`hidden md:inline-flex font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle className="border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white" />
            {!isAuthenticated ? (
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
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt="User avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
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