'use client';

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2, Shield, BarChart3, Bell, Plus, Settings, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateListing } from "@/components/CreateListing";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/app", icon: Home },
    { name: "Agent Dashboard", href: "/app/agent", icon: User },
    { name: "Listings", href: "/app/listings", icon: Building2 },
    { name: "Safety", href: "/app/safety", icon: Shield },
    { name: "Analytics", href: "/app/analytics", icon: BarChart3 },
  ];

  const quickLinks = [
    { name: "Buyer View", href: "/buyer-workspace" },
    { name: "Conveyancer View", href: "/conveyancer" },
    { name: "Property Workspace", href: "/workspace/1" },
    { name: "Escrow & Financial", href: "/escrow" },
    { name: "Construction", href: "/construction" },
    { name: "Marketplace", href: "/contractor-supplier-marketplace" },
    { name: "BOQ Workspace", href: "/boq-workspace" },
    { name: "Inspection & Verification", href: "/inspection-verification" },
    { name: "Logistics & Delivery", href: "/logistics-delivery-marketplace" },
    { name: "Risk & Analytics", href: "/risk-analytics" },
    { name: "AI Design Studio", href: "/ai-design-studio" },
    { name: "Property Lifecycle", href: "/property-lifecycle" },
    { name: "Compare Properties", href: "/compare" },
  ];

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-lg">PRIBEC</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-600"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Marcus Sterling</div>
              <div className="text-xs text-muted-foreground">Senior Agent</div>
            </div>
            <button
              aria-label="Open settings"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
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

      {/* Mobile Sidebar Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-lg">PRIBEC</span>
              </Link>
              <button
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close navigation menu"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2" aria-label="Mobile main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setShowMobileMenu(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-600"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Marcus Sterling</div>
                  <div className="text-xs text-muted-foreground">Senior Agent</div>
                </div>
                <button
                  aria-label="Open settings"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              aria-label="Open navigation menu"
              aria-expanded={showMobileMenu}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>

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
              <ThemeToggle />
            </div>
          </div>
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
