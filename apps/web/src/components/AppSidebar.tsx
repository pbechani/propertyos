'use client';

import Link from 'next/link';
import { Home, Building2, Shield, BarChart3, User, Menu, X } from 'lucide-react';

interface AppSidebarProps {
  pathname: string;
  isAuthenticated: boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (value: boolean) => void;
}

const navigation = [
  { name: 'Listings', href: '/app/listings', icon: Building2 },
  { name: 'Dashboard', href: '/app', icon: Home },
  { name: 'Agent Dashboard', href: '/app/agent', icon: User },
  { name: 'Safety', href: '/app/safety', icon: Shield },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
];

const quickLinks = [
  { name: 'Buyer View', href: '/buyer-workspace' },
  { name: 'Conveyancer View', href: '/conveyancer' },
  { name: 'Property Workspace', href: '/workspace/1' },
  { name: 'Escrow & Financial', href: '/escrow' },
  { name: 'Construction', href: '/construction' },
  { name: 'Marketplace', href: '/service-providers' },
  { name: 'BOQ Workspace', href: '/boq-workspace' },
  { name: 'Inspection & Verification', href: '/inspection-verification' },
  { name: 'Logistics & Delivery', href: '/logistics-delivery-marketplace' },
  { name: 'Risk & Analytics', href: '/risk-analytics' },
  { name: 'AI Design Studio', href: '/ai-design-studio' },
  { name: 'Property Lifecycle', href: '/property-lifecycle' },
  { name: 'Compare Properties', href: '/compare' },
];

function isActive(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname.startsWith(href);
}

export function AppSidebar({
  pathname,
  isAuthenticated,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  showMobileMenu,
  setShowMobileMenu,
}: AppSidebarProps) {
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <aside className={`hidden lg:flex bg-card border-r border-border flex-col transition-all ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className={`p-2 border-b border-border flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
          <Link
            href="/app/listings"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} text-foreground`}
            aria-label="Go to Listings"
            title="PropertyOS"
          >
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
              <Home className="w-4 h-4 text-white" />
            </div>
            {!isSidebarCollapsed && <span className="font-semibold text-sm">PropertyOS</span>}
          </Link>
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                isActive(pathname, item.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
              title={item.name}
            >
              <item.icon className="w-5 h-5" />
              {!isSidebarCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-border">
            <div className="mt-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>

      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between gap-2">
              <Link
                href="/app/listings"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-2 text-foreground"
                aria-label="Go to Listings"
              >
                <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm">PropertyOS</span>
              </Link>
              <button
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close navigation menu"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2" aria-label="Mobile main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(pathname, item.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <div className="mt-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
