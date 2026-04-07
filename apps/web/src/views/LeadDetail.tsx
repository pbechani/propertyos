'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Mail, MessageSquare, Calendar, Edit, Trash2,
  CheckSquare, MapPin, TrendingUp, Flame, Thermometer, Snowflake, Leaf, Loader2,
} from 'lucide-react';
import {
  leadsApi,
  type LeadRow, type LeadActivityRow, type LeadTaskRow,
  type UpdateLeadPayload, type CreateLeadActivityPayload, type CreateLeadTaskPayload,
} from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ── Constants ──────────────────────────────────────────────────────────────

const temperatureConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  hot:    { label: 'Hot',    color: 'bg-red-100 text-red-700 border-red-200',          icon: <Flame className="h-3.5 w-3.5" /> },
  warm:   { label: 'Warm',   color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <Thermometer className="h-3.5 w-3.5" /> },
  cold:   { label: 'Cold',   color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: <Snowflake className="h-3.5 w-3.5" /> },
  nurture:{ label: 'Nurture',color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Leaf className="h-3.5 w-3.5" /> },
};

const stageConfig: Record<string, { label: string; color: string }> = {
  new:            { label: 'New',            color: 'bg-gray-100 text-gray-700 border-gray-200' },
  contacted:      { label: 'Contacted',      color: 'bg-blue-100 text-blue-700 border-blue-200' },
  qualified:      { label: 'Qualified',      color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  active:         { label: 'Active',         color: 'bg-green-100 text-green-700 border-green-200' },
  under_contract: { label: 'Under Contract', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  closed:         { label: 'Closed',         color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  lost:           { label: 'Lost',           color: 'bg-red-100 text-red-700 border-red-200' },
};

const STAGE_ORDER: string[] = ['new', 'contacted', 'qualified', 'active', 'under_contract', 'closed'];

const activityIcons: Record<string, React.ReactNode> = {
  email:        <Mail className="h-4 w-4 text-blue-500" />,
  call:         <Phone className="h-4 w-4 text-green-500" />,
  sms:          <MessageSquare className="h-4 w-4 text-purple-500" />,
  meeting:      <Calendar className="h-4 w-4 text-orange-500" />,
  stage_change: <TrendingUp className="h-4 w-4 text-indigo-500" />,
  note:         <Edit className="h-4 w-4 text-gray-400" />,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBudget(min: string | null, max: string | null, currency: string | null): string | null {
  const cur = currency ?? 'ZAR';
  const prefix = cur === 'ZAR' ? 'R' : cur + ' ';
  const fmt = (v: string | null) => {
    const n = v ? parseFloat(v) : 0;
    if (!n) return null;
    return n >= 1_000_000
      ? `${prefix}${(n / 1_000_000).toFixed(1)}M`
      : `${prefix}${(n / 1_000).toFixed(0)}K`;
  };
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(max) ?? fmt(min);
}

// ── Edit Lead Modal ────────────────────────────────────────────────────────

type EditLeadForm = {
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  timeline: string;
  temperature: string;
  stage: string;
  budgetMin: string;
  budgetMax: string;
  budgetCurrency: string;
  preferences: string;
  notes: string;
  prequalified: boolean;
  nextFollowUp: string;
  dealValue: string;
};

function initEditForm(lead: LeadRow): EditLeadForm {
  return {
    name:           lead.name ?? '',
    type:           lead.type ?? '',
    email:          lead.email ?? '',
    phone:          lead.phone ?? '',
    address:        lead.address ?? '',
    source:         lead.source ?? '',
    timeline:       lead.timeline ?? '',
    temperature:    lead.temperature ?? 'cold',
    stage:          lead.stage ?? 'new',
    budgetMin:      lead.budget_min ?? '',
    budgetMax:      lead.budget_max ?? '',
    budgetCurrency: lead.budget_currency ?? 'ZAR',
    preferences:    lead.preferences ?? '',
    notes:          lead.notes ?? '',
    prequalified:   lead.prequalified ?? false,
    nextFollowUp:   lead.next_follow_up ? lead.next_follow_up.slice(0, 10) : '',
    dealValue:      lead.deal_value ?? '',
  };
}

function EditLeadModal({
  lead, open, onClose, onSaved,
}: { lead: LeadRow; open: boolean; onClose: () => void; onSaved: (updated: LeadRow) => void }) {
  const [form, setForm] = useState<EditLeadForm>(() => initEditForm(lead));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm(initEditForm(lead)); setError(''); }
  }, [open, lead]);

  const set = (field: keyof EditLeadForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const payload: UpdateLeadPayload = {
        name:           form.name.trim() || undefined,
        type:           form.type || undefined,
        email:          form.email.trim() || undefined,
        phone:          form.phone.trim() || undefined,
        address:        form.address.trim() || undefined,
        source:         form.source || undefined,
        timeline:       form.timeline.trim() || undefined,
        temperature:    form.temperature || undefined,
        stage:          form.stage || undefined,
        budgetMin:      form.budgetMin ? parseFloat(form.budgetMin) : undefined,
        budgetMax:      form.budgetMax ? parseFloat(form.budgetMax) : undefined,
        budgetCurrency: form.budgetCurrency || undefined,
        preferences:    form.preferences.trim() || undefined,
        notes:          form.notes.trim() || undefined,
        prequalified:   form.prequalified,
        nextFollowUp:   form.nextFollowUp || undefined,
        dealValue:      form.dealValue ? parseFloat(form.dealValue) : undefined,
      };
      const updated = await leadsApi.update(token, lead.id, payload);
      onSaved(updated);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input id="edit-name" value={form.name} onChange={e => set('name', e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="edit-type">Type</Label>
            <Select value={form.type} onValueChange={v => set('type', v)}>
              <SelectTrigger id="edit-type" className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="landlord">Landlord</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-temperature">Temperature</Label>
            <Select value={form.temperature} onValueChange={v => set('temperature', v)}>
              <SelectTrigger id="edit-temperature" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="nurture">Nurture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-stage">Stage</Label>
            <Select value={form.stage} onValueChange={v => set('stage', v)}>
              <SelectTrigger id="edit-stage" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="under_contract">Under Contract</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-source">Source</Label>
            <Select value={form.source} onValueChange={v => set('source', v)}>
              <SelectTrigger id="edit-source" className="mt-1">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="portal">Portal</SelectItem>
                <SelectItem value="walk_in">Walk In</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={form.email} onChange={e => set('email', e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="edit-phone">Phone</Label>
            <Input id="edit-phone" value={form.phone} onChange={e => set('phone', e.target.value)} className="mt-1" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input id="edit-address" value={form.address} onChange={e => set('address', e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="edit-timeline">Timeline</Label>
            <Input id="edit-timeline" value={form.timeline} onChange={e => set('timeline', e.target.value)} placeholder="e.g. 3 months" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="edit-follow-up">Next Follow-up</Label>
            <Input id="edit-follow-up" type="date" value={form.nextFollowUp} onChange={e => set('nextFollowUp', e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="edit-budget-min">Budget Min (ZAR)</Label>
            <Input id="edit-budget-min" type="number" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="edit-budget-max">Budget Max (ZAR)</Label>
            <Input id="edit-budget-max" type="number" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="edit-deal-value">Deal Value (ZAR)</Label>
            <Input id="edit-deal-value" type="number" value={form.dealValue} onChange={e => set('dealValue', e.target.value)} className="mt-1" />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="edit-prequalified"
              type="checkbox"
              checked={form.prequalified}
              onChange={e => set('prequalified', e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="edit-prequalified" className="cursor-pointer">Pre-qualified</Label>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="edit-preferences">Preferences</Label>
            <Textarea id="edit-preferences" value={form.preferences} onChange={e => set('preferences', e.target.value)} rows={2} className="mt-1" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="mt-1" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Log Activity Modal ─────────────────────────────────────────────────────

function LogActivityModal({
  leadId, activityType, open, onClose, onLogged,
}: {
  leadId: string;
  activityType: 'sms' | 'meeting' | 'note' | 'call';
  open: boolean;
  onClose: () => void;
  onLogged: (activity: LeadActivityRow) => void;
}) {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setDescription(''); setError(''); }
  }, [open]);

  const labels: Record<string, string> = {
    sms: 'SMS Message', meeting: 'Meeting', note: 'Note', call: 'Call',
  };
  const placeholders: Record<string, string> = {
    sms: 'e.g. Sent property brochure to client',
    meeting: 'e.g. Met at office to discuss requirements',
    note: 'e.g. Client is interested in 3-bed homes in Sandton',
    call: 'e.g. Discussed financing options',
  };

  const handleLog = async () => {
    if (!description.trim()) { setError('Description is required'); return; }
    setSaving(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const payload: CreateLeadActivityPayload = {
        type: activityType,
        description: description.trim(),
      };
      const activity = await leadsApi.createActivity(token, leadId, payload);
      onLogged(activity);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to log activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log {labels[activityType] ?? 'Activity'}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="activity-desc">Description *</Label>
          <Textarea
            id="activity-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={placeholders[activityType] ?? ''}
            rows={3}
            className="mt-1"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleLog} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Log Activity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Task Modal ─────────────────────────────────────────────────────────

function AddTaskModal({
  leadId, open, onClose, onAdded,
}: {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onAdded: (task: LeadTaskRow) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('follow_up');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setTitle(''); setType('follow_up'); setPriority('medium'); setDueDate(''); setError(''); }
  }, [open]);

  const handleAdd = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const payload: CreateLeadTaskPayload = {
        title: title.trim(),
        type,
        priority,
        dueDate: dueDate || undefined,
      };
      const task = await leadsApi.createTask(token, leadId, payload);
      onAdded(task);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Send property report"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="task-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="task-type" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="task-priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="task-priority" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="task-due">Due Date</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleAdd} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<LeadRow | null>(null);
  const [activities, setActivities] = useState<LeadActivityRow[]>([]);
  const [tasks, setTasks] = useState<LeadTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activityModal, setActivityModal] = useState<'sms' | 'meeting' | 'note' | 'call' | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'tasks'>('overview');

  const fetchLead = useCallback(() => {
    const token = getAccessToken();
    if (!token || !id) { setLoading(false); return; }
    Promise.all([
      leadsApi.getById(token, id),
      leadsApi.listActivities(token, id),
      leadsApi.listTasks(token, id),
    ])
      .then(([l, acts, tks]) => {
        setLead(l);
        setActivities([...acts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setTasks(tks);
      })
      .catch(() => setError('Failed to load lead'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleDelete = async () => {
    const token = getAccessToken();
    if (!token || !lead) return;
    setDeleting(true);
    try {
      await leadsApi.remove(token, lead.id);
      router.push('/app/leads');
    } catch {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleToggleTask = async (task: LeadTaskRow) => {
    const token = getAccessToken();
    if (!token || !lead) return;
    const updated = await leadsApi.updateTask(token, lead.id, task.id, { completed: !task.completed });
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">{error || 'Lead not found.'}</p>
        <Link href="/app/leads" className="text-sm text-blue-600 hover:underline">
          ← Back to Leads
        </Link>
      </div>
    );
  }

  const temp = temperatureConfig[lead.temperature] ?? temperatureConfig['cold'];
  const stage = stageConfig[lead.stage] ?? { label: lead.stage, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  const stageIndex = STAGE_ORDER.indexOf(lead.stage);
  const budgetDisplay = formatBudget(lead.budget_min, lead.budget_max, lead.budget_currency);

  // Task groupings for Tasks tab
  const now = new Date();
  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < now && new Date(t.due_date).toDateString() !== now.toDateString());
  const dueTodayTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === now.toDateString());
  const thisWeekTasks = pendingTasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const diff = (d.getTime() - now.getTime()) / 86400000;
    return diff > 0 && diff <= 7;
  });
  const completedTasks = tasks.filter(t => t.completed);

  // Activity counts for Activity tab
  const callCount = activities.filter(a => a.type === 'call').length;
  const emailCount = activities.filter(a => a.type === 'email').length;
  const smsCount = activities.filter(a => a.type === 'sms').length;
  const meetingCount = activities.filter(a => a.type === 'meeting').length;

  return (
    <>
      {/* ── Page wrapper ── */}
      <div style={{ minHeight: '100vh', background: '#F2E8D5' }}>
        {/* ── Dark Forest Header ── */}
        <div style={{ background: '#1A3C28', padding: '28px 32px 0', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(196,86,42,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 10, left: '40%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,232,122,0.04)', pointerEvents: 'none' }} />

          {/* Back navigation */}
          <Link
            href="/app/leads"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(242,232,213,0.45)', textDecoration: 'none', marginBottom: 20 }}
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Leads
          </Link>

          {/* Lead identity row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(196,86,42,0.25)', border: '2px solid rgba(196,86,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 22, fontWeight: 700, color: '#F2E8D5' }}>
                  {lead.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C4562A', margin: '0 0 4px' }}>
                  Lead Profile
                </p>
                <h1 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 26, fontWeight: 700, color: '#F2E8D5', lineHeight: 1.2, margin: '0 0 10px' }}>
                  {lead.name}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(242,232,213,0.10)', border: '1px solid rgba(242,232,213,0.18)', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#F2E8D5' }}>
                    {temp.icon}&nbsp;{temp.label}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: '#C4562A', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#fff' }}>
                    {stage.label}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,232,122,0.12)', border: '1px solid rgba(0,232,122,0.2)', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#00E87A', textTransform: 'capitalize' }}>
                    {lead.type}
                  </span>
                  {lead.prequalified && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,232,122,0.14)', border: '1px solid rgba(0,232,122,0.25)', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#00E87A' }}>
                      ✓ Pre-qualified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(242,232,213,0.55)', textDecoration: 'none' }}>
                      <Mail className="h-3.5 w-3.5" />{lead.email}
                    </a>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(242,232,213,0.55)', textDecoration: 'none' }}>
                      <Phone className="h-3.5 w-3.5" />{lead.phone}
                    </a>
                  )}
                  {lead.address && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(242,232,213,0.55)' }}>
                      <MapPin className="h-3.5 w-3.5" />{lead.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowEdit(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(242,232,213,0.08)', border: '1px solid rgba(242,232,213,0.14)', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#F2E8D5', cursor: 'pointer' }}
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={() => setActivityModal('meeting')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#C4562A', border: '1px solid #C4562A', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                <Calendar className="h-3.5 w-3.5" />
                Log Activity
              </button>
              <button
                onClick={() => setShowDelete(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#FCA5A5', cursor: 'pointer' }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 28, paddingBottom: 0 }}>
            {[
              { label: 'Budget', value: budgetDisplay ?? '—' },
              { label: 'Stage', value: stage.label },
              { label: 'Last Contact', value: lead.last_contact_at ? new Date(lead.last_contact_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—' },
              { label: 'Deal Value', value: lead.deal_value && parseFloat(lead.deal_value) > 0 ? (formatBudget(lead.deal_value, null, lead.budget_currency) ?? lead.deal_value) : '—' },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '14px 16px' }}>
                <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(242,232,213,0.45)', margin: '0 0 6px' }}>
                  {kpi.label}
                </p>
                <p style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 20, fontWeight: 800, color: '#F2E8D5', margin: 0, lineHeight: 1.2 }}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Tab bar ── */}
          <div style={{ display: 'flex', borderTop: '1px solid rgba(242,232,213,0.08)', marginTop: 20 }}>
            {(['overview', 'activity', 'tasks'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const badge = tab === 'activity' ? activities.length : tab === 'tasks' ? pendingTasks.length : 0;
              const labels: Record<string, string> = { overview: 'Overview', activity: 'Activity', tasks: 'Tasks' };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '13px 20px', fontSize: 13, fontWeight: 600,
                    color: isActive ? '#F2E8D5' : 'rgba(242,232,213,0.5)',
                    borderBottom: isActive ? '2px solid #C4562A' : '2px solid transparent',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    background: 'transparent', cursor: 'pointer',
                  }}
                >
                  {tab === 'overview' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                  {tab === 'activity' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <polyline points="1,7 3.5,3.5 6,9 8.5,5 11,7 13,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {tab === 'tasks' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <polyline points="4,7 6,9 10,5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {labels[tab]}
                  {badge > 0 && (
                    <span style={{
                      ...(isActive
                        ? { background: '#C4562A', color: '#fff' }
                        : { background: 'rgba(196,86,42,0.25)', color: '#C4562A' }),
                      fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
        <div style={{ padding: '26px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Contact Information */}
            <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(26,60,40,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 15, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Contact Information</h2>
                {lead.email && (
                  <a href={`mailto:${lead.email}`} style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#C4562A', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Send Email →
                  </a>
                )}
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lead.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail className="h-4 w-4" style={{ color: '#2563EB' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, textTransform: 'uppercase', color: '#5A7A68', margin: '0 0 2px' }}>Email</p>
                      <a href={`mailto:${lead.email}`} style={{ fontSize: 14, color: '#1A3C28', textDecoration: 'none', fontWeight: 500 }}>{lead.email}</a>
                    </div>
                  </div>
                )}
                {lead.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone className="h-4 w-4" style={{ color: '#065F46' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, textTransform: 'uppercase', color: '#5A7A68', margin: '0 0 2px' }}>Phone</p>
                      <a href={`tel:${lead.phone}`} style={{ fontSize: 14, color: '#1A3C28', textDecoration: 'none', fontWeight: 500 }}>{lead.phone}</a>
                    </div>
                  </div>
                )}
                {lead.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin className="h-4 w-4" style={{ color: '#D97706' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, textTransform: 'uppercase', color: '#5A7A68', margin: '0 0 2px' }}>Address</p>
                      <p style={{ fontSize: 14, color: '#1A3C28', margin: 0, fontWeight: 500 }}>{lead.address}</p>
                    </div>
                  </div>
                )}
                {lead.source && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrendingUp className="h-4 w-4" style={{ color: '#6D28D9' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, textTransform: 'uppercase', color: '#5A7A68', margin: '0 0 2px' }}>Source</p>
                      <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'rgba(26,60,40,0.07)', color: '#1A3C28', padding: '2px 8px', borderRadius: 6 }}>
                        {lead.source}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lead Details */}
            <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 15, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Lead Details</h2>
              </div>
              <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 20px' }}>
                <InfoItem label="Type" value={<span className="capitalize">{lead.type}</span>} />
                <InfoItem label="Source" value={lead.source} />
                <InfoItem label="Timeline" value={lead.timeline} />
                {budgetDisplay && (
                  <InfoItem
                    label="Budget"
                    value={<span style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', color: '#C4562A', fontWeight: 700 }}>{budgetDisplay}</span>}
                  />
                )}
                {lead.assigned_agent_name && <InfoItem label="Assigned Agent" value={lead.assigned_agent_name} />}
                <InfoItem label="Created" value={new Date(lead.created_at).toLocaleDateString()} />
                {lead.last_contact_at && (
                  <InfoItem label="Last Contact" value={new Date(lead.last_contact_at).toLocaleDateString()} />
                )}
                {lead.next_follow_up && (
                  <InfoItem label="Next Follow-up" value={new Date(lead.next_follow_up).toLocaleDateString()} />
                )}
                {lead.deal_value && parseFloat(lead.deal_value) > 0 && (
                  <InfoItem
                    label="Deal Value"
                    value={
                      <span style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', color: '#C4562A', fontWeight: 700 }}>
                        {formatBudget(lead.deal_value, null, lead.budget_currency) ?? lead.deal_value}
                      </span>
                    }
                  />
                )}
              </div>
            </div>

            {/* Preferences */}
            {lead.preferences && (
              <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                  <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 15, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Preferences</h2>
                </div>
                <div style={{ padding: '18px 20px', background: 'rgba(242,232,213,0.35)' }}>
                  <p style={{ fontSize: 14, color: '#3D5A48', lineHeight: 1.6, margin: 0 }}>{lead.preferences}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                  <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 15, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Notes</h2>
                </div>
                <div style={{ padding: '18px 20px', background: 'rgba(242,232,213,0.35)' }}>
                  <p style={{ fontSize: 14, color: '#3D5A48', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                </div>
              </div>
            )}

            {/* Activity Timeline lives in the Activity tab */}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Actions */}
            <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 14, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Quick Actions</h2>
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(26,60,40,0.1)', fontSize: 13, fontWeight: 500, color: '#1A3C28', textDecoration: 'none' }}
                  >
                    <Phone className="h-4 w-4" style={{ color: '#10B981' }} />
                    Call Lead
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(26,60,40,0.1)', fontSize: 13, fontWeight: 500, color: '#1A3C28', textDecoration: 'none' }}
                  >
                    <Mail className="h-4 w-4" style={{ color: '#3B82F6' }} />
                    Send Email
                  </a>
                )}
                <button
                  onClick={() => setActivityModal('sms')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(26,60,40,0.1)', fontSize: 13, fontWeight: 500, color: '#1A3C28', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <MessageSquare className="h-4 w-4" style={{ color: '#8B5CF6' }} />
                  Log SMS
                </button>
                <button
                  onClick={() => setActivityModal('meeting')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(26,60,40,0.1)', fontSize: 13, fontWeight: 500, color: '#1A3C28', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Calendar className="h-4 w-4" style={{ color: '#F97316' }} />
                  Log Meeting
                </button>
                <button
                  onClick={() => setShowAddTask(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(26,60,40,0.1)', fontSize: 13, fontWeight: 500, color: '#1A3C28', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <CheckSquare className="h-4 w-4" style={{ color: '#6366F1' }} />
                  Add Task
                </button>
              </div>
            </div>

            {/* Pending Tasks preview */}
            {pendingTasks.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(26,60,40,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 14, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Pending Tasks</h2>
                  <button onClick={() => setActiveTab('tasks')} style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, textTransform: 'uppercase', color: '#C4562A', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>
                    View All →
                  </button>
                </div>
                <div>
                  {pendingTasks.slice(0, 3).map((task, tIdx, arr) => (
                    <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 18px', borderBottom: tIdx < arr.length - 1 ? '1px solid rgba(26,60,40,0.06)' : 'none' }}>
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => handleToggleTask(task)}
                        style={{ marginTop: 2, cursor: 'pointer', accentColor: '#1A3C28' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#1A3C28', margin: 0 }}>{task.title}</p>
                        {task.due_date && (
                          <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#5A7A68', margin: '3px 0 0' }}>
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage Progress */}
            <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 14, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Stage Progress</h2>
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STAGE_ORDER.map((s, idx) => {
                  const cfg = stageConfig[s];
                  const isPast = idx < stageIndex;
                  const isCurrent = idx === stageIndex;
                  return (
                    <div
                      key={s}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontSize: 13,
                        ...(isCurrent
                          ? { background: '#1A3C28', border: '1px solid rgba(242,232,213,0.12)', fontWeight: 600, color: '#F2E8D5' }
                          : isPast
                          ? { background: 'rgba(26,60,40,0.04)', border: '1px solid transparent', color: '#5A7A68' }
                          : { background: 'transparent', border: '1px solid transparent', color: '#9BB5A8', opacity: 0.6 }),
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: isCurrent ? '#00E87A' : isPast ? '#10B981' : 'rgba(26,60,40,0.15)',
                        }}
                      />
                      <span style={{ flex: 1 }}>{cfg?.label ?? s}</span>
                      {isCurrent && <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, color: 'rgba(242,232,213,0.55)', textTransform: 'uppercase' }}>Current</span>}
                      {isPast && <span style={{ color: '#10B981', fontSize: 12 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ── Activity Tab ── */}
        {activeTab === 'activity' && (
        <div style={{ padding: '26px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Left: Activity Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 15, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Activity Timeline</h2>
              </div>
              {activities.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 12, color: '#9BB5A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No activity logged yet</p>
                </div>
              ) : (
                <div style={{ padding: '18px 20px' }}>
                  {activities.map((activity, idx) => (
                    <div key={activity.id} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(196,86,42,0.10)', border: '1px solid rgba(196,86,42,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {activityIcons[activity.type] ?? <Edit className="h-4 w-4" style={{ color: '#C4562A' }} />}
                        </div>
                        {idx < activities.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: 'rgba(26,60,40,0.1)', minHeight: 16, marginTop: 4 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: idx < activities.length - 1 ? 16 : 0, flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#1A3C28', margin: 0 }}>{activity.description}</p>
                        <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#5A7A68', margin: '4px 0 0' }}>
                          {activity.actor_name ?? 'System'} · {new Date(activity.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Right sidebar: Interaction Summary + Log Activity CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 14, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Interaction Summary</h2>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Calls', count: callCount, emoji: '📞' },
                  { label: 'Emails', count: emailCount, emoji: '✉️' },
                  { label: 'SMS', count: smsCount, emoji: '💬' },
                  { label: 'Meetings', count: meetingCount, emoji: '📅' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#5A7A68' }}>{row.emoji} {row.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 13, fontWeight: 700, color: '#1A3C28' }}>{row.count}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(26,60,40,0.08)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A3C28' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 18, fontWeight: 800, color: '#C4562A' }}>{activities.length}</span>
                </div>
              </div>
            </div>
            <div style={{ background: '#1A3C28', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '18px 18px 12px' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 15, fontWeight: 700, color: '#F2E8D5', margin: '0 0 4px' }}>Log a new interaction</h2>
                <p style={{ fontSize: 12, color: 'rgba(242,232,213,0.55)', margin: 0 }}>Keep the timeline up to date</p>
              </div>
              <div style={{ padding: '4px 18px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => setActivityModal('call')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(242,232,213,0.15)', background: 'rgba(242,232,213,0.08)', fontSize: 13, fontWeight: 500, color: '#F2E8D5', cursor: 'pointer' }}>📞 Call</button>
                <button onClick={() => setActivityModal('note')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(242,232,213,0.15)', background: 'rgba(242,232,213,0.08)', fontSize: 13, fontWeight: 500, color: '#F2E8D5', cursor: 'pointer' }}>✉️ Email</button>
                <button onClick={() => setActivityModal('sms')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(242,232,213,0.15)', background: 'rgba(242,232,213,0.08)', fontSize: 13, fontWeight: 500, color: '#F2E8D5', cursor: 'pointer' }}>💬 SMS</button>
                <button onClick={() => setActivityModal('meeting')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 12px', borderRadius: 8, border: '1px solid #C4562A', background: '#C4562A', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>📅 Meeting</button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ── Tasks Tab ── */}
        {activeTab === 'tasks' && (
        <div style={{ padding: '26px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Task summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Overdue', count: overdueTasks.length, bg: '#FEF2F2', num: '#DC2626', labelColor: '#DC2626' },
                { label: 'Due Today', count: dueTodayTasks.length, bg: '#FFFBEB', num: '#D97706', labelColor: '#D97706' },
                { label: 'This Week', count: thisWeekTasks.length, bg: '#F0FDF4', num: '#10B981', labelColor: '#10B981' },
                { label: 'Completed', count: completedTasks.length, bg: '#F9F8F6', num: '#5A7A68', labelColor: '#9BB5A8' },
              ].map((stat) => (
                <div key={stat.label} style={{ background: stat.bg, border: '1px solid rgba(26,60,40,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                  <p style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 22, fontWeight: 800, color: stat.num, margin: '0 0 4px', lineHeight: 1 }}>{stat.count}</p>
                  <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: stat.labelColor, margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddTask(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#C4562A', border: '1px solid #C4562A', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                <CheckSquare className="h-3.5 w-3.5" /> Add Task
              </button>
            </div>
            {tasks.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, padding: '32px 20px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 12, color: '#9BB5A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No tasks yet</p>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
                {overdueTasks.length > 0 && (
                  <>
                    <div style={{ padding: '10px 20px', background: 'rgba(220,38,38,0.04)', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                      <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#DC2626' }}>⚠️ Overdue</span>
                    </div>
                    {overdueTasks.map((task) => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 20px', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                        <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task)} style={{ marginTop: 2, cursor: 'pointer', accentColor: '#1A3C28' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#DC2626', margin: 0 }}>{task.title}</p>
                          {task.due_date && <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#DC2626', margin: '3px 0 0' }}>Was due {new Date(task.due_date).toLocaleDateString()}</p>}
                        </div>
                        {task.priority && <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(220,38,38,0.08)', color: '#DC2626', textTransform: 'capitalize' }}>{task.priority}</span>}
                      </div>
                    ))}
                  </>
                )}
                {dueTodayTasks.length > 0 && (
                  <>
                    <div style={{ padding: '10px 20px', background: 'rgba(253,230,138,0.2)', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                      <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#D97706' }}>📅 Due Today</span>
                    </div>
                    {dueTodayTasks.map((task) => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 20px', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                        <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task)} style={{ marginTop: 2, cursor: 'pointer', accentColor: '#1A3C28' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#1A3C28', margin: 0 }}>{task.title}</p>
                          {task.due_date && <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#D97706', margin: '3px 0 0' }}>Due {new Date(task.due_date).toLocaleDateString()}</p>}
                        </div>
                        {task.priority && <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: task.priority === 'high' ? 'rgba(220,38,38,0.08)' : task.priority === 'medium' ? 'rgba(217,119,6,0.08)' : 'rgba(26,60,40,0.06)', color: task.priority === 'high' ? '#DC2626' : task.priority === 'medium' ? '#D97706' : '#5A7A68', textTransform: 'capitalize' }}>{task.priority}</span>}
                      </div>
                    ))}
                  </>
                )}
                {thisWeekTasks.length > 0 && (
                  <>
                    <div style={{ padding: '10px 20px', background: 'rgba(26,60,40,0.03)', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                      <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#5A7A68' }}>📆 This Week</span>
                    </div>
                    {thisWeekTasks.map((task) => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 20px', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                        <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task)} style={{ marginTop: 2, cursor: 'pointer', accentColor: '#1A3C28' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#1A3C28', margin: 0 }}>{task.title}</p>
                          {task.due_date && <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#5A7A68', margin: '3px 0 0' }}>Due {new Date(task.due_date).toLocaleDateString()}</p>}
                        </div>
                        {task.priority && <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: task.priority === 'high' ? 'rgba(220,38,38,0.08)' : task.priority === 'medium' ? 'rgba(217,119,6,0.08)' : 'rgba(26,60,40,0.06)', color: task.priority === 'high' ? '#DC2626' : task.priority === 'medium' ? '#D97706' : '#5A7A68', textTransform: 'capitalize' }}>{task.priority}</span>}
                      </div>
                    ))}
                  </>
                )}
                {completedTasks.length > 0 && (
                  <>
                    <div style={{ padding: '10px 20px', background: 'rgba(16,185,129,0.05)', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                      <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#10B981' }}>✓ Completed</span>
                    </div>
                    {completedTasks.map((task) => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 20px', borderBottom: '1px solid rgba(26,60,40,0.06)' }}>
                        <input type="checkbox" checked={true} onChange={() => handleToggleTask(task)} style={{ marginTop: 2, cursor: 'pointer', accentColor: '#1A3C28' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#9BB5A8', margin: 0, textDecoration: 'line-through' }}>{task.title}</p>
                          {task.due_date && <p style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 11, color: '#9BB5A8', margin: '3px 0 0' }}>Due {new Date(task.due_date).toLocaleDateString()}</p>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          {/* Right: Add Task CTA + Stage Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#1A3C28', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 14, padding: '20px 18px' }}>
              <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 16, fontWeight: 700, color: '#F2E8D5', margin: '0 0 6px' }}>Create a task</h2>
              <p style={{ fontSize: 12, color: 'rgba(242,232,213,0.55)', margin: '0 0 16px' }}>Track follow-ups and stay on schedule</p>
              <button onClick={() => setShowAddTask(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#C4562A', border: '1px solid #C4562A', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                <CheckSquare className="h-4 w-4" /> Add Task
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid rgba(26,60,40,0.1)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(26,60,40,0.07)' }}>
                <h2 style={{ fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)', fontSize: 14, fontWeight: 700, color: '#1A3C28', margin: 0 }}>Stage Progress</h2>
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STAGE_ORDER.map((s, idx) => {
                  const cfg = stageConfig[s];
                  const isPast = idx < stageIndex;
                  const isCurrent = idx === stageIndex;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8, padding: '8px 10px', fontSize: 13, ...(isCurrent ? { background: '#1A3C28', border: '1px solid rgba(242,232,213,0.12)', fontWeight: 600, color: '#F2E8D5' } : isPast ? { background: 'rgba(26,60,40,0.04)', border: '1px solid transparent', color: '#5A7A68' } : { background: 'transparent', border: '1px solid transparent', color: '#9BB5A8', opacity: 0.6 }) }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isCurrent ? '#00E87A' : isPast ? '#10B981' : 'rgba(26,60,40,0.15)' }} />
                      <span style={{ flex: 1 }}>{cfg?.label ?? s}</span>
                      {isCurrent && <span style={{ fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)', fontSize: 10, color: 'rgba(242,232,213,0.55)', textTransform: 'uppercase' }}>Current</span>}
                      {isPast && <span style={{ color: '#10B981', fontSize: 12 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Edit Lead Modal */}
      <EditLeadModal
        lead={lead}
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={(updated) => setLead(updated)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{lead.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Log Activity Modal */}
      {activityModal && (
        <LogActivityModal
          leadId={lead.id}
          activityType={activityModal}
          open={true}
          onClose={() => setActivityModal(null)}
          onLogged={(activity) => setActivities(prev => [activity, ...prev])}
        />
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        leadId={lead.id}
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        onAdded={(task) => setTasks(prev => [...prev, task])}
      />
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value ?? '—'}</p>
    </div>
  );
}
