'use client';

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { UserAvatarContent } from "@/components/UserAvatarContent";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authExtApi, notificationsApi, type AuthUser } from "@/lib/api-client";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getSessionUpdatedEventName,
  getStoredUser,
  getActiveCompanyContext,
  getUserCompanies,
} from "@/lib/auth-session";
import type { CompanyContext } from "@/lib/api-client";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeCompany, setActiveCompany] = useState<CompanyContext | null>(null);
  const [hasMultipleCompanies, setHasMultipleCompanies] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const SIDEBAR_COLLAPSED_KEY = 'pribec.sidebar_collapsed';

  useEffect(() => {
    const sessionUpdatedEventName = getSessionUpdatedEventName();
    const syncAuth = () => {
      setIsAuthenticated(Boolean(getAccessToken()));
      setCurrentUser(getStoredUser());
      setActiveCompany(getActiveCompanyContext());
      setHasMultipleCompanies((getUserCompanies()?.length ?? 0) > 1);
    };
    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener(sessionUpdatedEventName, syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener(sessionUpdatedEventName, syncAuth);
    };
  }, [pathname]);

  // Poll unread notification count (refresh on tab change and when bell is closed)
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setUnreadCount(0); return; }
    notificationsApi.getAll(token)
      .then((ns) => setUnreadCount(ns.filter((n) => !n.read_at).length))
      .catch(() => undefined);
  }, [isAuthenticated, showNotifications, pathname]);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedValue === 'true' || savedValue === 'false') {
      setIsSidebarCollapsed(savedValue === 'true');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

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

  const isPropertyDetailRoute = pathname.startsWith('/app/property/');
  const shouldShowSidebar = isAuthenticated;
  const shouldShowToolbar = !isPropertyDetailRoute;
  const shouldShowThemeToggle = true;
  const shouldShowHeader = true;
  const initials = `${currentUser?.firstName?.[0] ?? ''}${currentUser?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  const fullName = `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim() || 'User';

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        currentUser={currentUser}
        activeCompany={activeCompany}
        hasMultipleCompanies={hasMultipleCompanies}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {shouldShowHeader && (
          <header className="bg-card border-b border-border px-4 md:px-8 py-4">
            {!shouldShowToolbar ? (
              <div className="flex items-center justify-between w-full">
                {shouldShowSidebar && (
                  <button
                    onClick={() => setShowMobileMenu(true)}
                    aria-label="Open navigation menu"
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  {isAuthenticated && (
                    <button
                      aria-label="Open notifications"
                      className="relative p-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNotifications(true)}
                    >
                      <Bell className="w-5 h-5" aria-hidden="true" />
                      {unreadCount > 0 && (
                        <span
                          className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                          aria-label={`${unreadCount} unread notifications`}
                        />
                      )}
                    </button>
                  )}
                  {shouldShowThemeToggle && <ThemeToggle />}
                  {isAuthenticated && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center text-sm font-semibold hover:bg-accent transition-colors"
                          aria-label="Open user menu"
                          title={fullName}
                        >
                          <UserAvatarContent avatarUrl={currentUser?.avatarUrl} initials={initials} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild>
                          <Link href="/profile-dashboard">View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                {/* Mobile Menu Button */}
                <div className="flex items-center gap-2">
                  {shouldShowSidebar && (
                    <button
                      onClick={() => setShowMobileMenu(true)}
                      aria-label="Open navigation menu"
                      className="lg:hidden text-muted-foreground hover:text-foreground"
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                  <button
                    aria-label="Open notifications"
                    className="relative p-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNotifications(true)}
                  >
                    <Bell className="w-5 h-5" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                        aria-label={`${unreadCount} unread notifications`}
                      />
                    )}
                  </button>
                  {shouldShowThemeToggle && <ThemeToggle />}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center text-sm font-semibold hover:bg-accent transition-colors"
                        aria-label="Open user menu"
                        title={fullName}
                      >
                        <UserAvatarContent avatarUrl={currentUser?.avatarUrl} initials={initials} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href="/profile-dashboard">View Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Notification Center */}
      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}

      {/* Floating AI Assistant — available on all authenticated pages */}
      {isAuthenticated && <FloatingAssistant />}
    </div>
  );
}
