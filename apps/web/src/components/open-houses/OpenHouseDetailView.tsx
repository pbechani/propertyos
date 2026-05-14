// @ts-nocheck
"use client"
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Edit,
  MoreVertical,
  Home,
  Bed,
  Bath,
  Square,
  TrendingUp,
  CheckCircle2,
  Circle,
  Mail,
  Phone,
  MessageSquare,
  Download,
  Eye,
  Send,
  ThumbsUp,
  Heart,
  DollarSign,
  Flag,
  AlertCircle,
  CheckSquare,
  Image as ImageIcon,
  FileText,
  Video,
  ExternalLink,
  UserCheck,
  UserX,
  Clock3,
  Filter,
  Search,
  Plus,
  Sparkles,
  Tablet,
} from 'lucide-react';
import { TabletSignIn } from './TabletSignIn';
import { useRouter } from 'next/navigation';
import { agentApi, propertiesApi, viewingActionsApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

interface OpenHouseDetail {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  propertyType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'today' | 'completed';
  description: string;
  features: string[];
  images: string[];
  latitude?: string | null;
  longitude?: string | null;
  viewCount: number;
  marketingActive: boolean;
  tasksCompleted: number;
  tasksTotal: number;
}

interface RSVP {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  guests: number;
  source: string;
  rsvpDate: string;
  notes: string;
  attended?: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: 'before' | 'during' | 'after';
  dueDate?: string;
  assignee?: string;
}

interface MarketingItem {
  id: string;
  type: 'email' | 'social' | 'flyer' | 'video';
  title: string;
  status: 'draft' | 'scheduled' | 'published';
  reach?: number;
  engagement?: number;
  publishDate?: string;
}

export function OpenHouseDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const router = useRouter();
  const [openHouseData, setOpenHouseData] = useState<OpenHouseDetail | null>(null);
  const [rsvpsData, setRsvpsData] = useState<RSVP[]>([]);
  const [tasksData, setTasksData] = useState<Task[]>([]);
  const [marketingData, setMarketingData] = useState<MarketingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'marketing' | 'rsvps'>('overview');
  const [showTabletSignIn, setShowTabletSignIn] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    agentApi.getOpenHouses(token)
      .then((openHouses) => {
        const record = (openHouses ?? []).find((r) => r.id === id);
        if (!record) { setError('Open house not found'); setLoading(false); return; }
        return Promise.all([
          propertiesApi.getById(record.property_id, token),
          viewingActionsApi.getOpenHouseRegistrations(token, id),
        ]).then(([listing, attendees]) => {
        const now = new Date();
        const start = new Date(record.scheduled_at);
        const end = new Date(record.end_at);
        const isLive = record.status === 'scheduled' && now >= start && now <= end;

        setOpenHouseData({
          id: record.id,
          address: listing?.location?.address_line1 ?? record.property_title ?? listing?.title ?? '',
          city: listing?.location?.city ?? '',
          state: listing?.location?.region ?? '',
          zip: listing?.location?.postal_code ?? '',
          price: listing ? Number(listing.price) : 0,
          bedrooms: listing?.bedrooms ?? 0,
          bathrooms: listing?.bathrooms ?? 0,
          sqft: listing?.area_sqm ? Number(listing.area_sqm) : 0,
          propertyType: listing?.property_type ? listing.property_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '',
          date: start.toISOString().split('T')[0],
          startTime: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          endTime: end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          status: isLive ? 'today' : record.status === 'completed' ? 'completed' : 'upcoming',
          description: record.description ?? listing?.description ?? '',
          features: listing?.features ?? [],
          images: (listing?.media ?? []).filter((m) => m.media_type === 'image').map((m) => m.url),
          latitude: listing?.location?.latitude ?? null,
          longitude: listing?.location?.longitude ?? null,
          viewCount: listing?.view_count ?? 0,
          marketingActive: (record.marketing_options ?? []).some((o) => o.enabled),
          tasksCompleted: (record.preparation_checklist ?? []).filter((t) => t.completed).length,
          tasksTotal: (record.preparation_checklist ?? []).length,
        });

        const channelToType = (ch) => {
          const c = ch.toLowerCase();
          if (c === 'email') return 'email';
          if (['facebook', 'instagram', 'twitter', 'social'].includes(c)) return 'social';
          if (c === 'flyer' || c === 'print') return 'flyer';
          if (c === 'video') return 'video';
          return 'email';
        };

        setTasksData((record.preparation_checklist ?? []).map((item, i) => ({
          id: String(i + 1),
          title: item.task,
          completed: item.completed,
          category: 'before',
        })));

        setMarketingData((record.marketing_options ?? []).map((opt, i) => ({
          id: String(i + 1),
          type: channelToType(opt.channel),
          title: opt.channel.charAt(0).toUpperCase() + opt.channel.slice(1),
          status: opt.enabled ? 'published' : 'draft',
        })));

        setRsvpsData((attendees ?? []).map((a) => ({
          id: a.id,
          name: (a.guest_name ?? [a.first_name, a.last_name].filter(Boolean).join(' ')) || 'Walk-in',
          email: a.guest_email ?? a.email ?? '',
          phone: a.guest_phone ?? a.phone ?? '',
          status: a.attended ? 'confirmed' : a.checked_in_at ? 'confirmed' : 'pending',
          guests: 1,
          source: a.buyer_id ? 'App' : 'Walk-in',
          rsvpDate: a.registered_at.split('T')[0],
          notes: a.notes ?? '',
          attended: a.attended ?? false,
        })));
        }); // end Promise.all
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <span>Loading open house...</span>
    </div>
  );
  if (error || !openHouseData) return (
    <div className="flex items-center justify-center py-24 text-rose-500">
      <span>{error ?? 'Open house not found'}</span>
    </div>
  );

  if (showTabletSignIn) {
    return <TabletSignIn openHouseId={id} onClose={() => setShowTabletSignIn(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{openHouseData.address}</h1>
            <p className="text-slate-600">
              {openHouseData.city}, {openHouseData.state} {openHouseData.zip}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTabletSignIn(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Tablet Sign-In</span>
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button className="w-10 h-10 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">Date & Time</span>
          </div>
          <p className="font-semibold text-slate-900">
            {new Date(openHouseData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-sm text-slate-600">
            {new Date(`2000-01-01T${openHouseData.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(`2000-01-01T${openHouseData.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">RSVPs</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{rsvpsData.filter(r => r.status === 'confirmed').length}</p>
          <p className="text-sm text-slate-600">{rsvpsData.length} total responses</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">List Price</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">
            ${(openHouseData.price / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-emerald-600">Market Ready</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">Tasks</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">
            {tasksData.filter(t => t.completed).length}/{tasksData.length}
          </p>
          <p className="text-sm text-slate-600">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: tasksData.filter(t => !t.completed).length },
            { id: 'marketing', label: 'Marketing', icon: Send },
            { id: 'rsvps', label: 'RSVPs', icon: Users, badge: rsvpsData.length },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-2 py-0.5 bg-slate-900 text-white text-xs font-medium rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab property={openHouseData} />}
        {activeTab === 'tasks' && <TasksTab tasks={tasksData} openHouseId={id} />}
        {activeTab === 'marketing' && <MarketingTab items={marketingData} property={openHouseData} />}
        {activeTab === 'rsvps' && <RSVPsTab rsvps={rsvpsData} openHouseId={id} />}
      </div>
    </div>
  );
}

function OverviewTab({ property }: { property: OpenHouseDetail }) {
  const [activeImg, setActiveImg] = useState(0);
  const hasImages = property.images.length > 0;
  const mapSrc = property.latitude && property.longitude
    ? `https://www.openstreetmap.org/export/embed.html?mlat=${property.latitude}&mlon=${property.longitude}&zoom=15&layers=M`
    : `https://maps.google.com/maps?q=${encodeURIComponent([property.address, property.city, property.state, property.zip].filter(Boolean).join(', '))}&output=embed`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Property Images */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {hasImages ? (
            <>
              <div className="h-80 relative overflow-hidden">
                <img
                  src={property.images[activeImg]}
                  alt={`Property photo ${activeImg + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50">
                  {property.images.slice(0, 4).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-colors ${
                        activeImg === i ? 'border-slate-900' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-80 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Property Photos</p>
                <p className="text-sm text-slate-500">No photos available yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Bed className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Bedrooms</p>
                <p className="font-semibold text-slate-900">{property.bedrooms}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Bath className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Bathrooms</p>
                <p className="font-semibold text-slate-900">{property.bathrooms}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Square className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Area (m²)</p>
                <p className="font-semibold text-slate-900">{property.sqft.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Type</p>
                <p className="font-semibold text-slate-900 text-sm">{property.propertyType}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-slate-900 mb-3">Description</h4>
            <p className="text-slate-700 leading-relaxed">{property.description}</p>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-3">Key Features</h4>
            <div className="grid grid-cols-2 gap-2">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Location</h3>
          <div className="h-64 rounded-lg overflow-hidden mb-4 border border-slate-200">
            <iframe
              title="Property location map"
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-slate-700">
            <MapPin className="w-4 h-4 inline mr-2" />
            {property.address}, {property.city}, {property.state} {property.zip}
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Page Views</span>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">{property.viewCount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Tasks Done</span>
              <div className="flex items-center gap-1">
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900">{property.tasksCompleted}/{property.tasksTotal}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Marketing</span>
              <div className="flex items-center gap-1">
                <Send className="w-4 h-4 text-slate-400" />
                <span className={`font-semibold ${property.marketingActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {property.marketingActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                property.status === 'today' ? 'bg-blue-500' :
                property.status === 'completed' ? 'bg-slate-400' : 'bg-emerald-500'
              }`} />
              <span className="text-slate-700">
                Open House{' '}
                {property.status === 'today' ? 'Live Now' :
                 property.status === 'completed' ? 'Completed' : 'Scheduled'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${property.marketingActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-slate-700">Marketing {property.marketingActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                property.tasksTotal === 0 ? 'bg-slate-300' :
                property.tasksCompleted === property.tasksTotal ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <span className="text-slate-700">
                Tasks{' '}
                {property.tasksTotal === 0 ? 'None set' :
                 property.tasksCompleted === property.tasksTotal ? 'All Complete' :
                 `${property.tasksCompleted}/${property.tasksTotal} Done`}
              </span>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Documents</h3>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <FileText className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No documents attached</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksTab({ tasks, openHouseId }: { tasks: Task[]; openHouseId: string }) {
  const [taskList, setTaskList] = useState(tasks);
  const [filter, setFilter] = useState<'all' | 'before' | 'during' | 'after'>('all');

  const toggleTask = (id: string) => {
    const updated = taskList.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTaskList(updated);
    const token = getAccessToken();
    if (token && openHouseId) {
      agentApi.updateOpenHouse(token, openHouseId, {
        preparationChecklist: updated.map((t) => ({ task: t.title, completed: t.completed })),
      }).catch(() => {/* silent — optimistic update stays */});
    }
  };

  const filteredTasks = taskList.filter((task) => filter === 'all' || task.category === filter);

  const categoryConfig = {
    before: { label: 'Before Event', color: 'text-blue-600', bg: 'bg-blue-50' },
    during: { label: 'During Event', color: 'text-purple-600', bg: 'bg-purple-50' },
    after: { label: 'After Event', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  };

  const completionRate = Math.round((taskList.filter((t) => t.completed).length / taskList.length) * 100);

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Task Progress</h3>
            <p className="text-sm text-slate-600">
              {taskList.filter((t) => t.completed).length} of {taskList.length} tasks completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{completionRate}%</p>
          </div>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Tasks
        </button>
        {(['before', 'during', 'after'] as const).map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === category
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {categoryConfig[category].label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {(['before', 'during', 'after'] as const).map((category) => {
          const categoryTasks = filteredTasks.filter((task) => task.category === category);
          if (categoryTasks.length === 0 && filter !== 'all') return null;

          return (
            <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={`px-6 py-3 border-b border-slate-200 ${categoryConfig[category].bg}`}>
                <h4 className={`font-semibold ${categoryConfig[category].color}`}>
                  {categoryConfig[category].label}
                  <span className="ml-2 text-sm">
                    ({categoryTasks.filter((t) => t.completed).length}/{categoryTasks.length})
                  </span>
                </h4>
              </div>
              <div className="divide-y divide-slate-100">
                {categoryTasks.map((task) => (
                  <div
                    key={task.id}
                    className="px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-1"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            task.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          {task.dueDate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {task.assignee && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {task.assignee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Button */}
      <button className="w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 font-medium">
        <Plus className="w-4 h-4" />
        Add Task
      </button>
    </div>
  );
}

function MarketingTab({ items, property }: { items: MarketingItem[]; property: OpenHouseDetail }) {
  const typeConfig = {
    email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
    social: { icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50' },
    flyer: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    video: { icon: Video, color: 'text-rose-600', bg: 'bg-rose-50' },
  };

  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    published: { label: 'Published', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  return (
    <div className="space-y-6">
      {/* Marketing Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Reach', value: '3.8K', icon: TrendingUp },
          { label: 'Engagement', value: '458', icon: ThumbsUp },
          { label: 'Campaigns', value: '5', icon: Send },
          { label: 'Avg. CTR', value: '12.4%', icon: Eye },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-600">{stat.label}</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* AI Content Generator */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">AI Marketing Assistant</h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate social media posts, email content, and property descriptions instantly
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all text-sm">
                Generate Social Post
              </button>
              <button className="px-4 py-2 bg-white border border-purple-200 text-slate-700 rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm">
                Email Template
              </button>
              <button className="px-4 py-2 bg-white border border-purple-200 text-slate-700 rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm">
                Property Description
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Marketing Materials</h3>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Material
          </button>
        </div>
        <div className="divide-y divide-slate-200">
          {items.map((item) => {
            const Icon = typeConfig[item.type].icon;
            return (
              <div key={item.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${typeConfig[item.type].bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${typeConfig[item.type].color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-600">
                          {item.publishDate
                            ? `Published ${new Date(item.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : 'Not published'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                          statusConfig[item.status].color
                        }`}
                      >
                        {statusConfig[item.status].label}
                      </span>
                    </div>
                    {item.reach !== undefined && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Eye className="w-4 h-4" />
                          <span>{item.reach.toLocaleString()} reach</span>
                        </div>
                        {item.engagement !== undefined && (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{item.engagement} engagement</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1">
                    View
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RSVPsTab({ rsvps, openHouseId }: { rsvps: RSVP[]; openHouseId: string }) {
  const [rsvpList, setRsvpList] = useState(rsvps);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const handleMarkAttended = async (rsvpId: string) => {
    const token = getAccessToken();
    if (!token || !openHouseId) return;
    setCheckingIn(rsvpId);
    try {
      await viewingActionsApi.checkInAttendee(token, openHouseId, { registrationId: rsvpId });
      setRsvpList((prev) =>
        prev.map((r) => r.id === rsvpId ? { ...r, attended: true, status: 'confirmed' } : r)
      );
    } catch {/* ignore */} finally {
      setCheckingIn(null);
    }
  };

  const filteredRSVPs = rsvpList.filter((rsvp) => {
    const matchesSearch =
      rsvp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rsvp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rsvp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    confirmed: { label: 'Confirmed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: UserCheck },
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3 },
    cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: UserX },
  };

  const totalGuests = rsvpList.filter((r) => r.status === 'confirmed').reduce((sum, r) => sum + r.guests, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-slate-600">Confirmed</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">
            {rsvpList.filter((r) => r.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock3 className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-slate-600">Pending</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">
            {rsvpList.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-slate-600">Total Guests</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{totalGuests}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-slate-600">Response Rate</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">87%</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search RSVPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* RSVP List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {filteredRSVPs.map((rsvp) => {
            const StatusIcon = statusConfig[rsvp.status].icon;
            return (
              <div key={rsvp.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {rsvp.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-slate-900">{rsvp.name}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {rsvp.email}
                          </span>
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {rsvp.phone}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          statusConfig[rsvp.status].color
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[rsvp.status].label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {rsvp.guests} {rsvp.guests === 1 ? 'guest' : 'guests'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        RSVP'd {new Date(rsvp.rsvpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        {rsvp.source}
                      </span>
                    </div>
                    {rsvp.notes && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {rsvp.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!rsvp.attended && (
                      <button
                        onClick={() => handleMarkAttended(rsvp.id)}
                        disabled={checkingIn === rsvp.id}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        title="Mark as attended"
                      >
                        {checkingIn === rsvp.id ? '...' : '✓ Attended'}
                      </button>
                    )}
                    {rsvp.attended && (
                      <span className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg">
                        Attended
                      </span>
                    )}
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Send email">
                      <Mail className="w-4 h-4 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Send SMS">
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="More options">
                      <MoreVertical className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Export RSVPs
        </button>
        <button className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
          <Mail className="w-4 h-4" />
          Send Reminder
        </button>
      </div>
    </div>
  );
}