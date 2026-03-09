'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Flame, TrendingUp, DollarSign, Phone, Mail, MessageSquare, Calendar, CheckSquare, Loader2 } from 'lucide-react';
import { leadsApi, type LeadDashboardResponse } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const temperatureConfig: Record<string, { label: string; color: string }> = {
  hot: { label: 'Hot', color: 'bg-red-100 text-red-700 border-red-200' },
  warm: { label: 'Warm', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  cold: { label: 'Cold', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  nurture: { label: 'Nurture', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const activityIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4 text-blue-500" />,
  call: <Phone className="h-4 w-4 text-green-500" />,
  sms: <MessageSquare className="h-4 w-4 text-purple-500" />,
  meeting: <Calendar className="h-4 w-4 text-orange-500" />,
  stage_change: <TrendingUp className="h-4 w-4 text-indigo-500" />,
};

const priorityColors: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-orange-500',
  low: 'text-green-500',
};

const typeLabels: Record<string, string> = {
  buyer: 'Buyers',
  seller: 'Sellers',
  investor: 'Investors',
  renter: 'Renters',
};

const typeColors: Record<string, string> = {
  buyer: 'bg-blue-500',
  seller: 'bg-green-500',
  investor: 'bg-purple-500',
  renter: 'bg-orange-500',
};

const EMPTY: LeadDashboardResponse = {
  totalLeads: 0, hotLeads: 0, activeDeals: 0, pipelineValue: 0,
  pendingTasks: [], recentActivities: [], byType: {}, byTemperature: {},
};

export default function LeadDashboard() {
  const [dashboard, setDashboard] = useState<LeadDashboardResponse>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    leadsApi.getDashboard(token)
      .then(setDashboard)
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 py-8 text-center">{error}</p>;
  }

  const { totalLeads, hotLeads, activeDeals, pipelineValue, pendingTasks, recentActivities, byType, byTemperature } = dashboard;

  const formattedPipelineValue = pipelineValue >= 1_000_000
    ? `R${(pipelineValue / 1_000_000).toFixed(1)}M`
    : pipelineValue >= 1_000
    ? `R${(pipelineValue / 1_000).toFixed(0)}K`
    : `R${pipelineValue.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lead Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your pipeline and activity</p>
        </div>
        <Link
          href="/app/leads"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          View All Leads
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{totalLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hot Leads</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{hotLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Flame className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{activeDeals}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <p className="text-3xl font-semibold text-foreground mt-1">{formattedPipelineValue}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              Pending Tasks
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {pendingTasks.length} pending
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {pendingTasks.map((task) => (
              <div key={task.id} className="py-3 flex items-start gap-3">
                <input type="checkbox" className="mt-0.5 rounded border-border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{task.type.replace(/_/g, ' ')}</p>
                </div>
                <span className={`text-xs font-medium capitalize ${priorityColors[task.priority] ?? 'text-gray-500'}`}>
                  {task.priority}
                </span>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground text-center">All tasks complete!</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="py-3 flex items-start gap-3">
                <div className="mt-0.5">{activityIcons[activity.type] ?? <Calendar className="h-4 w-4 text-muted-foreground" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                  {activity.actor_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.actor_name}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground text-center">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead Distribution */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Lead Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(typeLabels).map(([key, label]) => (
              <div key={key} className="rounded-xl bg-muted/50 p-4 text-center">
                <div className={`mx-auto h-3 w-3 rounded-full ${typeColors[key] ?? 'bg-gray-400'} mb-2`} />
                <p className="text-2xl font-semibold text-foreground">{byType[key] ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Temperature breakdown */}
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">By Temperature</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(temperatureConfig).map(([key, cfg]) => (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.color}`}
                >
                  {cfg.label}
                  <span className="font-semibold">{byTemperature[key] ?? 0}</span>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
