'use client';

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingAssistant } from "@/components/FloatingAssistant";
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
        unreadCount={unreadCount}
        onNotificationsClick={() => setShowNotifications(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile-only header — hamburger to open sidebar drawer */}
        {isAuthenticated && (
          <header className="lg:hidden bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowMobileMenu(true)}
              aria-label="Open navigation menu"
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)' }}>PropertyOS</span>
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
