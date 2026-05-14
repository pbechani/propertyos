'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Clock,
  MoreHorizontal,
  Archive,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
  Shield,
  DollarSign,
  Calendar,
  Users,
  Package,
  FileText,
  ChevronDown,
} from 'lucide-react';

interface ExtendedNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'project' | 'task' | 'budget' | 'safety' | 'material' | 'schedule' | 'ai' | 'document' | 'contractor' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  projectName?: string;
  actionUrl?: string;
  archived: boolean;
}

const allNotifications: ExtendedNotification[] = [
  {
    id: 'n1', type: 'error', category: 'budget', title: 'Critical Budget Overrun Detected',
    message: 'Tower A - Facade budget has exceeded the allocated amount by $127,000 (4.2% variance). AI Cost Controller recommends reviewing subcontractor bids and material alternatives.',
    timestamp: '2026-03-12T09:15:00', read: false, priority: 'critical', source: 'AI Cost Controller',
    projectName: 'Tower A - Luxury Residential', actionUrl: '/financial', archived: false,
  },
  {
    id: 'n2', type: 'error', category: 'schedule', title: 'Contractor Behind Schedule',
    message: 'ProRoof Systems is 4 days behind on the Riverside Complex roofing milestone. This delays the critical path by 3 days. Consider adding a second crew.',
    timestamp: '2026-03-12T08:30:00', read: false, priority: 'critical', source: 'AI Scheduler',
    projectName: 'Riverside Commercial Complex', actionUrl: '/project-schedule', archived: false,
  },
  {
    id: 'n3', type: 'success', category: 'project', title: 'Milestone Completed Ahead of Schedule',
    message: 'Tower A - Level 14 structural work completed 2 days ahead of schedule. This frees up the crew for Level 15 pour.',
    timestamp: '2026-03-12T07:45:00', read: false, priority: 'medium', source: 'AI Project Manager',
    projectName: 'Tower A - Luxury Residential', actionUrl: '/projects/p1', archived: false,
  },
  {
    id: 'n4', type: 'warning', category: 'safety', title: 'Safety Inspection Overdue',
    message: 'Monthly safety inspection for GreenTech Industrial Park is 3 days overdue. Schedule immediately to maintain compliance.',
    timestamp: '2026-03-12T07:00:00', read: false, priority: 'high', source: 'Compliance Monitor',
    projectName: 'GreenTech Industrial Park', actionUrl: '/site-logs', archived: false,
  },
  {
    id: 'n5', type: 'info', category: 'material', title: 'Material Delivery In Transit',
    message: 'Steel Rebar #8 shipment (50 tons) from SteelCorp is in transit. Expected delivery: March 13 at 8:00 AM to Tower A site.',
    timestamp: '2026-03-11T16:20:00', read: true, priority: 'low', source: 'AI Procurement Agent',
    projectName: 'Tower A - Luxury Residential', actionUrl: '/inventory', archived: false,
  },
  {
    id: 'n6', type: 'warning', category: 'material', title: 'Low Stock Alert: Portland Cement',
    message: 'Portland Cement Type II stock is at 15% (300 bags remaining). Automatic reorder triggered for 2,000 bags from ConcretePro.',
    timestamp: '2026-03-11T14:10:00', read: true, priority: 'high', source: 'AI Procurement Agent',
    projectName: 'Tower A - Luxury Residential', actionUrl: '/inventory', archived: false,
  },
  {
    id: 'n7', type: 'success', category: 'document', title: 'Drawing Approved',
    message: 'Structural drawings for Level 16-20 (Rev C) have been approved by all reviewers. Ready for distribution to contractors.',
    timestamp: '2026-03-11T11:30:00', read: true, priority: 'medium', source: 'Document Workflow',
    projectName: 'Tower A - Luxury Residential', actionUrl: '/document-management', archived: false,
  },
  {
    id: 'n8', type: 'info', category: 'contractor', title: 'New Contractor Application',
    message: 'ElectroPro Systems has submitted an application for the Tower A electrical subcontract. Safety rating: 4.8/5, License verified.',
    timestamp: '2026-03-11T10:00:00', read: true, priority: 'low', source: 'Contractor Portal',
    actionUrl: '/contractors', archived: false,
  },
  {
    id: 'n9', type: 'warning', category: 'ai', title: 'AI Risk Prediction: Weather Impact',
    message: 'Weather models indicate 70% chance of heavy rain March 15-17. AI recommends rescheduling outdoor concrete work for Tower A and protecting exposed materials.',
    timestamp: '2026-03-11T09:00:00', read: false, priority: 'high', source: 'AI Risk Analyzer',
    projectName: 'Tower A - Luxury Residential', actionUrl: '/risks', archived: false,
  },
  {
    id: 'n10', type: 'info', category: 'task', title: 'Task Assignment',
    message: 'You have been assigned as reviewer for "MEP Coordination Review - Levels 10-15" on the Riverside Complex project.',
    timestamp: '2026-03-10T17:30:00', read: true, priority: 'medium', source: 'Task Manager',
    projectName: 'Riverside Commercial Complex', actionUrl: '/tasks/t2', archived: false,
  },
  {
    id: 'n11', type: 'success', category: 'budget', title: 'Invoice Approved & Paid',
    message: 'Invoice INV-2026-0089 from BuildTech Construction ($245,000) has been approved and payment processed.',
    timestamp: '2026-03-10T15:00:00', read: true, priority: 'low', source: 'Financial System',
    projectName: 'Tower A - Luxury Residential', actionUrl: '/invoices', archived: false,
  },
  {
    id: 'n12', type: 'error', category: 'safety', title: 'Safety Incident Reported',
    message: 'Minor safety incident reported at GreenTech Industrial Park: worker slip near excavation zone. No injuries. Site supervisor investigation initiated.',
    timestamp: '2026-03-10T13:45:00', read: true, priority: 'critical', source: 'Site Safety Monitor',
    projectName: 'GreenTech Industrial Park', actionUrl: '/site-logs', archived: false,
  },
  {
    id: 'n13', type: 'info', category: 'system', title: 'System Maintenance Scheduled',
    message: 'Planned system maintenance on March 14, 2:00 AM - 4:00 AM EST. Platform will be in read-only mode during this period.',
    timestamp: '2026-03-10T10:00:00', read: true, priority: 'low', source: 'System Admin',
    archived: false,
  },
  {
    id: 'n14', type: 'warning', category: 'schedule', title: 'Permit Approval Pending',
    message: 'Building permit for Lakeside Shopping Center Phase 2 has been under review for 15 days. Follow up with NYC DOB recommended.',
    timestamp: '2026-03-10T09:00:00', read: true, priority: 'medium', source: 'AI Project Manager',
    projectName: 'Lakeside Shopping Center', actionUrl: '/projects/p4', archived: false,
  },
  {
    id: 'n15', type: 'success', category: 'ai', title: 'AI Optimization Applied',
    message: 'AI Schedule Optimizer reorganized 12 tasks on the Riverside Complex, resulting in a projected 5-day schedule improvement and $32K cost savings.',
    timestamp: '2026-03-09T16:00:00', read: true, priority: 'medium', source: 'AI Scheduler',
    projectName: 'Riverside Commercial Complex', actionUrl: '/project-schedule', archived: false,
  },
];

const categoryConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  project: { icon: FileText, label: 'Project', color: 'bg-blue-100 text-blue-700' },
  task: { icon: CheckCircle2, label: 'Task', color: 'bg-purple-100 text-purple-700' },
  budget: { icon: DollarSign, label: 'Budget', color: 'bg-green-100 text-green-700' },
  safety: { icon: Shield, label: 'Safety', color: 'bg-red-100 text-red-700' },
  material: { icon: Package, label: 'Material', color: 'bg-amber-100 text-amber-700' },
  schedule: { icon: Calendar, label: 'Schedule', color: 'bg-indigo-100 text-indigo-700' },
  ai: { icon: Sparkles, label: 'AI Agent', color: 'bg-violet-100 text-violet-700' },
  document: { icon: FileText, label: 'Document', color: 'bg-cyan-100 text-cyan-700' },
  contractor: { icon: Users, label: 'Contractor', color: 'bg-teal-100 text-teal-700' },
  system: { icon: Settings, label: 'System', color: 'bg-gray-100 text-gray-700' },
};

const typeConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
};

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date('2026-03-12T10:00:00');
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState(allNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread' && n.read) return false;
    if (activeTab === 'archived' && !n.archived) return false;
    if (activeTab !== 'archived' && n.archived) return false;
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && n.priority !== selectedPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.source.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const archivedCount = notifications.filter(n => n.archived).length;

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === filteredNotifications.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const markRead = (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
    setSelectedItems(new Set());
  };

  const markUnread = (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: false } : n));
    setSelectedItems(new Set());
  };

  const archiveItems = (ids: string[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, archived: true, read: true } : n));
    setSelectedItems(new Set());
  };

  const deleteItems = (ids: string[]) => {
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    setSelectedItems(new Set());
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const criticalCount = notifications.filter(n => !n.read && (n.priority === 'critical' || n.priority === 'high')).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            Notifications Center
          </h1>
          <p className="text-gray-500 mt-1">
            {unreadCount} unread {criticalCount > 0 && <span className="text-red-600">({criticalCount} critical)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" /> Preferences
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: notifications.filter(n => !n.archived).length, color: 'bg-blue-50 text-blue-700', icon: Bell },
          { label: 'Unread', value: unreadCount, color: 'bg-amber-50 text-amber-700', icon: EyeOff },
          { label: 'Critical', value: criticalCount, color: 'bg-red-50 text-red-700', icon: AlertTriangle },
          { label: 'Archived', value: archivedCount, color: 'bg-gray-50 text-gray-600', icon: Archive },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search notifications..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  <Filter className="w-4 h-4 mr-1" /> Category
                  {selectedCategory !== 'all' && <Badge className="ml-1 bg-blue-100 text-blue-700 text-xs">{selectedCategory}</Badge>}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedCategory('all')}>All Categories</DropdownMenuItem>
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                  <DropdownMenuItem key={key} onClick={() => setSelectedCategory(key)}>
                    <cfg.icon className="w-4 h-4 mr-2" /> {cfg.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default">
                  Priority
                  {selectedPriority !== 'all' && <Badge className="ml-1 bg-blue-100 text-blue-700 text-xs">{selectedPriority}</Badge>}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {['all', 'critical', 'high', 'medium', 'low'].map(p => (
                  <DropdownMenuItem key={p} onClick={() => setSelectedPriority(p)}>
                    {p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Tabs & List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{selectedItems.size} selected</span>
              <Button variant="outline" size="sm" onClick={() => markRead(Array.from(selectedItems))}>
                <Eye className="w-3 h-3 mr-1" /> Read
              </Button>
              <Button variant="outline" size="sm" onClick={() => markUnread(Array.from(selectedItems))}>
                <EyeOff className="w-3 h-3 mr-1" /> Unread
              </Button>
              <Button variant="outline" size="sm" onClick={() => archiveItems(Array.from(selectedItems))}>
                <Archive className="w-3 h-3 mr-1" /> Archive
              </Button>
              <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteItems(Array.from(selectedItems))}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>

        {['all', 'unread', 'archived'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
            {filteredNotifications.length > 0 && (
              <div className="flex items-center gap-2 px-4 pb-2">
                <Checkbox
                  checked={selectedItems.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-xs text-gray-500">Select all ({filteredNotifications.length})</span>
              </div>
            )}
            {filteredNotifications.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map(n => {
                const TypeIcon = typeConfig[n.type].icon;
                const catCfg = categoryConfig[n.category];
                const CatIcon = catCfg.icon;
                return (
                  <Card
                    key={n.id}
                    className={`border shadow-sm transition-all hover:shadow-md cursor-pointer ${
                      !n.read ? 'bg-white border-l-4 border-l-blue-500' : 'bg-gray-50/50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedItems.has(n.id)}
                          onCheckedChange={() => toggleSelect(n.id)}
                          className="mt-1"
                        />
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig[n.type].bg}`}>
                          <TypeIcon className={`w-4 h-4 ${typeConfig[n.type].color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`text-sm ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h3>
                                <Badge variant="outline" className={`text-xs px-1.5 py-0 ${catCfg.color}`}>
                                  <CatIcon className="w-3 h-3 mr-1" />{catCfg.label}
                                </Badge>
                                {n.priority === 'critical' && (
                                  <Badge className="bg-red-100 text-red-700 text-xs px-1.5 py-0">Critical</Badge>
                                )}
                                {n.priority === 'high' && (
                                  <Badge className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0">High</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />{n.source}
                                </span>
                                {n.projectName && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />{n.projectName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatTime(n.timestamp)}
                                </span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {n.read ? (
                                  <DropdownMenuItem onClick={() => markUnread([n.id])}>
                                    <EyeOff className="w-4 h-4 mr-2" /> Mark as Unread
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => markRead([n.id])}>
                                    <Eye className="w-4 h-4 mr-2" /> Mark as Read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => archiveItems([n.id])}>
                                  <Archive className="w-4 h-4 mr-2" /> Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteItems([n.id])} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
