'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, DollarSign, Loader2, Users, Zap, CheckCircle2, TrendingUp, FileSignature, Trophy } from 'lucide-react';
import { leadsApi, type LeadRow, type LeadPipelineStage } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import { Card } from '@/components/ui/card';

const STAGES: Array<{ id: string; label: string; color: string; headerColor: string; gradient: string; icon: React.ElementType }> = [
  { id: 'new',            label: 'New',            color: 'bg-gray-50 border-gray-200',       headerColor: 'bg-gray-100 text-gray-700',    gradient: 'bg-linear-to-br from-slate-500 to-slate-600',   icon: Users },
  { id: 'contacted',      label: 'Contacted',      color: 'bg-blue-50 border-blue-200',       headerColor: 'bg-blue-100 text-blue-700',    gradient: 'bg-linear-to-br from-blue-600 to-blue-700',    icon: Zap },
  { id: 'qualified',      label: 'Qualified',      color: 'bg-indigo-50 border-indigo-200',   headerColor: 'bg-indigo-100 text-indigo-700', gradient: 'bg-linear-to-br from-indigo-500 to-indigo-600', icon: CheckCircle2 },
  { id: 'active',         label: 'Active',         color: 'bg-green-50 border-green-200',     headerColor: 'bg-green-100 text-green-700',  gradient: 'bg-linear-to-br from-green-500 to-green-600',  icon: TrendingUp },
  { id: 'under_contract', label: 'Under Contract', color: 'bg-orange-50 border-orange-200',   headerColor: 'bg-orange-100 text-orange-700', gradient: 'bg-linear-to-br from-amber-500 to-amber-600',  icon: FileSignature },
  { id: 'closed',         label: 'Closed',         color: 'bg-emerald-50 border-emerald-200', headerColor: 'bg-emerald-100 text-emerald-700', gradient: 'bg-linear-to-br from-emerald-500 to-emerald-600', icon: Trophy },
];

const temperatureColors: Record<string, string> = {
  hot: 'bg-red-400', warm: 'bg-orange-400', cold: 'bg-blue-400', nurture: 'bg-purple-400',
};

const typeColors: Record<string, string> = {
  buyer: 'text-blue-600', seller: 'text-green-600', renter: 'text-orange-500', investor: 'text-purple-600',
};

function formatValue(value: string | null | undefined) {
  const n = value ? parseFloat(value) : 0;
  if (!n) return null;
  return n >= 1_000_000 ? `R${(n / 1_000_000).toFixed(1)}M` : `R${(n / 1_000).toFixed(0)}K`;
}

export default function LeadPipeline() {
  const [stages, setStages] = useState<LeadPipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    leadsApi.getPipeline(token)
      .then((res) => setStages(res.stages))
      .catch(() => setError('Failed to load pipeline'))
      .finally(() => setLoading(false));
  }, []);

  const stageMap = new Map(stages.map((s) => [s.stage, s]));

  const totalPipeline = stages.reduce((sum, s) => sum + (parseFloat(String(s.totalValue)) || 0), 0);
  const formattedTotal = totalPipeline >= 1_000_000
    ? `R${(totalPipeline / 1_000_000).toFixed(2)}M`
    : `R${(totalPipeline / 1_000).toFixed(0)}K`;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track leads across stages</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-foreground">{formattedTotal} total pipeline</span>
        </div>
      </div>

      {/* Stage summary bar */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const s = stageMap.get(stage.id);
          const count = s?.count ?? 0;
          const val = s?.totalValue ? parseFloat(String(s.totalValue)) : 0;
          const Icon = stage.icon;
          return (
            <Card key={stage.id} className={`p-4 ${stage.gradient} text-white border-0 rounded-2xl`}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs opacity-90 mb-0.5">{stage.label}</p>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs opacity-75 mt-0.5">
                {val > 0 ? (val >= 1_000_000 ? `R${(val / 1_000_000).toFixed(1)}M` : `R${(val / 1_000).toFixed(0)}K`) : 'No value'}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 280}px` }}>
          {STAGES.map((stage) => {
            const leads = stageMap.get(stage.id)?.leads ?? [];
            return (
              <div key={stage.id} className="w-[260px] flex-shrink-0">
                <div className={`rounded-t-xl px-3 py-2.5 flex items-center justify-between border border-b-0 ${stage.color}`}>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${stage.headerColor}`}>{stage.label}</span>
                  <span className="text-xs text-muted-foreground font-medium">{leads.length}</span>
                </div>
                <div className={`min-h-[400px] rounded-b-xl border ${stage.color} p-2 space-y-2`}>
                  {leads.map((lead) => <LeadKanbanCard key={lead.id} lead={lead} />)}
                  {leads.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">No leads</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LeadKanbanCard({ lead }: { lead: LeadRow }) {
  const budgetDisplay = formatValue(lead.budget_max) ?? formatValue(lead.budget_min);

  return (
    <Link href={`/app/leads/${lead.id}`} className="block">
      <div className="rounded-xl bg-card border border-border p-3 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-semibold text-foreground leading-tight">{lead.name}</p>
          <span
            className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${temperatureColors[lead.temperature] ?? 'bg-gray-300'}`}
            title={lead.temperature}
          />
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium capitalize ${typeColors[lead.type] ?? 'text-gray-500'}`}>{lead.type}</span>
          {budgetDisplay && <span className="text-xs text-muted-foreground">{budgetDisplay}</span>}
        </div>

        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors">
              <Phone className="h-3 w-3" />Call
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Mail className="h-3 w-3" />Email
            </a>
          )}
          {lead.prequalified && (
            <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 rounded px-1.5 py-0.5">Pre-qual</span>
          )}
        </div>

        {lead.next_follow_up && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Follow-up: {new Date(lead.next_follow_up).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
}
