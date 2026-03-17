'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Flame, TrendingUp, DollarSign, Phone, Mail, MessageSquare, Calendar, CheckSquare, Loader2, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { leadsApi, type LeadDashboardResponse } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEMPERATURE_CONFIG, LEAD_TYPE_LABELS, LEAD_TYPE_COLORS } from '@/lib/constants';
import { getPriorityTextColor } from '@/lib/status-colors';

const activityIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4 text-blue-500" />,
  call: <Phone className="h-4 w-4 text-green-500" />,
  sms: <MessageSquare className="h-4 w-4 text-purple-500" />,
  meeting: <Calendar className="h-4 w-4 text-orange-500" />,
  stage_change: <TrendingUp className="h-4 w-4 text-indigo-500" />,
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
        <Card className="p-5 bg-linear-to-br from-blue-600 to-blue-700 text-white border-0 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <TrendingUp className="h-4 w-4 text-white/60" />
          </div>
          <p className="text-xs opacity-90 mb-1">Total Leads</p>
          <p className="text-2xl font-bold">{totalLeads}</p>
          <p className="text-xs opacity-75 mt-1">All tracked leads</p>
        </Card>

        <Card className="p-5 bg-linear-to-br from-red-500 to-red-600 text-white border-0 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
            <AlertCircle className="h-4 w-4 text-white/60" />
          </div>
          <p className="text-xs opacity-90 mb-1">Hot Leads</p>
          <p className="text-2xl font-bold">{hotLeads}</p>
          <p className="text-xs opacity-75 mt-1">High priority</p>
        </Card>

        <Card className="p-5 bg-linear-to-br from-green-500 to-green-600 text-white border-0 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <CheckCircle2 className="h-4 w-4 text-white/60" />
          </div>
          <p className="text-xs opacity-90 mb-1">Active Deals</p>
          <p className="text-2xl font-bold">{activeDeals}</p>
          <p className="text-xs opacity-75 mt-1">In progress</p>
        </Card>

        <Card className="p-5 bg-linear-to-br from-purple-500 to-purple-600 text-white border-0 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <BarChart3 className="h-4 w-4 text-white/60" />
          </div>
          <p className="text-xs opacity-90 mb-1">Pipeline Value</p>
          <p className="text-2xl font-bold">{formattedPipelineValue}</p>
          <p className="text-xs opacity-75 mt-1">Total opportunity</p>
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
                <span className={`text-xs font-medium capitalize ${getPriorityTextColor(task.priority)}`}>
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
            {Object.entries(LEAD_TYPE_LABELS).map(([key, label]) => (
              <div key={key} className="rounded-xl bg-muted/50 p-4 text-center">
                <div className={`mx-auto h-3 w-3 rounded-full ${LEAD_TYPE_COLORS[key] ?? 'bg-gray-400'} mb-2`} />
                <p className="text-2xl font-semibold text-foreground">{byType[key] ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Temperature breakdown */}
          <div className="mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-3">By Temperature</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEMPERATURE_CONFIG).map(([key, cfg]) => (
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
