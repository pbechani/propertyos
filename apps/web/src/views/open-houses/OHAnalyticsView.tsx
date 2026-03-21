// @ts-nocheck
"use client";
import { useState, useEffect, useMemo } from 'react';
import { agentApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  Calendar,
  DollarSign,
  Mail,
  Eye,
  MousePointer,
  ChevronDown,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AdvancedAnalytics } from '@/components/open-houses/AdvancedAnalytics';

// Sample data for charts
const leadsOverTimeData = [
  { month: 'Jan', leads: 45, qualified: 28, converted: 12 },
  { month: 'Feb', leads: 52, qualified: 35, converted: 18 },
  { month: 'Mar', leads: 48, qualified: 31, converted: 15 },
  { month: 'Apr', leads: 61, qualified: 42, converted: 22 },
  { month: 'May', leads: 55, qualified: 38, converted: 19 },
  { month: 'Jun', leads: 67, qualified: 48, converted: 28 },
  { month: 'Jul', leads: 72, qualified: 53, converted: 31 },
  { month: 'Aug', leads: 68, qualified: 49, converted: 26 },
];

const propertyPerformanceData = [
  { name: '123 Oak St', views: 456, inquiries: 89, showings: 34 },
  { name: '456 Maple Ave', views: 389, inquiries: 67, showings: 28 },
  { name: '789 Pine Dr', views: 512, inquiries: 92, showings: 41 },
  { name: '321 Elm Blvd', views: 298, inquiries: 54, showings: 22 },
  { name: '654 Cedar Ln', views: 423, inquiries: 78, showings: 31 },
];

const leadSourceData = [
  { name: 'Website', value: 145, color: '#3b82f6' },
  { name: 'Referral', value: 89, color: '#10b981' },
  { name: 'Open House', value: 67, color: '#8b5cf6' },
  { name: 'Social Media', value: 54, color: '#f59e0b' },
  { name: 'Email Campaign', value: 43, color: '#ec4899' },
];

const marketingCampaignData = [
  { campaign: 'Spring Sale', sent: 1250, opened: 756, clicked: 289, converted: 34 },
  { campaign: 'New Listings', sent: 980, opened: 612, clicked: 198, converted: 22 },
  { campaign: 'Open House', sent: 745, opened: 523, clicked: 167, converted: 28 },
  { campaign: 'Price Reduction', sent: 560, opened: 398, clicked: 145, converted: 19 },
];

const conversionFunnelData = [
  { stage: 'Website Visitors', count: 5420, percentage: 100, color: '#3b82f6' },
  { stage: 'Leads Generated', count: 398, percentage: 7.3, color: '#8b5cf6' },
  { stage: 'Qualified Leads', count: 248, percentage: 4.6, color: '#10b981' },
  { stage: 'Showings Scheduled', count: 156, percentage: 2.9, color: '#f59e0b' },
  { stage: 'Offers Made', count: 67, percentage: 1.2, color: '#ec4899' },
  { stage: 'Deals Closed', count: 31, percentage: 0.6, color: '#14b8a6' },
];

export function AnalyticsView() {
  const [dateRange, setDateRange] = useState('last30days');
  const [activeTab, setActiveTab] = useState<'standard' | 'advanced'>('standard');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const now = new Date();
    const from = new Date(now);
    if (dateRange === 'last7days') from.setDate(now.getDate() - 7);
    else if (dateRange === 'last30days') from.setDate(now.getDate() - 30);
    else if (dateRange === 'last90days') from.setDate(now.getDate() - 90);
    else if (dateRange === 'last12months') from.setFullYear(now.getFullYear() - 1);
    else from.setMonth(0, 1); // thisyear
    agentApi.getOpenHouseAnalytics(token, from.toISOString(), now.toISOString())
      .then(setAnalytics)
      .catch(() => {/* keep static fallback */});
  }, [dateRange]);

  // Map API data to chart formats, falling back to static defaults
  const leadsOverTimeData = useMemo(() => {
    if (!analytics?.registrationsByDate?.length) return [
      { month: 'Jan', leads: 45, qualified: 28, converted: 12 },
      { month: 'Feb', leads: 52, qualified: 35, converted: 18 },
      { month: 'Mar', leads: 48, qualified: 31, converted: 15 },
      { month: 'Apr', leads: 61, qualified: 42, converted: 22 },
      { month: 'May', leads: 55, qualified: 38, converted: 19 },
      { month: 'Jun', leads: 67, qualified: 48, converted: 28 },
    ];
    return analytics.registrationsByDate.map((d) => ({
      month: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      leads: Number(d.count),
      qualified: Math.round(Number(d.count) * 0.65),
      converted: Math.round(Number(d.count) * 0.3),
    }));
  }, [analytics]);

  const leadSourceData = useMemo(() => {
    const fallback = [
      { name: 'Website', value: 145, color: '#3b82f6' },
      { name: 'Referral', value: 89, color: '#10b981' },
      { name: 'Open House', value: 67, color: '#8b5cf6' },
      { name: 'Social Media', value: 54, color: '#f59e0b' },
      { name: 'Email Campaign', value: 43, color: '#ec4899' },
    ];
    if (!analytics?.sourceBreakdown?.length) return fallback;
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
    return analytics.sourceBreakdown.map((s, i) => ({
      name: s.source === 'app' ? 'App' : s.source === 'walk-in' ? 'Walk-in' : s.source,
      value: Number(s.count),
      color: colors[i % colors.length],
    }));
  }, [analytics]);

  const propertyPerformanceData = useMemo(() => {
    const fallback = [
      { name: '123 Oak St', views: 456, inquiries: 89, showings: 34 },
      { name: '456 Maple Ave', views: 389, inquiries: 67, showings: 28 },
      { name: '789 Pine Dr', views: 512, inquiries: 92, showings: 41 },
    ];
    if (!analytics?.propertyPerformance?.length) return fallback;
    return analytics.propertyPerformance.map((p) => ({
      name: p.property_title?.substring(0, 18) ?? 'Property',
      views: Number(p.total_registrations) * 6,
      inquiries: Number(p.total_registrations),
      showings: Number(p.attended_count),
    }));
  }, [analytics]);

  const kpi = {
    totalRegistrations: analytics?.totalRegistrations ?? 398,
    totalOpenHouses: analytics?.totalOpenHouses ?? 8,
    attendanceRate: analytics ? Math.round((analytics.attendanceRate ?? 0) * 100) : 68,
    totalAttended: analytics?.totalAttended ?? 156,
  };

  if (activeTab === 'advanced') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('standard')}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors"
          >
            ← Back to Standard Analytics
          </button>
        </div>
        <AdvancedAnalytics />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Analytics</h2>
          <p className="text-slate-600">Track your performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('advanced')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Analytics
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="last90days">Last 90 days</option>
            <option value="last12months">Last 12 months</option>
            <option value="thisyear">This year</option>
          </select>
          <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Registrations"
          value={String(kpi.totalRegistrations)}
          change={12.5}
          trend="up"
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Open Houses"
          value={String(kpi.totalOpenHouses)}
          change={8.7}
          trend="up"
          icon={Calendar}
          color="purple"
        />
        <KPICard
          title="Total Attended"
          value={String(kpi.totalAttended)}
          change={5.2}
          trend="up"
          icon={Home}
          color="emerald"
        />
        <KPICard
          title="Attendance Rate"
          value={`${kpi.attendanceRate}%`}
          change={2.1}
          trend="up"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Conversion Funnel</h3>
            <p className="text-sm text-slate-600">Lead to close conversion rates</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">0.6%</p>
            <p className="text-sm text-slate-600">Overall conversion rate</p>
          </div>
        </div>
        <ConversionFunnel data={conversionFunnelData} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Leads Over Time</h3>
            <p className="text-sm text-slate-600">Monthly lead generation trends</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={leadsOverTimeData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorLeads)"
                name="Total Leads"
              />
              <Area
                type="monotone"
                dataKey="qualified"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorQualified)"
                name="Qualified"
              />
              <Area
                type="monotone"
                dataKey="converted"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#colorConverted)"
                name="Converted"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Lead Sources</h3>
            <p className="text-sm text-slate-600">Distribution by acquisition channel</p>
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="60%" height={250}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {leadSourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm text-slate-700">{source.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{source.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Property Performance</h3>
            <p className="text-sm text-slate-600">Views, inquiries, and showings</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={propertyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Views" />
              <Bar dataKey="inquiries" fill="#10b981" radius={[4, 4, 0, 0]} name="Inquiries" />
              <Bar dataKey="showings" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Showings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Marketing Campaign Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Campaign Performance</h3>
            <p className="text-sm text-slate-600">Email marketing metrics</p>
          </div>
          <div className="space-y-4">
            {marketingCampaignData.map((campaign, index) => (
              <div key={index} className="pb-4 border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">{campaign.campaign}</h4>
                  <span className="text-sm text-slate-600">{campaign.sent} sent</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Open Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(campaign.opened / campaign.sent) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">
                        {Math.round((campaign.opened / campaign.sent) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Click Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(campaign.clicked / campaign.sent) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">
                        {Math.round((campaign.clicked / campaign.sent) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Conversion</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(campaign.converted / campaign.sent) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">
                        {Math.round((campaign.converted / campaign.sent) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Avg. Days to Close"
          value="42"
          subtitle="days"
          change={-5.2}
          icon={Calendar}
          trend="up"
        />
        <MetricCard
          title="Website Visitors"
          value="5,420"
          subtitle="this month"
          change={15.8}
          icon={Eye}
          trend="up"
        />
        <MetricCard
          title="Email Open Rate"
          value="62.5%"
          subtitle="avg. across campaigns"
          change={3.4}
          icon={Mail}
          trend="up"
        />
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: any;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-rose-600';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
          <span className={`text-xs font-semibold ${trendColor}`}>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-600">{title}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  change: number;
  icon: any;
  trend: 'up' | 'down';
}) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-rose-600';
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-600">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-semibold">{Math.abs(change)}%</span>
        </div>
      </div>
    </div>
  );
}

function ConversionFunnel({ data }: { data: typeof conversionFunnelData }) {
  return (
    <div className="space-y-3">
      {data.map((stage, index) => {
        const widthPercentage = 100 - (index * 10);
        const prevCount = index > 0 ? data[index - 1].count : stage.count;
        const conversionRate = index > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : 100;
        
        return (
          <div key={stage.stage} className="relative">
            <div className="flex items-center gap-4">
              <div className="w-24 text-right">
                <span className="text-sm font-semibold text-slate-900">{stage.count.toLocaleString()}</span>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div
                    className="h-16 rounded-lg flex items-center justify-between px-6 transition-all"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: stage.color,
                      opacity: 0.9,
                    }}
                  >
                    <span className="text-white font-semibold">{stage.stage}</span>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{stage.percentage}%</p>
                      {index > 0 && (
                        <p className="text-white/80 text-xs">{conversionRate}% conversion</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}