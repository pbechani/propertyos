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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <>
      <div className="space-y-6">
        {/* Back navigation */}
        <Link
          href="/app/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>

        {/* Lead header */}
        <Card className="rounded-2xl border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-semibold text-foreground">{lead.name}</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${temp.color}`}>
                    {temp.icon}
                    {temp.label}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${stage.color}`}>
                    {stage.label}
                  </span>
                  {lead.prequalified && (
                    <span className="inline-flex items-center rounded-full bg-green-100 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Pre-qualified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-3">
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-600 transition-colors">
                      <Mail className="h-4 w-4" />
                      {lead.email}
                    </a>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-green-600 transition-colors">
                      <Phone className="h-4 w-4" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.address && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {lead.address}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowEdit(true)}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left main info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Lead Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem label="Type" value={<span className="capitalize">{lead.type}</span>} />
                  <InfoItem label="Source" value={lead.source} />
                  <InfoItem label="Timeline" value={lead.timeline} />
                  {budgetDisplay && <InfoItem label="Budget" value={budgetDisplay} />}
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
                      value={formatBudget(lead.deal_value, null, lead.budget_currency) ?? lead.deal_value}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {lead.preferences && (
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{lead.preferences}</p>
                </CardContent>
              </Card>
            )}

            {lead.notes && (
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}

            {activities.length > 0 && (
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activities.map((activity, idx) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {activityIcons[activity.type] ?? <Edit className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        {idx < activities.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.actor_name ?? 'System'} &middot;{' '}
                          {new Date(activity.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Phone className="h-4 w-4 text-green-600" />
                    Call Lead
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Mail className="h-4 w-4 text-blue-600" />
                    Send Email
                  </a>
                )}
                <button
                  onClick={() => setActivityModal('sms')}
                  className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors text-left"
                >
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  Log SMS
                </button>
                <button
                  onClick={() => setActivityModal('meeting')}
                  className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors text-left"
                >
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Log Meeting
                </button>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors text-left"
                >
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  Add Task
                </button>
              </CardContent>
            </Card>

            {tasks.length > 0 && (
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">Tasks</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {tasks.map((task) => (
                    <div key={task.id} className="py-3 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task)}
                        className="mt-0.5 rounded border-border cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">Stage Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STAGE_ORDER.map((s, idx) => {
                  const cfg = stageConfig[s];
                  const isPast = idx < stageIndex;
                  const isCurrent = idx === stageIndex;
                  return (
                    <div
                      key={s}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                        isCurrent
                          ? 'bg-blue-50 border border-blue-200 font-medium text-blue-700'
                          : isPast
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground opacity-50'
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isCurrent ? 'bg-blue-500' : isPast ? 'bg-green-500' : 'bg-muted'}`} />
                      {cfg?.label ?? s}
                      {isCurrent && <span className="ml-auto text-xs font-normal">Current</span>}
                      {isPast && <span className="ml-auto text-xs text-green-600">✓</span>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
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
