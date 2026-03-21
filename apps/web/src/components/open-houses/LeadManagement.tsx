// @ts-nocheck
"use client"
import { useState, useEffect } from 'react';
import { agentApi, viewingActionsApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import {
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  User,
  Tag,
  Clock,
  MoreVertical,
  Star,
  X,
  Check,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
  Video,
  Send,
  UserPlus,
  Activity,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'cold';
  score: number;
  source: string;
  assignedTo: string;
  createdDate: string;
  lastContact: string;
  nextFollowUp?: string;
  tags: string[];
  propertyInterest: string;
  budget: string;
  location: string;
  notes: string;
  checkedInAt?: string;
  avatar?: string;
}

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'property_view' | 'document' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}



function getActivitiesForLead(lead: Lead): Activity[] {
  const activities: Activity[] = [];
  if (lead.createdDate) {
    activities.push({
      id: `${lead.id}-registered`,
      type: 'status_change',
      title: 'Registered for Open House',
      description: `Signed up for ${lead.propertyInterest || 'open house'}`,
      timestamp: `${lead.createdDate}T00:00:00`,
      user: lead.name,
    });
  }
  if (lead.checkedInAt) {
    activities.push({
      id: `${lead.id}-checkin`,
      type: 'meeting',
      title: 'Attended Open House',
      description: `Checked in at ${lead.propertyInterest || 'open house'}`,
      timestamp: lead.checkedInAt,
      user: lead.name,
    });
  }
  if (lead.notes) {
    activities.push({
      id: `${lead.id}-note`,
      type: 'note',
      title: 'Agent Note',
      description: lead.notes,
      timestamp: lead.checkedInAt ?? (lead.lastContact ? `${lead.lastContact}T00:00:00` : new Date().toISOString()),
      user: lead.assignedTo,
    });
  }
  return activities;
}

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-500' },
  contacted: { label: 'Contacted', color: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: 'bg-purple-500' },
  qualified: { label: 'Qualified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: 'bg-emerald-500' },
  nurturing: { label: 'Nurturing', color: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  converted: { label: 'Converted', color: 'bg-green-50 text-green-700 border-green-200', dotColor: 'bg-green-600' },
  cold: { label: 'Cold', color: 'bg-slate-50 text-slate-700 border-slate-200', dotColor: 'bg-slate-400' },
};

const tagColors = [
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-rose-50 text-rose-700 border-rose-200',
];

export function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    agentApi.getOpenHouses(token)
      .then(async (openHouses) => {
        const allRegs = await Promise.all(
          (openHouses ?? []).map((oh) =>
            viewingActionsApi.getOpenHouseRegistrations(token, oh.id)
              .then((regs) => (regs ?? []).map((r) => ({ ...r, _propertyTitle: oh.property_title })))
              .catch(() => [])
          )
        );
        const flat = allRegs.flat();
        const mapped: Lead[] = flat.map((r) => ({
          id: r.id,
          name: (r.guest_name ?? [r.first_name, r.last_name].filter(Boolean).join(' ')) || 'Walk-in',
          email: r.guest_email ?? r.email ?? '',
          phone: r.guest_phone ?? r.phone ?? '',
          status: r.checked_in_at ? 'qualified' : 'new',
          score: r.interest_level === 'high' ? 85 : r.interest_level === 'medium' ? 65 : 45,
          source: r.buyer_id ? 'App' : 'Walk-in',
          assignedTo: 'Me',
          createdDate: r.registered_at?.split('T')[0] ?? '',
          lastContact: (r.checked_in_at ?? r.registered_at)?.split('T')[0] ?? '',
          checkedInAt: r.checked_in_at ?? undefined,
          tags: r.buyer_id ? ['App User'] : ['Walk-in'],
          propertyInterest: r._propertyTitle ?? 'Open House',
          budget: '',
          location: '',
          notes: r.notes ?? '',
        }));
        setLeads(mapped);
        setSelectedLead(mapped[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-slate-600';
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left Panel - Lead List */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Leads</h2>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-semibold text-slate-900">{leads.length}</p>
              <p className="text-xs text-slate-600">Total Leads</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-emerald-600">
                {leads.filter((l) => l.status === 'qualified').length}
              </p>
              <p className="text-xs text-slate-600">Qualified</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-blue-600">
                {leads.filter((l) => l.status === 'new').length}
              </p>
              <p className="text-xs text-slate-600">New</p>
            </div>
          </div>
        </div>

        {/* Lead List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <User className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-sm">No registrations found</p>
            </div>
          ) : filteredLeads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left ${
                selectedLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {lead.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-slate-900 truncate">{lead.name}</h3>
                    <span className={`text-sm font-semibold ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mb-2">{lead.email}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        statusConfig[lead.status].color
                      }`}
                    >
                      {statusConfig[lead.status].label}
                    </span>
                    {lead.nextFollowUp && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(lead.nextFollowUp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  {lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                            tagColors[index % tagColors.length]
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      {lead.tags.length > 2 && (
                        <span className="text-xs text-slate-500">+{lead.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Lead Details */}
      {selectedLead ? (
        <div className="flex-1 flex gap-6">
          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                    {selectedLead.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 mb-1">
                      {selectedLead.name}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedLead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {selectedLead.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${
                          statusConfig[selectedLead.status].color
                        }`}
                      >
                        {statusConfig[selectedLead.status].label}
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                        <Star className={`w-4 h-4 ${getScoreColor(selectedLead.score)}`} />
                        <span className={`text-sm font-semibold ${getScoreColor(selectedLead.score)}`}>
                          {selectedLead.score} Score
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Mail className="w-5 h-5 text-slate-600" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-slate-600" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedLead.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border ${
                      tagColors[index % tagColors.length]
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {tag}
                    <button className="hover:bg-white/50 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <button className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex-1 overflow-y-auto">
              {/* Lead Info Grid */}
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Lead Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Property Interest
                    </label>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-900">{selectedLead.propertyInterest}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Budget</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-900">{selectedLead.budget}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Location</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-900">{selectedLead.location}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Source</label>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-900">{selectedLead.source}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Assigned To
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-900">{selectedLead.assignedTo}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Created Date
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-900">
                        {new Date(selectedLead.createdDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Last Contact
                    </label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-900">
                        {new Date(selectedLead.lastContact).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  {selectedLead.nextFollowUp && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Next Follow-up
                      </label>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <p className="text-sm text-amber-700 font-medium">
                          {new Date(selectedLead.nextFollowUp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h3>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-slate-900">{selectedLead.notes}</p>
                </div>
                <button className="mt-3 text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity Timeline
                </h3>
                <ActivityTimeline activities={selectedLead ? getActivitiesForLead(selectedLead) : []} />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Meeting
                </button>
              </div>
              <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors text-sm flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Lead
              </button>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="w-80 space-y-4">
            {/* Next Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Next Actions
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Follow-up scheduled</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedLead.nextFollowUp &&
                          new Date(selectedLead.nextFollowUp).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                      </p>
                    </div>
                  </div>
                </div>
                <button className="w-full p-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>

            {/* Lead Score Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Lead Score: {selectedLead.score}
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Engagement</span>
                    <span className="text-xs font-medium text-slate-900">{Math.round(selectedLead.score * 40 / 100)}/40</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedLead.score}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Profile Complete</span>
                    <span className="text-xs font-medium text-slate-900">{[!!selectedLead.name && selectedLead.name !== 'Walk-in', !!selectedLead.email, !!selectedLead.phone].filter(Boolean).length * 10}/30</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round([!!selectedLead.name && selectedLead.name !== 'Walk-in', !!selectedLead.email, !!selectedLead.phone].filter(Boolean).length / 3 * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Attendance</span>
                    <span className="text-xs font-medium text-slate-900">{selectedLead.status === 'qualified' ? '30/30' : '0/30'}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${selectedLead.status === 'qualified' ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ width: selectedLead.status === 'qualified' ? '100%' : '0%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Open House Property */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Open House Property
              </h3>
              <div className="space-y-2">
                {selectedLead.propertyInterest ? (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-900">{selectedLead.propertyInterest}</p>
                    <p className="text-xs text-slate-500 mt-1">Registered via open house</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No property associated</p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Interest Level</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedLead.score >= 80 ? 'High' : selectedLead.score >= 60 ? 'Medium' : 'Low'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Source</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedLead.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Attended</span>
                  <span className="text-sm font-semibold text-slate-900">{selectedLead.status === 'qualified' ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Days as Lead</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {selectedLead.createdDate ? Math.floor((Date.now() - new Date(selectedLead.createdDate).getTime()) / 86400000) : 0} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Select a lead to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const activityIcons = {
    email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
    call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    meeting: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    note: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    property_view: { icon: Eye, color: 'text-teal-600', bg: 'bg-teal-50' },
    document: { icon: Upload, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    status_change: { icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
  };

  if (!activities.length) {
    return <p className="text-sm text-slate-500">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const config = activityIcons[activity.type];
        const Icon = config.icon;
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="relative flex flex-col items-center">
              <div className={`w-10 h-10 ${config.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-medium text-slate-900 text-sm">{activity.title}</h4>
                <span className="text-xs text-slate-500">
                  {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1">{activity.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{activity.user}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">
                  {new Date(activity.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
