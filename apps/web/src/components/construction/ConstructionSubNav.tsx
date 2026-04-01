'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Users,
  DollarSign,
  Package,
  Archive,
  FileText,
  Shield,
  Sparkles,
  BarChart3,
  Briefcase,
  Settings,
  ChevronDown,
  ChevronRight,
  Receipt,
  Camera,
  Clipboard,
  FileEdit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavGroup {
  label: string;
  items: { name: string; href: string; icon: React.ElementType; badge?: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/construction', icon: LayoutDashboard },
      { name: 'Portfolio', href: '/construction/portfolio', icon: Briefcase },
    ],
  },
  {
    label: 'Projects',
    items: [
      { name: 'Projects', href: '/construction/projects', icon: FolderKanban },
      { name: 'Tasks', href: '/construction/tasks', icon: CheckSquare },
      { name: 'Calendar', href: '/construction/calendar', icon: CalendarDays },
      { name: 'Change Orders', href: '/construction/change-orders', icon: FileEdit },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Budget & Costs', href: '/construction/budget', icon: DollarSign },
      { name: 'Invoices', href: '/construction/invoices', icon: Receipt },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { name: 'Materials & Orders', href: '/construction/procurement', icon: Package },
      { name: 'Inventory', href: '/construction/inventory', icon: Archive },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'AI Assistant', href: '/construction/ai', icon: Sparkles },
      { name: 'Reports', href: '/construction/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Field Operations',
    items: [
      { name: 'Contractors', href: '/construction/contractors', icon: Users },
      { name: 'Site Logs', href: '/construction/site-logs', icon: Clipboard },
      { name: 'Site Photos', href: '/construction/site-photos', icon: Camera },
    ],
  },
  {
    label: 'Documents & Compliance',
    items: [
      { name: 'Documents', href: '/construction/documents', icon: FileText },
      { name: 'Risk Management', href: '/construction/risks', icon: Shield },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Settings', href: '/construction/settings', icon: Settings },
    ],
  },
];

export default function ConstructionSubNav() {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <nav className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto h-full">
      <div className="px-3 py-4 space-y-4">
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.label);
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                <span>{group.label}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <item.icon
                          className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        />
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
