'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, Building2, Shield, BarChart3, User, Menu, X, LayoutDashboard, ChevronDown, ArrowLeftRight, Users, ClipboardList, Briefcase, Activity, UserX, Settings, Gauge, Target, Kanban, Brain, History } from 'lucide-react';
import type { AuthUser, CompanyContext } from '@/lib/api-client';
import { getIsAdminFromToken } from '@/lib/auth-session';

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
}

/** Navigation shown when the active company is the built-in "Self" personal context. */
const selfNavigation = [
  { name: 'My Dashboard', href: '/app/my-dashboard', icon: LayoutDashboard },
  { name: 'Listings', href: '/app/listings', icon: Building2 },
  { name: 'My Sales', href: '/app/sales', icon: Kanban },
  { name: 'Service Providers', href: '/service-providers', icon: Users },
  { name: 'Project Management', href: '/construction', icon: ClipboardList },
  { name: 'Safety', href: '/app/safety', icon: Shield },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'Company Registration', href: '/app/my-companies', icon: Briefcase },
  { name: 'Sessions', href: '/app/sessions', icon: History },
];

/** Navigation shown when the active user's role is 'agent'. */
const agentNavigation = [
  { name: 'Agent Dashboard', href: '/app/agent', icon: User },
  { name: 'Listings', href: '/app/listings', icon: Building2 },
  { name: 'My Sales', href: '/app/sales', icon: Kanban },
  { name: 'Safety', href: '/app/safety', icon: Shield },
  { name: 'Analytics', href: '/app/analytics', icon: BarChart3 },
  { name: 'AI Intelligence', href: '/app/ai-intelligence', icon: Brain },
];

/** Sub-navigation nested under Lead Management inside Agent Cockpit. */
const leadManagementNavigation = [
  { name: 'Lead Dashboard', href: '/app/leads/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/app/leads', icon: Users },
  { name: 'Pipeline', href: '/app/leads/pipeline', icon: Kanban },
  { name: 'Analytics', href: '/app/leads/analytics', icon: BarChart3 },
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
  { name: 'AI Command Center', href: '/admin/ai-command-center', icon: Brain },
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
  currentUser,
  activeCompany,
  hasMultipleCompanies = false,
}: AppSidebarProps) {
  const router = useRouter();
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showAdminGroup, setShowAdminGroup] = useState(true);
  const [showAgentCockpit, setShowAgentCockpit] = useState(true);
  const [showLeadManagement, setShowLeadManagement] = useState(true);

  const companyName = activeCompany?.name ?? currentUser?.companyName ?? null;
  const companyRole = activeCompany?.role ?? currentUser?.role ?? null;
  // JWT is the authoritative source — set by the backend at context-selection
  // time and resistant to stale localStorage values. Also cross-check against
  // the stored company context (covers single-company logins where activeCompany
  // is set) and guard against self-company which is always non-admin.
  const isAdmin =
    getIsAdminFromToken() ||
    (activeCompany?.slug !== 'self' && (activeCompany?.is_admin ?? false));
  const companyLogoUrl = activeCompany?.logo_url ?? null;
  // Only show role badge when the role is not 'admin' — the amber Admin badge already covers that case
  const showRoleBadge = companyRole && companyRole.toLowerCase() !== 'admin';
  // An admin is *never* in the self-company context (the self company always has is_admin=false).
  const isSelfCompany = !isAdmin && (activeCompany?.slug === 'self' || (!activeCompany && !hasMultipleCompanies));
  const isAgentRole = !isAdmin && companyRole?.toLowerCase() === 'agent';
  const navigation = isAdmin
    ? adminCompanyNavigation
    : isAgentRole
    ? agentNavigation
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
      <aside className={`hidden lg:flex bg-card border-r border-border flex-col transition-all ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>

        {/* Logo row */}
        <div className={`p-2 border-b border-border flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
          <Link
            href={isAdmin && !isSelfCompany ? '/company/dashboard' : '/app/my-dashboard'}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} text-foreground`}
            aria-label={isAdmin && !isSelfCompany ? 'Go to Company Dashboard' : 'Go to My Dashboard'}
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-500 uppercase tracking-wide">
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
        <nav className="flex-1 p-4 space-y-1" aria-label="Main navigation">
          {isAdmin && !isSelfCompany ? (
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
                  {agentNavigation.slice(0, 2).map((item) => (
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
                  <div>
                    <button
                      onClick={() => setShowLeadManagement((v) => !v)}
                      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg transition-colors text-muted-foreground hover:bg-accent`}
                      title="Lead Management"
                    >
                      <Target className="w-4 h-4 shrink-0" />
                      {!isSidebarCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">Lead Management</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showLeadManagement ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                    {showLeadManagement && (
                      <div className={`${isSidebarCollapsed ? 'mt-1 space-y-1' : 'ml-3 border-l border-border pl-2 mt-1 space-y-1'}`}>
                        {leadManagementNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors ${
                              isActive(pathname, item.href)
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-muted-foreground hover:bg-accent'
                            }`}
                            title={item.name}
                          >
                            <item.icon className="w-3.5 h-3.5" />
                            {!isSidebarCollapsed && <span className="text-xs font-medium">{item.name}</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  {agentNavigation.slice(2).map((item) => (
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
            ))
          )}
        </nav>

        {/* Quick links */}
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

      {/* ── Mobile drawer ────────────────────────────────────────── */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card flex flex-col">

            {/* Logo row */}
            <div className="p-6 border-b border-border flex items-center justify-between gap-2">
              <Link
                href={isAdmin && !isSelfCompany ? '/company/dashboard' : '/app/my-dashboard'}
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-2 text-foreground"
                aria-label={isAdmin && !isSelfCompany ? 'Go to Company Dashboard' : 'Go to My Dashboard'}
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-500 uppercase tracking-wide">
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
              {isAdmin && !isSelfCompany ? (
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
                      {agentNavigation.slice(0, 2).map((item) => (
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
                      <div>
                        <button
                          onClick={() => setShowLeadManagement((v) => !v)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-muted-foreground hover:bg-accent"
                        >
                          <Target className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-medium flex-1 text-left">Lead Management</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${showLeadManagement ? 'rotate-180' : ''}`} />
                        </button>
                        {showLeadManagement && (
                          <div className="ml-3 border-l border-border pl-2 mt-1 space-y-1">
                            {leadManagementNavigation.map((item) => (
                              <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setShowMobileMenu(false)}
                                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                  isActive(pathname, item.href)
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-muted-foreground hover:bg-accent'
                                }`}
                              >
                                <item.icon className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{item.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      {agentNavigation.slice(2).map((item) => (
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
                ))
              )}
            </nav>

            <div className="p-4 border-t border-border">
              <div className="mt-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setShowMobileMenu(false)}
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
