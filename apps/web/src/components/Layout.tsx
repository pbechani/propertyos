'use client';

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateListing } from "@/components/CreateListing";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { getAccessToken } from "@/lib/auth-session";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const SIDEBAR_COLLAPSED_KEY = 'pribec.sidebar_collapsed';

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(Boolean(getAccessToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [pathname]);

  useEffect(() => {
    const savedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedValue === 'true' || savedValue === 'false') {
      setIsSidebarCollapsed(savedValue === 'true');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const isListingsRoute = pathname.startsWith('/app/listings');
  const isPropertyDetailRoute = pathname.startsWith('/app/property/');
  const shouldShowSidebar = isAuthenticated;
  const shouldShowToolbar = !isListingsRoute && !isPropertyDetailRoute;
  const shouldShowThemeToggle = !isListingsRoute;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 md:px-8 py-4">
          {!shouldShowToolbar ? (
            <div className="flex items-center">
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

              {/* Search */}
              <div className="flex-1 max-w-md">
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white hidden sm:flex"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Create Listing</span>
                </Button>
                <button
                  className="sm:hidden p-2 text-blue-600 hover:text-blue-700"
                  onClick={() => setShowCreateModal(true)}
                  aria-label="Create listing"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  aria-label="Open notifications"
                  className="relative p-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  <span
                    className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                    aria-label="Unread notifications"
                  />
                </button>
                {shouldShowThemeToggle && <ThemeToggle />}
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && <CreateListing onClose={() => setShowCreateModal(false)} />}

      {/* Notification Center */}
      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
