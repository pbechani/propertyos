'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  User,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  MoreVertical,
  UserPlus,
  Video,
  Plus,
  Timer,
  CreditCard,
  Zap,
  Award,
  TrendingDown,
  FileText,
  Activity,
  Flag,
  Home,
  Phone as PhoneCall,
  Mail as MailIcon,
  Bed,
  Bath,
} from 'lucide-react';
import { leadsApi, type LeadRow, type LeadActivityRow } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { ConvertToClientModal } from '@/components/my-listings/ConvertToClientModal';
import { ScheduleFollowUpModal } from '@/components/my-listings/ScheduleFollowUpModal';
import { SendPropertiesModal } from '@/components/my-listings/SendPropertiesModal';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
  if (diffInHours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusConfig(temperature: string, stage: string) {
  if (stage === 'closed') return { label: 'Converted', color: 'bg-emerald-100 text-emerald-700', icon: Award };
  if (stage === 'lost')   return { label: 'Lost',      color: 'bg-gray-100 text-gray-700',       icon: XCircle };
  switch (temperature) {
    case 'hot':    return { label: 'Hot Lead',  color: 'bg-red-100 text-red-700',       icon: Zap };
    case 'warm':   return { label: 'Nurturing', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    case 'cold':   return { label: 'Cold',      color: 'bg-gray-100 text-gray-700',     icon: TrendingDown };
    case 'nurture':return { label: 'Nurturing', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    default:       return { label: stage || 'New', color: 'bg-blue-100 text-blue-700',  icon: AlertCircle };
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'email':         return Mail;
    case 'call':          return Phone;
    case 'sms':           return MessageSquare;
    case 'meeting':       return Video;
    case 'note':          return FileText;
    case 'property-sent': return Home;
    case 'viewing':       return Eye;
    default:              return Activity;
  }
}

function formatBudget(min: string | null, max: string | null, currency: string) {
  if (!min && !max) return null;
  const fmt = (v: string) => parseFloat(v).toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

/** Parse the structured preferences string saved by AddLeadModal */
function parsePreferences(raw: string | null) {
  if (!raw) return null;
  const result: {
    types: string[];
    locations: string[];
    bedrooms: string | null;
    bathrooms: string | null;
    features: string[];
    motivation: string | null;
    other: string[];
  } = { types: [], locations: [], bedrooms: null, bathrooms: null, features: [], motivation: null, other: [] };

  for (const line of raw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { result.other.push(line.trim()); continue; }
    const key   = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (key === 'types')      result.types      = value.split(',').map((s) => s.trim()).filter(Boolean);
    else if (key === 'locations') result.locations  = value.split(',').map((s) => s.trim()).filter(Boolean);
    else if (key === 'bedrooms')  result.bedrooms   = value;
    else if (key === 'bathrooms') result.bathrooms  = value;
    else if (key === 'features')  result.features   = value.split(',').map((s) => s.trim()).filter(Boolean);
    else if (key === 'motivation') result.motivation = value;
    else result.other.push(line.trim());
  }
  return result;
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const leadId    = params.leadId as string;

  const [lead, setLead]             = useState<LeadRow | null>(null);
  const [activities, setActivities] = useState<LeadActivityRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote]       = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showSendPropsModal, setShowSendPropsModal] = useState(false);
  const [authToken, setAuthToken]   = useState<string | null>(null);

  const loadLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      setAuthToken(token);
      const [leadData, activityData] = await Promise.all([
        leadsApi.getById(token, leadId),
        leadsApi.listActivities(token, leadId),
      ]);
      setLead(leadData);
      setActivities(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { loadLead(); }, [loadLead]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;
    setSavingNote(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      await leadsApi.createActivity(token, leadId, { type: 'note', description: newNote.trim() });
      setNewNote('');
      setShowNoteModal(false);
      await loadLead();
    } catch {
      // silently ignore for now
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading lead…</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600">{error ?? 'Lead not found'}</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(lead.temperature, lead.stage);
  const StatusIcon   = statusConfig.icon;
  const initials     = lead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const budgetLabel  = formatBudget(lead.budget_min, lead.budget_max, lead.budget_currency);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/app/my-listings/${listingId}?tab=leads`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                  {initials}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{lead.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {lead.source ? `${lead.source} • ` : ''}Created {formatTimestamp(lead.created_at)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConvertModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Convert to Client
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* ── Main Content ──────────────────────────────────────────────── */}
          <div className="col-span-2 space-y-6">

            {/* Status Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg ${statusConfig.color} flex items-center gap-2 font-medium`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </div>
                  <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                    lead.prequalified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {lead.prequalified ? 'Pre-Qualified' : 'Not Pre-Qualified'}
                  </div>
                </div>
                {lead.next_follow_up && (
                  <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-100 px-4 py-2 rounded-lg">
                    <Clock className="w-4 h-4" />
                    Follow-up: {new Date(lead.next_follow_up).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Call Lead</span>
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MailIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Send Email</span>
                </a>
              )}
              <button className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Schedule</span>
              </button>
              <button onClick={() => setShowNoteModal(true)} className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add Note</span>
              </button>
            </div>

            {/* Qualification Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualification Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <User className="w-4 h-4" />
                    Lead Type
                  </div>
                  <div className="text-gray-900 font-medium capitalize">{lead.type}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Pre-Qualification
                  </div>
                  <div className={`font-medium ${lead.prequalified ? 'text-green-700' : 'text-gray-700'}`}>
                    {lead.prequalified ? 'Pre-Qualified ✓' : 'Not Pre-Qualified'}
                  </div>
                </div>
                {lead.timeline && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Timer className="w-4 h-4" />
                      Timeline
                    </div>
                    <div className="text-gray-900 font-medium">{lead.timeline}</div>
                  </div>
                )}
                {budgetLabel && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <DollarSign className="w-4 h-4" />
                      Budget Range
                    </div>
                    <div className="text-gray-900 font-medium">{budgetLabel}</div>
                  </div>
                )}
                {lead.deal_value && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <CreditCard className="w-4 h-4" />
                      Deal Value
                    </div>
                    <div className="text-gray-900 font-medium">
                      {parseFloat(lead.deal_value).toLocaleString('en-US', {
                        style: 'currency',
                        currency: lead.budget_currency,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Flag className="w-4 h-4" />
                    Stage
                  </div>
                  <div className="text-gray-900 font-medium capitalize">{lead.stage.replace(/_/g, ' ')}</div>
                </div>
              </div>
            </div>

            {/* Property Interests */}
            {(() => {
              const parsed = parsePreferences(lead.preferences);
              const hasBudget = !!(lead.budget_min || lead.budget_max);
              const hasInterests = parsed && (
                parsed.types.length || parsed.locations.length ||
                parsed.bedrooms || parsed.bathrooms ||
                parsed.features.length || parsed.motivation || parsed.other.length
              );
              if (!hasInterests && !hasBudget) return null;
              return (
                <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-white mb-5">Property Interests</h3>
                  <div className="space-y-5">

                    {/* Property Types */}
                    {parsed && parsed.types.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Property Types</div>
                        <div className="flex flex-wrap gap-2">
                          {parsed.types.map((t) => (
                            <span key={t} className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preferred Locations */}
                    {parsed && parsed.locations.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Preferred Locations</div>
                        <div className="flex flex-wrap gap-2">
                          {parsed.locations.map((loc) => (
                            <span key={loc} className="px-3 py-1 bg-gray-800 border border-gray-600 text-purple-400 text-sm font-medium rounded-full flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {loc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats row: bedrooms / bathrooms / price */}
                    {(parsed?.bedrooms || parsed?.bathrooms || hasBudget) && (
                      <div className="grid grid-cols-3 gap-4 pt-1">
                        {parsed?.bedrooms && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Min. Bedrooms</div>
                            <div className="flex items-center gap-2 text-white font-semibold">
                              <Bed className="w-4 h-4 text-gray-400" />
                              {parsed.bedrooms}+
                            </div>
                          </div>
                        )}
                        {parsed?.bathrooms && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Min. Bathrooms</div>
                            <div className="flex items-center gap-2 text-white font-semibold">
                              <Bath className="w-4 h-4 text-gray-400" />
                              {parsed.bathrooms}+
                            </div>
                          </div>
                        )}
                        {hasBudget && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Price Range</div>
                            <div className="text-white font-semibold">{budgetLabel}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Must-Haves / Features */}
                    {parsed && parsed.features.length > 0 && (
                      <div className="pt-1 border-t border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Must-Haves</div>
                        <div className="flex flex-wrap gap-2">
                          {parsed.features.map((f) => (
                            <span key={f} className="px-3 py-1 bg-green-900 border border-green-700 text-green-400 text-sm font-medium rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Motivation / other freeform notes */}
                    {parsed && (parsed.motivation || parsed.other.length > 0) && (
                      <div className="pt-1 border-t border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">Notes</div>
                        <p className="text-sm text-gray-300">
                          {[parsed.motivation, ...parsed.other].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              </div>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <ActivityIcon className="w-5 h-5" />
                          </div>
                          {index < activities.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{formatTimestamp(activity.created_at)}</span>
                          </div>
                          {activity.actor_name && (
                            <p className="text-xs text-gray-500">by {activity.actor_name}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3 mb-4">
                {lead.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline break-all">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{lead.address}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call Lead
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Send Email
                  </a>
                )}
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send SMS
                </button>
              </div>
            </div>

            {/* Lead Score Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Score</h3>
              <div className="space-y-3">
                {[
                  { label: 'Qualification', value: lead.prequalified ? 95 : 60 },
                  { label: 'Engagement',    value: activities.length > 5 ? 88 : activities.length > 2 ? 65 : 30 },
                  { label: 'Readiness',     value: lead.temperature === 'hot' ? 93 : lead.temperature === 'warm' ? 70 : 40 },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}/100</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h3>
              <div className="space-y-3">
                {lead.source && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Source</div>
                    <div className="font-medium text-gray-900 capitalize">{lead.source.replace(/-/g, ' ')}</div>
                  </div>
                )}
                {lead.assigned_agent_name && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Assigned To</div>
                    <div className="font-medium text-gray-900">{lead.assigned_agent_name}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-1">Created</div>
                  <div className="font-medium text-gray-900">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                </div>
                {lead.last_contact_at && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Last Contact</div>
                    <div className="font-medium text-gray-900">
                      {new Date(lead.last_contact_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm">
                  <UserPlus className="w-4 h-4" />
                  Convert to Client
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                  onClick={() => setShowFollowUpModal(true)}>
                  <Calendar className="w-4 h-4" />
                  Schedule Follow-up
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                  onClick={() => setShowSendPropsModal(true)}>
                  <Home className="w-4 h-4" />
                  Send Properties
                </button>
                <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4" />
                  Mark as Lost
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Note</h2>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={6}
                placeholder="Add a note about this lead…"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !newNote.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingNote ? 'Saving…' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Convert to Client Modal ───────────────────────────────────── */}
      {showConvertModal && authToken && (
        <ConvertToClientModal
          lead={lead}
          authToken={authToken}
          onClose={() => setShowConvertModal(false)}
          onSuccess={() => {
            setShowConvertModal(false);
            loadLead();
          }}
        />
      )}

      {/* ── Schedule Follow-Up Modal ──────────────────────────────────── */}
      {showFollowUpModal && authToken && (
        <ScheduleFollowUpModal
          lead={lead}
          authToken={authToken}
          onClose={() => setShowFollowUpModal(false)}
          onSuccess={() => {
            setShowFollowUpModal(false);
            loadLead();
          }}
        />
      )}

      {/* ── Send Properties Modal ─────────────────────────────────────── */}
      {showSendPropsModal && authToken && (
        <SendPropertiesModal
          lead={lead}
          authToken={authToken}
          onClose={() => setShowSendPropsModal(false)}
          onSuccess={() => {
            setShowSendPropsModal(false);
            loadLead();
          }}
        />
      )}
    </div>
  );
}
