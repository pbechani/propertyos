'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import {
  X,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Home,
  Droplet,
  Wind,
  Zap,
  Palette,
  Sofa,
  Trees,
  Car,
  FileText,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import { useState } from 'react';

// ─── shared room registry (mirrors AddPropertyConditionModal) ──────────────────

const ROOMS = [
  { id: 'foundation',   label: 'Foundation',        category: 'Structure', Icon: Home },
  { id: 'roof',         label: 'Roof',               category: 'Structure', Icon: Home },
  { id: 'walls',        label: 'Walls & Ceilings',   category: 'Structure', Icon: Home },
  { id: 'windows',      label: 'Windows & Doors',    category: 'Structure', Icon: Home },
  { id: 'hvac',         label: 'HVAC System',        category: 'Systems',   Icon: Wind },
  { id: 'plumbing',     label: 'Plumbing',           category: 'Systems',   Icon: Droplet },
  { id: 'electrical',   label: 'Electrical',         category: 'Systems',   Icon: Zap },
  { id: 'water-heater', label: 'Water Heater',       category: 'Systems',   Icon: Droplet },
  { id: 'kitchen',      label: 'Kitchen',            category: 'Interior',  Icon: Sofa },
  { id: 'master-bath',  label: 'Master Bathroom',    category: 'Interior',  Icon: Droplet },
  { id: 'bath-2',       label: 'Bathroom 2',         category: 'Interior',  Icon: Droplet },
  { id: 'bath-3',       label: 'Bathroom 3',         category: 'Interior',  Icon: Droplet },
  { id: 'flooring',     label: 'Flooring',           category: 'Interior',  Icon: Home },
  { id: 'paint',        label: 'Paint & Finishes',   category: 'Interior',  Icon: Palette },
  { id: 'siding',       label: 'Siding',             category: 'Exterior',  Icon: Home },
  { id: 'landscaping',  label: 'Landscaping',        category: 'Exterior',  Icon: Trees },
  { id: 'driveway',     label: 'Driveway',           category: 'Exterior',  Icon: Car },
  { id: 'deck',         label: 'Deck / Patio',       category: 'Exterior',  Icon: Home },
] as const;

const ROOM_MAP = Object.fromEntries(ROOMS.map(r => [r.id, r]));
const CATEGORIES = ['Structure', 'Systems', 'Interior', 'Exterior'] as const;

// ─── status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  excellent: {
    label: 'Excellent',
    icon: CheckCircle2,
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border border-green-200',
    row: 'border-l-4 border-l-green-400',
    weight: 4,
  },
  good: {
    label: 'Good',
    icon: CheckCircle,
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    row: 'border-l-4 border-l-blue-400',
    weight: 3,
  },
  fair: {
    label: 'Fair',
    icon: AlertCircle,
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    row: 'border-l-4 border-l-yellow-400',
    weight: 2,
  },
  'needs-attention': {
    label: 'Needs Attention',
    icon: XCircle,
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border border-red-200',
    row: 'border-l-4 border-l-red-400',
    weight: 1,
  },
  'not-assessed': {
    label: 'Not Assessed',
    icon: null,
    dot: 'bg-gray-300',
    badge: 'bg-gray-50 text-gray-500 border border-gray-200',
    row: 'border-l-4 border-l-gray-200',
    weight: 0,
  },
} as const;

const SEVERITY_CONFIG = {
  minor:    { label: 'Minor',    badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  moderate: { label: 'Moderate', badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
  major:    { label: 'Major',    badge: 'bg-red-50    text-red-700    border border-red-200'    },
};

// ─── types ─────────────────────────────────────────────────────────────────────

interface Issue {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  estimatedCost: string;
}

interface RoomCondition {
  status: string;
  notes?: string;
  issues?: Issue[];
}

export interface AssessmentDetail {
  id: string;
  inspection_date: string;
  inspector_name: string | null;
  year_built: string | null;
  last_renovation: string | null;
  overall_notes: string | null;
  room_conditions: Record<string, RoomCondition>;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: AssessmentDetail | null;
}

// ─── helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG['not-assessed'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

function HealthBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const segments: { status: string; count: number }[] = [
    { status: 'excellent',       count: counts.excellent        ?? 0 },
    { status: 'good',            count: counts.good             ?? 0 },
    { status: 'fair',            count: counts.fair             ?? 0 },
    { status: 'needs-attention', count: counts['needs-attention'] ?? 0 },
  ].filter(s => s.count > 0);

  return (
    <div className="flex rounded-full overflow-hidden h-3 w-full gap-0.5">
      {segments.map(s => (
        <div
          key={s.status}
          className={`${STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG].dot}`}
          title={`${STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG].label}: ${s.count}`}
          // flex-grow proportional to count; CSS custom property avoids inline style lint
          {...{ style: { flexGrow: s.count } }}
        />
      ))}
    </div>
  );
}

function healthScore(counts: Record<string, number>): number {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const weighted = Object.entries(counts).reduce((sum, [status, count]) => {
    const w = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.weight ?? 0;
    return sum + w * count;
  }, 0);
  return Math.round((weighted / (total * 4)) * 100);
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-blue-50 border-blue-200';
  if (score >= 40) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

// ─── RoomCard ──────────────────────────────────────────────────────────────────

function RoomCard({ roomId, condition }: { roomId: string; condition: RoomCondition }) {
  const [expanded, setExpanded] = useState(false);
  const meta = ROOM_MAP[roomId];
  const label = meta?.label ?? roomId.replace(/-/g, ' ');
  const Icon = meta?.Icon ?? Home;
  const cfg = STATUS_CONFIG[condition.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG['not-assessed'];
  const issues = condition.issues ?? [];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${cfg.row}`}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
        data-expanded={expanded}
      >
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="flex-1 text-sm font-medium capitalize">{label}</span>
        <StatusBadge status={condition.status} />
        {(condition.notes || issues.length > 0) && (
          expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {condition.notes && (
            <p className="text-sm text-gray-600 pt-3">{condition.notes}</p>
          )}
          {issues.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Issues ({issues.length})
              </p>
              {issues.map((issue, i) => {
                const sev = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.minor;
                return (
                  <div key={issue.id ?? i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{issue.description || '(no description)'}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev.badge}`}>
                          {sev.label}
                        </span>
                        {issue.estimatedCost && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <DollarSign className="w-3 h-3" />
                            {issue.estimatedCost}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main modal ────────────────────────────────────────────────────────────────

export function AssessmentDetailModal({ open, onOpenChange, assessment }: Props) {
  if (!assessment) return null;

  // Build status counts across all assessed rooms
  const counts: Record<string, number> = {};
  const assessedEntries = Object.entries(assessment.room_conditions ?? {}).filter(
    ([, c]) => c.status !== 'not-assessed',
  );
  assessedEntries.forEach(([, c]) => {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
  });

  const score = healthScore(counts);
  const totalIssues = assessedEntries.reduce(
    (sum, [, c]) => sum + (c.issues?.length ?? 0),
    0,
  );

  const formattedDate = new Date(assessment.inspection_date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  // Group assessed rooms by category for the Room Details tab
  const byCategory: Record<string, { roomId: string; condition: RoomCondition }[]> = {};
  CATEGORIES.forEach(cat => { byCategory[cat] = []; });

  assessedEntries.forEach(([roomId, condition]) => {
    const cat = ROOM_MAP[roomId]?.category ?? 'Interior';
    byCategory[cat] = byCategory[cat] ?? [];
    byCategory[cat].push({ roomId, condition });
  });

  // Also add 'unknown' rooms not in the registry
  Object.entries(assessment.room_conditions ?? {}).forEach(([roomId, condition]) => {
    if (condition.status === 'not-assessed') return;
    if (!ROOM_MAP[roomId]) {
      byCategory['Interior'] = byCategory['Interior'] ?? [];
      byCategory['Interior'].push({ roomId, condition });
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden z-50 flex flex-col">

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-linear-to-r from-slate-50 to-blue-50 shrink-0">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Condition Assessment
                </Dialog.Title>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formattedDate}
                  </span>
                  {assessment.inspector_name && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      {assessment.inspector_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Dialog.Close className="p-2 hover:bg-white/70 rounded-lg transition-colors shrink-0">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* ── KPI row ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border-b border-gray-200 shrink-0">
            {/* Health Score */}
            <div className={`flex flex-col items-center justify-center py-4 px-3 bg-white gap-0.5 ${scoreBg(score)}`}>
              <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
              <span className="text-xs text-gray-500 font-medium">Health Score</span>
              <HealthBar counts={counts} />
            </div>
            {/* Needs Attention */}
            <div className="flex flex-col items-center justify-center py-4 px-3 bg-white gap-0.5">
              <span className="text-3xl font-bold text-red-600">{counts['needs-attention'] ?? 0}</span>
              <span className="text-xs text-gray-500 font-medium">Need Attention</span>
            </div>
            {/* Items Assessed */}
            <div className="flex flex-col items-center justify-center py-4 px-3 bg-white gap-0.5">
              <span className="text-3xl font-bold text-gray-800">{assessedEntries.length}</span>
              <span className="text-xs text-gray-500 font-medium">Items Assessed</span>
            </div>
            {/* Issues logged */}
            <div className="flex flex-col items-center justify-center py-4 px-3 bg-white gap-0.5">
              <span className="text-3xl font-bold text-orange-600">{totalIssues}</span>
              <span className="text-xs text-gray-500 font-medium">Issues Logged</span>
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────────── */}
          <Tabs.Root defaultValue="overview" className="flex flex-col flex-1 overflow-hidden">
            <Tabs.List className="flex border-b border-gray-200 shrink-0 px-6 bg-white">
              {(['overview', 'rooms'] as const).map(tab => (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  className="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-700 transition-colors capitalize"
                >
                  {tab === 'overview' ? 'Overview' : 'Room by Room'}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {/* ── Overview tab ──────────────────────────────────────────────── */}
            <Tabs.Content value="overview" className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status breakdown */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Status Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['excellent', 'good', 'fair', 'needs-attention'] as const).map(status => {
                    const cfg = STATUS_CONFIG[status];
                    const Icon = cfg.icon!;
                    const count = counts[status] ?? 0;
                    return (
                      <div key={status} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.badge}`}>
                        <Icon className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-xl font-bold">{count}</p>
                          <p className="text-xs font-medium">{cfg.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Property info */}
              {(assessment.year_built || assessment.last_renovation) && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Property Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {assessment.year_built && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Year Built</p>
                        <p className="font-semibold text-gray-900">{assessment.year_built}</p>
                      </div>
                    )}
                    {assessment.last_renovation && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Last Renovation</p>
                        <p className="font-semibold text-gray-900">{assessment.last_renovation}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Overall notes */}
              {assessment.overall_notes && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4" />Overall Notes
                  </h3>
                  <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-4 leading-relaxed">
                    {assessment.overall_notes}
                  </p>
                </section>
              )}

              {/* Issues needing attention — quick summary */}
              {assessedEntries.some(([, c]) => c.status === 'needs-attention') && (
                <section>
                  <h3 className="text-sm font-semibold text-red-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />Needs Attention
                  </h3>
                  <div className="space-y-2">
                    {assessedEntries
                      .filter(([, c]) => c.status === 'needs-attention')
                      .map(([roomId, condition]) => {
                        const label = ROOM_MAP[roomId]?.label ?? roomId.replace(/-/g, ' ');
                        return (
                          <div key={roomId} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-red-800 capitalize">{label}</p>
                              {condition.notes && (
                                <p className="text-xs text-red-600 mt-0.5">{condition.notes}</p>
                              )}
                              {(condition.issues?.length ?? 0) > 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                  {condition.issues!.length} issue{condition.issues!.length !== 1 ? 's' : ''} logged
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}
            </Tabs.Content>

            {/* ── Room by Room tab ──────────────────────────────────────────── */}
            <Tabs.Content value="rooms" className="flex-1 overflow-y-auto p-6 space-y-6">
              {assessedEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No rooms were assessed</p>
                </div>
              ) : (
                CATEGORIES.map(cat => {
                  const items = byCategory[cat] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <section key={cat}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                        {cat}
                      </h3>
                      <div className="space-y-2">
                        {items.map(({ roomId, condition }) => (
                          <RoomCard key={roomId} roomId={roomId} condition={condition} />
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
            </Tabs.Content>
          </Tabs.Root>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
