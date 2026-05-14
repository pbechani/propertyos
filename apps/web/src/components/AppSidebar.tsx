'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, Building2, Shield, BarChart3, User, Menu, X, LayoutDashboard, ChevronDown, ArrowLeftRight, Users, ClipboardList, Briefcase, Activity, UserX, Settings, Gauge, Target, Kanban, Brain, History, DollarSign, Scale, FileText, Calendar, ShieldCheck, ShieldAlert, HardHat, DoorOpen, Bell } from 'lucide-react';
import type { AuthUser, CompanyContext } from '@/lib/api-client';
import { getIsPlatformAdminFromToken } from '@/lib/auth-session';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { UserAvatarContent } from '@/components/UserAvatarContent';

interface AppSidebarProps {
  pathname: string;
  isAuthenticated: boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (value: boolean) => void;
  currentUser?: AuthUser | null;
  activeCompany?: CompanyContext | null;
  hasMultipleCompanies?: boolean;
  unreadCount?: number;
  onNotificationsClick?: () => void;
  onLogout?: () => void;
}

/** Navigation shown for the platform admin (role = 'admin') under Platform Admin Cockpit. */
const platformAdminNavigation = [
  { name: 'Overview', href: '/app/admin', icon: LayoutDashboard },
  { name: 'Companies', href: '/app/admin/companies', icon: Building2 },
  { name: 'KYC Queue', href: '/app/admin/kyc', icon: ShieldCheck },
  { name: 'Users', href: '/app/admin/users', icon: Users },
  { name: 'Platform Finance', href: '/app/admin/finance', icon: DollarSign },
  { name: 'Fraud Reports', href: '/app/admin/fraud-reports', icon: ShieldAlert },
  { name: 'Audit Logs', href: '/app/admin/audit', icon: ClipboardList },
  { name: 'AI Command Center', href: '/admin/ai-command-center', icon: Brain },
];

/** Navigation shown for the conveyancer role under Conveyancer Cockpit. */
const conveyancerNavigation = [
  { name: 'Command Center', href: '/app/conveyancer/command-center', icon: Gauge },
  { name: 'Cases', href: '/app/conveyancer/cases', icon: Briefcase },
  { name: 'Clients', href: '/app/conveyancer/clients', icon: Users },
  { name: 'Properties', href: '/app/conveyancer/properties', icon: Building2 },
  { name: 'Documents', href: '/app/conveyancer/documents', icon: FileText },
  { name: 'Financials', href: '/app/conveyancer/financials', icon: DollarSign },
  { name: 'Reports', href: '/app/conveyancer/reports', icon: BarChart3 },
  { name: 'Calendar', href: '/app/conveyancer/calendar', icon: Calendar },
  { name: 'Settings', href: '/app/conveyancer/settings', icon: Settings },
];

/** Navigation shown when the active company is the built-in "Self" personal context. */
const selfNavigation = [
  { name: 'My Dashboard', href: '/app/my-dashboard', icon: LayoutDashboard },
  { name: 'My Listings', href: '/app/my-listings', icon: ClipboardList },
  { name: 'Listings', href: '/app/listings', icon: Building2 },
  { name: 'My Sales', href: '/app/sales', icon: Kanban },
  { name: 'Service Providers', href: '/service-providers', icon: Users },
  { name: 'Construction', href: '/construction', icon: HardHat },
  { name: 'Safety', href: '/app/safety', icon: Shield },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Company Registration', href: '/app/my-companies', icon: Briefcase },
  { name: 'Sessions', href: '/app/sessions', icon: History },
];

/** Navigation shown when the active user's role is 'agent'. */
const agentNavigation = [
  { name: 'Agent Dashboard', href: '/app/agent', icon: User },
  { name: 'My Listings', href: '/app/my-listings', icon: ClipboardList },
  { name: 'Listings', href: '/app/listings', icon: Building2 },
  { name: 'My Sales', href: '/app/sales', icon: Kanban },
  { name: 'Safety', href: '/app/safety', icon: Shield },
];

/** Sub-navigation nested under My Listings. */
const myListingsNavigation = [
  { name: 'Dashboard', href: '/app/my-listings', icon: LayoutDashboard },
  { name: 'Calendar', href: '/app/my-listings/calendar', icon: Calendar },
  { name: 'Reports', href: '/app/my-listings/reports', icon: BarChart3 },
  { name: 'Settings', href: '/app/my-listings/settings', icon: Settings },
];



/** Navigation shown when the user is operating under a real company context (non-admin, non-agent). */
const companyNavigation = [
  { name: 'Company Overview', href: '/app/my-dashboard', icon: LayoutDashboard },
  { name: 'Listings', href: '/app/listings', icon: Building2 },
  { name: 'Home', href: '/app', icon: Home },
  { name: 'Safety', href: '/app/safety', icon: Shield },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
];

/** Navigation shown when the user is a company admin. */
const adminCompanyNavigation = [
  { name: 'Company Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
  { name: 'Company Profile', href: '/company/profile', icon: Building2 },
  { name: 'User Management', href: '/company/users', icon: Users },
  { name: 'Permissions', href: '/company/permissions', icon: Shield },
  { name: 'Activity Logs', href: '/company/activities', icon: Activity },
  { name: 'Revoked Users', href: '/company/revoked-pool', icon: UserX },
  { name: 'Escrow & Finance', href: '/admin/finance', icon: DollarSign },
  { name: 'AI Command Center', href: '/admin/ai-command-center', icon: Brain },
];

function isActive(pathname: string, href: string) {
  // Exact-match roots to prevent parent paths from always staying active
  if (href === '/app') return pathname === '/app';
  if (href === '/app/admin') return pathname === '/app/admin';
  if (href === '/app/my-listings') return pathname === '/app/my-listings';
  return pathname.startsWith(href);
}

export function AppSidebar({
  pathname,
  isAuthenticated,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  showMobileMenu,
  setShowMobileMenu,
  currentUser,
  activeCompany,
  hasMultipleCompanies = false,
  unreadCount = 0,
  onNotificationsClick,
  onLogout,
}: AppSidebarProps) {
  const initials = `${currentUser?.firstName?.[0] ?? ''}${currentUser?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  const fullName = `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim() || 'User';
  const router = useRouter();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showAdminGroup, setShowAdminGroup] = useState(true);
  const [showPlatformAdminCockpit, setShowPlatformAdminCockpit] = useState(true);
  const [showAgentCockpit, setShowAgentCockpit] = useState(true);
  const [showConveyancerCockpit, setShowConveyancerCockpit] = useState(true);
  const [showMyListings, setShowMyListings] = useState(true);

  const companyName = activeCompany?.name ?? currentUser?.companyName ?? null;
  const companyRole = activeCompany?.role ?? currentUser?.role ?? null;
  // isPlatformAdmin is TRUE only for the system-level admin (JWT roles includes 'admin').
  // getIsAdminFromToken() checks active_company_is_admin, which is also true for any
  // company-level admin — we must NOT use that for the platform admin gate.
  const isPlatformAdmin = getIsPlatformAdminFromToken();
  const isAdmin =
    isPlatformAdmin ||
    (activeCompany?.slug !== 'self' && (activeCompany?.is_admin ?? false));
  const companyLogoUrl = activeCompany?.logo_url ?? null;
  // Only show role badge when the role is not 'admin' — the amber Admin badge already covers that case
  const showRoleBadge = companyRole && companyRole.toLowerCase() !== 'admin';
  // An admin is *never* in the self-company context (the self company always has is_admin=false).
  const isSelfCompany = !isAdmin && (activeCompany?.slug === 'self' || (!activeCompany && !hasMultipleCompanies));
  const isAgentRole = !isAdmin && companyRole?.toLowerCase() === 'agent';
  const isConveyancerRole = !isAdmin && companyRole?.toLowerCase() === 'conveyancer';
  const navigation = isAdmin
    ? adminCompanyNavigation
    : isAgentRole
    ? agentNavigation
    : isConveyancerRole
    ? conveyancerNavigation
    : isSelfCompany
    ? selfNavigation
    : companyNavigation;

  const handleSwitchCompany = () => {
    setShowCompanyMenu(false);
    router.push('/company-context-select');
  };
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className={`hidden lg:flex bg-sidebar border-r border-sidebar-border sidebar-forest-scope flex-col transition-all ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>

        {/* Logo row */}
        <div className={`p-2 border-b border-border flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
          <Link
            href={isPlatformAdmin ? '/app/admin' : isAdmin && !isSelfCompany ? '/company/dashboard' : '/app/my-dashboard'}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} text-foreground`}
            aria-label={isPlatformAdmin ? 'Go to Admin Overview' : isAdmin && !isSelfCompany ? 'Go to Company Dashboard' : 'Go to My Dashboard'}
            title="PropertyOS"
          >
            <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--bt-terracotta)' }}>
              <Home className="w-4 h-4 text-white" />
            </div>
            {!isSidebarCollapsed && <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--sidebar-foreground)' }}>PropertyOS</span>}
          </Link>
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Company context selector */}
        {companyName && hasMultipleCompanies && (
          <div className={`border-b border-border relative ${isSidebarCollapsed ? 'px-2 py-3' : 'p-3'}`}>
            {isSidebarCollapsed ? (
              <button
                onClick={() => setShowCompanyMenu((v) => !v)}
                aria-label="Company menu"
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </button>
            ) : (
              <button
                onClick={() => setShowCompanyMenu((v) => !v)}
                className="w-full rounded-lg bg-muted/50 hover:bg-accent transition-colors text-left p-3"
                aria-expanded={showCompanyMenu}
                aria-haspopup="true"
              >
                <div className="flex items-center gap-2.5">
                  {/* Company logo or fallback icon */}
                  <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {companyLogoUrl ? (
                      <Image src={companyLogoUrl} alt={companyName ?? 'Company'} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Current Company</p>
                    <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {showRoleBadge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide" style={{ background: 'rgba(242,232,213,0.15)', color: 'var(--bt-parchment)', fontFamily: 'var(--font-mono)' }}>
                          {companyRole}
                        </span>
                      )}
                      {isAdmin && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500 uppercase tracking-wide">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${showCompanyMenu ? 'rotate-180' : ''}`} />
                </div>
              </button>
            )}

            {/* Dropdown */}
            {showCompanyMenu && (
              <div className={`absolute z-20 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 ${isSidebarCollapsed ? 'left-full ml-2 w-48' : 'left-3 right-3'}`}>
                <button
                  onClick={handleSwitchCompany}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  Switch Company / Role
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {isPlatformAdmin ? (
            <div>
              <button
                onClick={() => setShowPlatformAdminCockpit((v) => !v)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors text-amber-600 hover:bg-amber-50`}
                title="Platform Admin"
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">Platform Admin</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPlatformAdminCockpit ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {showPlatformAdminCockpit && (
                <div className={`${isSidebarCollapsed ? 'mt-1 space-y-1' : 'ml-3 border-l border-amber-200 pl-2 mt-1 space-y-1'}`}>
                  {platformAdminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                      className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                        isActive(pathname, item.href)
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                      title={item.name}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : isAdmin && !isSelfCompany ? (
            <div>
              <button
                onClick={() => setShowAdminGroup((v) => !v)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors text-muted-foreground hover:bg-accent`}
                title="Company Administration"
              >
                <Settings className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">Company Administration</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdminGroup ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {showAdminGroup && (
                <div className={`${isSidebarCollapsed ? 'mt-1 space-y-1' : 'ml-3 border-l border-border pl-2 mt-1 space-y-1'}`}>
                  {adminCompanyNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                      className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                        isActive(pathname, item.href)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                      title={item.name}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : isConveyancerRole ? (
            <div>
              <button
                onClick={() => setShowConveyancerCockpit((v) => !v)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors text-muted-foreground hover:bg-accent`}
                title="Conveyancer Cockpit"
              >
                <Scale className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">Conveyancer Cockpit</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showConveyancerCockpit ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {showConveyancerCockpit && (
                <div className={`${isSidebarCollapsed ? 'mt-1 space-y-1' : 'ml-3 border-l border-border pl-2 mt-1 space-y-1'}`}>
                  {conveyancerNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                      className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                        isActive(pathname, item.href)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                      title={item.name}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : isAgentRole ? (
            <div>
              <button
                onClick={() => setShowAgentCockpit((v) => !v)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors text-muted-foreground hover:bg-accent`}
                title="Agent Cockpit"
              >
                <Gauge className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-left">Agent Cockpit</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAgentCockpit ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {showAgentCockpit && (
                <div className={`${isSidebarCollapsed ? 'mt-1 space-y-1' : 'ml-3 border-l border-border pl-2 mt-1 space-y-1'}`}>
                  {/* Agent Dashboard */}
                  <Link
                    href="/app/agent"
                    aria-current={isActive(pathname, '/app/agent') ? 'page' : undefined}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                      isActive(pathname, '/app/agent')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    title="Agent Dashboard"
                  >
                    <User className="w-4 h-4" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Agent Dashboard</span>}
                  </Link>
                  {/* My Listings */}
                  <Link
                    href="/app/my-listings"
                    aria-current={isActive(pathname, '/app/my-listings') ? 'page' : undefined}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                      isActive(pathname, '/app/my-listings')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    title="My Listings"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">My Listings</span>}
                  </Link>
                  {/* On Show */}
                  <Link
                    href="/app/on-show"
                    aria-current={pathname.startsWith('/app/on-show') ? 'page' : undefined}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                      pathname.startsWith('/app/on-show')
                        ? 'text-sidebar-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    style={pathname.startsWith('/app/on-show') ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                    title="On Show"
                  >
                    <DoorOpen className="w-4 h-4 shrink-0" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">On Show</span>}
                  </Link>
                  {/* My Calendar */}
                  <Link
                    href="/app/calendar"
                    aria-current={isActive(pathname, '/app/calendar') ? 'page' : undefined}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                      isActive(pathname, '/app/calendar')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    title="My Calendar"
                  >
                    <Calendar className="w-4 h-4" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">My Calendar</span>}
                  </Link>
                  {/* Listings */}
                  <Link
                    href="/app/listings"
                    aria-current={isActive(pathname, '/app/listings') ? 'page' : undefined}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                      isActive(pathname, '/app/listings')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    title="Listings"
                  >
                    <Building2 className="w-4 h-4" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Listings</span>}
                  </Link>
                  <Link
                    href="/app/leads"
                    aria-current={pathname.startsWith('/app/leads') ? 'page' : undefined}
                    className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                      pathname.startsWith('/app/leads')
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    title="Lead Management"
                  >
                    <Target className="w-4 h-4" />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">Lead Management</span>}
                  </Link>
                  {agentNavigation.slice(3).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                      className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors ${
                        isActive(pathname, item.href)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                      title={item.name}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            navigation.map((item) => (
              item.href === '/app/my-listings' ? (
                <div key={item.name}>
                  <button
                    onClick={() => setShowMyListings((v) => !v)}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                      pathname.startsWith('/app/my-listings')
                        ? 'text-sidebar-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    style={pathname.startsWith('/app/my-listings') ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                    title="My Listings"
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">My Listings</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showMyListings ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {showMyListings && (
                    <div className={`${isSidebarCollapsed ? 'mt-1 space-y-1' : 'ml-3 border-l border-border pl-2 mt-1 space-y-1'}`}>
                      {myListingsNavigation.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          aria-current={isActive(pathname, subItem.href) ? 'page' : undefined}
                          className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors ${
                            isActive(pathname, subItem.href)
                              ? 'text-sidebar-foreground'
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                          style={isActive(pathname, subItem.href) ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                          title={subItem.name}
                        >
                          <subItem.icon className="w-4 h-4" />
                          {!isSidebarCollapsed && <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-jakarta)' }}>{subItem.name}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-colors ${
                  isActive(pathname, item.href)
                    ? 'text-sidebar-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
                style={isActive(pathname, item.href) ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                title={item.name}
              >
                <item.icon className="w-5 h-5" />
                {!isSidebarCollapsed && <span className="font-medium" style={{ fontFamily: 'var(--font-jakarta)' }}>{item.name}</span>}
              </Link>
              )
            ))
          )}

        </nav>

        {/* ── Footer strip: avatar + name/role + bell ─────────── */}
        <div
          className={`border-t border-sidebar-border shrink-0 ${
            isSidebarCollapsed
              ? 'p-2 flex flex-col items-center gap-2'
              : 'p-2 flex items-center gap-2'
          }`}
          style={{ background: 'rgba(0,0,0,0.07)' }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold shrink-0 hover:ring-2 hover:ring-white/20 transition-all focus-visible:outline-none"
                aria-label="Open user menu"
                title={fullName}
              >
                <UserAvatarContent avatarUrl={currentUser?.avatarUrl} initials={initials} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-64 mb-1">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold truncate">{fullName}</p>
                {companyRole && (
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono truncate">{companyRole}</p>
                )}
              </div>
              <DropdownMenuItem asChild>
                <Link href="/profile-dashboard">View Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--sidebar-foreground)' }}>{fullName}</p>
              {companyRole && (
                <p
                  className="text-[10px] uppercase tracking-wide truncate"
                  style={{ color: 'var(--sidebar-foreground)', opacity: 0.5, fontFamily: 'var(--font-mono)' }}
                >
                  {companyRole}
                </p>
              )}
            </div>
          )}

          {onNotificationsClick && (
            <button
              onClick={onNotificationsClick}
              aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Open notifications'}
              className="relative p-1.5 rounded-lg transition-colors border shrink-0"
              style={{
                background: 'rgba(242,232,213,0.06)',
                borderColor: 'rgba(242,232,213,0.12)',
                color: 'rgba(242,232,213,0.6)',
              }}
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"
                  style={{ border: '1.5px solid var(--sidebar)' }}
                  aria-hidden="true"
                />
              )}
            </button>
          )}
        </div>

      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────── */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar sidebar-forest-scope flex-col flex">

            {/* Logo row */}
            <div className="p-6 border-b border-border flex items-center justify-between gap-2">
              <Link
                href={isPlatformAdmin ? '/app/admin' : isAdmin && !isSelfCompany ? '/company/dashboard' : '/app/my-dashboard'}
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-2 text-foreground"
                aria-label={isPlatformAdmin ? 'Go to Admin Overview' : isAdmin && !isSelfCompany ? 'Go to Company Dashboard' : 'Go to My Dashboard'}
              >
                <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--bt-terracotta)' }}>
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-fraunces)', color: 'var(--sidebar-foreground)' }}>PropertyOS</span>
              </Link>
              <button
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close navigation menu"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Company context selector (mobile) */}
            {companyName && hasMultipleCompanies && (
              <div className="p-3 border-b border-border relative">
                <button
                  onClick={() => setShowCompanyMenu((v) => !v)}
                  className="w-full rounded-lg bg-muted/50 hover:bg-accent transition-colors text-left p-3"
                  aria-expanded={showCompanyMenu}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Company logo or fallback icon */}
                    <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {companyLogoUrl ? (
                        <Image src={companyLogoUrl} alt={companyName ?? 'Company'} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Current Company</p>
                      <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {showRoleBadge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide" style={{ background: 'rgba(242,232,213,0.15)', color: 'var(--bt-parchment)', fontFamily: 'var(--font-mono)' }}>
                            {companyRole}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500 uppercase tracking-wide">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${showCompanyMenu ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {showCompanyMenu && (
                  <div className="mt-1 bg-popover border border-border rounded-lg shadow-lg py-1">
                    <button
                      onClick={() => { handleSwitchCompany(); setShowMobileMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                      Switch Company / Role
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Mobile main navigation">
              {isPlatformAdmin ? (
                <div>
                  <button
                    onClick={() => setShowPlatformAdminCockpit((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-amber-600 hover:bg-amber-50"
                  >
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span className="font-medium flex-1 text-left">Platform Admin</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPlatformAdminCockpit ? 'rotate-180' : ''}`} />
                  </button>
                  {showPlatformAdminCockpit && (
                    <div className="ml-3 border-l border-amber-200 pl-2 mt-1 space-y-1">
                      {platformAdminNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive(pathname, item.href)
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : isAdmin && !isSelfCompany ? (
                <div>
                  <button
                    onClick={() => setShowAdminGroup((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:bg-accent"
                  >
                    <Settings className="w-5 h-5 shrink-0" />
                    <span className="font-medium flex-1 text-left">Company Administration</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdminGroup ? 'rotate-180' : ''}`} />
                  </button>
                  {showAdminGroup && (
                    <div className="ml-3 border-l border-border pl-2 mt-1 space-y-1">
                      {adminCompanyNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive(pathname, item.href)
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : isConveyancerRole ? (
                <div>
                  <button
                    onClick={() => setShowConveyancerCockpit((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:bg-accent"
                  >
                    <Scale className="w-5 h-5 shrink-0" />
                    <span className="font-medium flex-1 text-left">Conveyancer Cockpit</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showConveyancerCockpit ? 'rotate-180' : ''}`} />
                  </button>
                  {showConveyancerCockpit && (
                    <div className="ml-3 border-l border-border pl-2 mt-1 space-y-1">
                      {conveyancerNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive(pathname, item.href)
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : isAgentRole ? (
                <div>
                  <button
                    onClick={() => setShowAgentCockpit((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:bg-accent"
                  >
                    <Gauge className="w-5 h-5 shrink-0" />
                    <span className="font-medium flex-1 text-left">Agent Cockpit</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAgentCockpit ? 'rotate-180' : ''}`} />
                  </button>
                  {showAgentCockpit && (
                    <div className="ml-3 border-l border-border pl-2 mt-1 space-y-1">
                      {/* Agent Dashboard */}
                      <Link
                        href="/app/agent"
                        onClick={() => setShowMobileMenu(false)}
                        aria-current={isActive(pathname, '/app/agent') ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive(pathname, '/app/agent')
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Agent Dashboard</span>
                      </Link>
                      {/* My Listings */}
                      <Link
                        href="/app/my-listings"
                        onClick={() => setShowMobileMenu(false)}
                        aria-current={isActive(pathname, '/app/my-listings') ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive(pathname, '/app/my-listings')
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span className="text-sm font-medium">My Listings</span>
                      </Link>
                      {/* On Show */}
                      <Link
                        href="/app/on-show"
                        onClick={() => setShowMobileMenu(false)}
                        aria-current={pathname.startsWith('/app/on-show') ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          pathname.startsWith('/app/on-show')
                            ? 'text-sidebar-foreground'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                        style={pathname.startsWith('/app/on-show') ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                      >
                        <DoorOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">On Show</span>
                      </Link>
                      {/* My Calendar */}
                      <Link
                        href="/app/calendar"
                        onClick={() => setShowMobileMenu(false)}
                        aria-current={isActive(pathname, '/app/calendar') ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive(pathname, '/app/calendar')
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">My Calendar</span>
                      </Link>
                      {/* Listings */}
                      <Link
                        href="/app/listings"
                        onClick={() => setShowMobileMenu(false)}
                        aria-current={isActive(pathname, '/app/listings') ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive(pathname, '/app/listings')
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Listings</span>
                      </Link>
                      <Link
                        href="/app/leads"
                        onClick={() => setShowMobileMenu(false)}
                        aria-current={pathname.startsWith('/app/leads') ? 'page' : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          pathname.startsWith('/app/leads')
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">Lead Management</span>
                      </Link>
                      {agentNavigation.slice(3).map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setShowMobileMenu(false)}
                          aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            isActive(pathname, item.href)
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                navigation.map((item) => (
                  item.href === '/app/my-listings' ? (
                    <div key={item.name}>
                      <button
                        onClick={() => setShowMyListings((v) => !v)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          pathname.startsWith('/app/my-listings')
                            ? 'text-sidebar-foreground'
                            : 'text-muted-foreground hover:bg-accent'
                        }`}
                        style={pathname.startsWith('/app/my-listings') ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="font-medium flex-1 text-left">My Listings</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showMyListings ? 'rotate-180' : ''}`} />
                      </button>
                      {showMyListings && (
                        <div className="ml-3 border-l border-border pl-2 mt-1 space-y-1">
                          {myListingsNavigation.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setShowMobileMenu(false)}
                              aria-current={isActive(pathname, subItem.href) ? 'page' : undefined}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive(pathname, subItem.href)
                                  ? 'text-sidebar-foreground'
                                  : 'text-muted-foreground hover:bg-accent'
                              }`}
                              style={isActive(pathname, subItem.href) ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                            >
                              <subItem.icon className="w-4 h-4" />
                              <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-jakarta)' }}>{subItem.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(pathname, item.href)
                        ? 'text-sidebar-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                    style={isActive(pathname, item.href) ? { background: 'rgba(242,232,213,0.10)' } : undefined}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium" style={{ fontFamily: 'var(--font-jakarta)' }}>{item.name}</span>
                  </Link>
                  )
                ))
              )}

            </nav>

            {/* ── Mobile footer strip ───────────────────────────── */}
            <div
              className="border-t border-sidebar-border shrink-0 p-3 flex items-center gap-3"
              style={{ background: 'rgba(0,0,0,0.07)' }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold shrink-0 focus-visible:outline-none"
                    aria-label="Open user menu"
                    title={fullName}
                  >
                    <UserAvatarContent avatarUrl={currentUser?.avatarUrl} initials={initials} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-48 mb-1">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold truncate">{fullName}</p>
                    {companyRole && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono truncate">{companyRole}</p>
                    )}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile-dashboard" onClick={() => setShowMobileMenu(false)}>View Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={onLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--sidebar-foreground)' }}>{fullName}</p>
                {companyRole && (
                  <p
                    className="text-xs uppercase tracking-wide truncate"
                    style={{ color: 'var(--sidebar-foreground)', opacity: 0.5, fontFamily: 'var(--font-mono)' }}
                  >
                    {companyRole}
                  </p>
                )}
              </div>

              {onNotificationsClick && (
                <button
                  onClick={() => { onNotificationsClick(); setShowMobileMenu(false); }}
                  aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Open notifications'}
                  className="relative p-2 rounded-lg transition-colors border shrink-0"
                  style={{
                    background: 'rgba(242,232,213,0.06)',
                    borderColor: 'rgba(242,232,213,0.12)',
                    color: 'rgba(242,232,213,0.6)',
                  }}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                      style={{ border: '1.5px solid var(--sidebar)' }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )}
            </div>

          </aside>
        </div>
      )}
    </>
  );
}
