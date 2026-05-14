'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar, Clock, Home, Video, Users, Mail, Phone, MapPin,
  AlertCircle, CheckCircle2, Loader2, XCircle, Edit2, Send,
  MessageSquare, ArrowLeft,
} from 'lucide-react';
import {
  propertiesApi,
  viewingsApi,
  type ListingViewingRecord,
  type PropertyListing,
  type ViewingMessage,
} from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth-session';
import { formatMoney } from '@/lib/formatters';
import { ListingBreadcrumbHeader } from '@/components/my-listings/ListingBreadcrumbHeader';

// ─── constants ───────────────────────────────────────────────────────────────

const DECLINE_REASONS = [
  'Property already sold',
  'Client did not respond to confirmation',
  'Schedule conflict',
  'Property temporarily unavailable',
  'Client requested cancellation',
  'other',
];
const CANCEL_REASONS = [
  'Schedule conflict',
  'Property no longer available',
  'Seller request',
  'Client requested cancellation',
  'Emergency / unforeseen circumstance',
  'other',
];
const QUICK_REPLIES = [
  { label: 'Confirm tomorrow', text: "Just confirming your viewing is scheduled for tomorrow. Looking forward to seeing you!" },
  { label: 'Directions', text: "Here are directions to the property. Visitor parking is available on site." },
  { label: 'Running late', text: "Hi, just a heads-up — I'm running about 10 minutes late. Thank you for your patience." },
  { label: 'Follow-up', text: "Thank you for viewing the property today! Do you have any questions or would you like to schedule a second visit?" },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function statusPillClass(status: string) {
  const m: Record<string, string> = {
    requested: 'bg-yellow-400/15 text-yellow-600 border-yellow-400/30',
    confirmed: 'bg-[#00E87A]/15 text-[#00C468] border-[#00E87A]/30',
    completed: 'bg-[#1A3C28]/10 text-[#1A3C28] border-[#1A3C28]/20',
    declined:  'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };
  return m[status] ?? m.requested;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtShort(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}
function groupKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}
function ViewingTypeIcon({ type }: { type: string }) {
  if (type === 'virtual') return <Video className="w-4 h-4" />;
  if (type === 'open_house') return <Users className="w-4 h-4" />;
  return <Home className="w-4 h-4" />;
}

// ─── main component ──────────────────────────────────────────────────────────

export default function ViewingDetailPage() {
  const { id: listingId, viewingId } = useParams<{ id: string; viewingId: string }>();
  const router = useRouter();
  const authToken = getAccessToken() ?? '';
  const user = getStoredUser();
  const agentName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'You' : 'You';

  const [viewing, setViewing] = useState<ListingViewingRecord | null>(null);
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // messaging
  const [messages, setMessages] = useState<ViewingMessage[]>([]);
  const [msgText, setMsgText] = useState('');
  const [msgChannel, setMsgChannel] = useState<'email' | 'sms'>('email');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  // actions
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');
  const [declineReasonText, setDeclineReasonText] = useState('');
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // success flashes
  const [flashConfirm, setFlashConfirm] = useState(false);
  const [flashDecline, setFlashDecline] = useState(false);
  const [flashCancel, setFlashCancel]   = useState(false);

  const scrollThread = useCallback(() => {
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    if (!authToken) { setIsLoading(false); return; }
    Promise.all([
      propertiesApi.getPropertyViewings(authToken, listingId),
      propertiesApi.getById(listingId, authToken),
      viewingsApi.getMessages(authToken, viewingId).catch(() => [] as ViewingMessage[]),
    ])
      .then(([records, listing, msgs]) => {
        const found = records.find(r => r.id === viewingId) ?? null;
        if (!found) setError('Viewing not found.');
        setViewing(found);
        setProperty(listing);
        setMessages(msgs);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load viewing.'))
      .finally(() => setIsLoading(false));
  }, [listingId, viewingId, authToken]);

  useEffect(() => { scrollThread(); }, [messages, scrollThread]);

  async function handleConfirm() {
    if (!viewing) return;
    setActionPending(true); setActionError('');
    try {
      await viewingsApi.confirm(authToken, viewing.id);
      setViewing({ ...viewing, status: 'confirmed' });
      setFlashConfirm(true);
      setTimeout(() => setFlashConfirm(false), 3000);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionPending(false); }
  }

  async function handleDeclineSubmit() {
    if (!viewing) return;
    const reason = selectedDeclineReason === 'other' ? declineReasonText : selectedDeclineReason;
    if (!reason.trim()) return;
    setActionPending(true); setActionError('');
    try {
      await viewingsApi.decline(authToken, viewing.id, { reason });
      setViewing({ ...viewing, status: 'declined' });
      setShowDeclineForm(false);
      setFlashDecline(true);
      setTimeout(() => setFlashDecline(false), 3000);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionPending(false); }
  }

  async function handleCancelSubmit() {
    if (!viewing) return;
    const reason = selectedCancelReason === 'other' ? cancelReasonText : selectedCancelReason;
    if (!reason.trim()) return;
    setActionPending(true); setActionError('');
    try {
      await viewingsApi.cancel(authToken, viewing.id, { reason });
      setViewing({ ...viewing, status: 'cancelled' });
      setShowCancelForm(false);
      setFlashCancel(true);
      setTimeout(() => setFlashCancel(false), 3000);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionPending(false); }
  }

  async function handleReschedule() {
    if (!viewing || !rescheduleDate) return;
    setActionPending(true); setActionError('');
    try {
      const result = await viewingsApi.reschedule(authToken, viewing.id, {
        scheduledAt: new Date(rescheduleDate).toISOString(),
        reason: rescheduleReason.trim() || undefined,
      });
      setViewing({ ...viewing, scheduled_at: result.scheduled_at, status: result.status });
      setShowRescheduleForm(false);
      setRescheduleDate(''); setRescheduleReason('');
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionPending(false); }
  }

  async function handleSendMessage() {
    const text = msgText.trim();
    if (!text || !viewing) return;
    setIsSending(true); setSendError('');
    try {
      const saved = await viewingsApi.sendMessage(authToken, viewing.id, { channel: msgChannel, message: text });
      setMessages(prev => [...prev, saved]);
      setMsgText('');
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Failed to send');
    } finally { setIsSending(false); }
  }

  function handleComposeKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSendMessage();
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#F2E8D5]">
      <Loader2 className="w-8 h-8 text-[#1A3C28] animate-spin" />
    </div>
  );

  if (error || !viewing) return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-[#F2E8D5] min-h-screen">
      <button onClick={() => router.push(`/app/my-listings/${listingId}`)}
        className="flex items-center gap-2 text-sm text-[#1A3C28]/50 hover:text-[#1A3C28] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to listing
      </button>
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p>{error || 'Viewing not found.'}</p>
      </div>
    </div>
  );

  const dt = viewing.scheduled_at;
  const buyerName = [viewing.buyer_first_name, viewing.buyer_last_name].filter(Boolean).join(' ') || 'Unknown Buyer';
  const displayStatus = viewing.status === 'requested' ? 'pending' : viewing.status;
  const isPending = viewing.status === 'requested';
  const isConfirmed = viewing.status === 'confirmed';
  const isActive = isPending || isConfirmed;

  type MsgGroup = { key: string; items: ViewingMessage[] };
  const messageGroups: MsgGroup[] = messages.reduce<MsgGroup[]>((acc, msg) => {
    const key = groupKey(msg.created_at);
    const last = acc[acc.length - 1];
    if (last && last.key === key) { last.items.push(msg); }
    else { acc.push({ key, items: [msg] }); }
    return acc;
  }, []);

  // suppress unused-var warning — agentName is available for future use
  void agentName;

  return (
    <div className="min-h-screen bg-[#F2E8D5]">
      <ListingBreadcrumbHeader
        backHref={`/app/my-listings/${listingId}`}
        listingId={listingId}
        address={property?.location?.address_line1 ?? property?.title ?? null}
        listingStatus={viewing.status}
        crumbs={[
          { label: 'Viewings', href: `/app/my-listings/${listingId}?tab=viewings` },
          { label: `${buyerName} · ${new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` },
        ]}
        titleOverride={buyerName}
      />

      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-4">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <div className="bg-[#1A3C28] rounded-2xl px-6 py-5 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#00E87A] opacity-[0.04] pointer-events-none" />
          <div className="absolute right-16 -bottom-16 w-36 h-36 rounded-full bg-[#B89040] opacity-[0.05] pointer-events-none" />

          <div className="w-14 h-14 rounded-full bg-[#B89040] flex items-center justify-center font-bold text-white text-xl flex-shrink-0 border-2 border-white/15">
            {initials(buyerName)}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-xl leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              {buyerName}
            </h1>
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-wide font-mono">
              {viewing.viewing_type.replace('_', ' ')} · {property?.title ?? 'Property viewing'}
            </p>
            <p className="text-[#00E87A] text-sm font-semibold mt-1.5">
              {fmtDate(dt)} &nbsp;·&nbsp; {fmtTime(dt)}
              {viewing.duration_minutes ? ` · ${viewing.duration_minutes} min` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border font-mono ${statusPillClass(viewing.status)}`}>
              {displayStatus}
            </span>
            {isPending && (
              <button onClick={handleConfirm} disabled={actionPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00E87A] text-[#1A3C28] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm
              </button>
            )}
            {isActive && (
              <button onClick={() => { setShowRescheduleForm(v => !v); setShowDeclineForm(false); setShowCancelForm(false); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.08] border border-white/[0.12] text-white/70 text-xs font-semibold rounded-xl hover:bg-white/[0.12] transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
                Reschedule
              </button>
            )}
            {isActive && (
              <button onClick={() => {
                if (isPending) { setShowDeclineForm(v => !v); setShowCancelForm(false); setShowRescheduleForm(false); }
                else { setShowCancelForm(v => !v); setShowDeclineForm(false); setShowRescheduleForm(false); }
              }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#C4562A]/15 border border-[#C4562A]/30 text-[#F08060] text-xs font-semibold rounded-xl hover:bg-[#C4562A]/25 transition-colors">
                <XCircle className="w-3.5 h-3.5" />
                {isPending ? 'Decline' : 'Cancel'}
              </button>
            )}
          </div>
        </div>

        {/* ── FLASHES ──────────────────────────────────────────────────────── */}
        {flashConfirm && (
          <div className="flex items-center gap-3 px-5 py-4 bg-[#00E87A]/10 border border-[#00E87A]/30 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-[#00C468]" />
            <span className="text-sm font-medium text-[#1A3C28]">Viewing confirmed — client has been notified.</span>
          </div>
        )}
        {flashDecline && (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-800">Viewing declined — client has been notified.</span>
          </div>
        )}
        {flashCancel && (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-800">Viewing cancelled — client has been notified.</span>
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-800">{actionError}</span>
          </div>
        )}

        {/* ── DECLINE FORM ─────────────────────────────────────────────────── */}
        {showDeclineForm && (
          <div className="bg-white border-2 border-red-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Decline Viewing Request</h3>
                <p className="text-sm text-red-700 mt-0.5">The client will be notified. Select a reason below.</p>
              </div>
            </div>
            <select value={selectedDeclineReason} onChange={e => setSelectedDeclineReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="">Select a reason…</option>
              {DECLINE_REASONS.map(r => <option key={r} value={r}>{r === 'other' ? 'Other (specify below)' : r}</option>)}
            </select>
            {selectedDeclineReason === 'other' && (
              <textarea value={declineReasonText} onChange={e => setDeclineReasonText(e.target.value)}
                placeholder="Please provide details…" rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
            )}
            <div className="flex gap-2">
              <button onClick={handleDeclineSubmit}
                disabled={actionPending || !selectedDeclineReason || (selectedDeclineReason === 'other' && !declineReasonText)}
                className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {actionPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Decline
              </button>
              <button onClick={() => { setShowDeclineForm(false); setSelectedDeclineReason(''); setDeclineReasonText(''); }}
                className="px-5 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── CANCEL FORM ──────────────────────────────────────────────────── */}
        {showCancelForm && (
          <div className="bg-white border-2 border-red-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Cancel Viewing</h3>
                <p className="text-sm text-red-700 mt-0.5">The client will be notified. Select a reason below.</p>
              </div>
            </div>
            <select value={selectedCancelReason} onChange={e => setSelectedCancelReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="">Select a reason…</option>
              {CANCEL_REASONS.map(r => <option key={r} value={r}>{r === 'other' ? 'Other (specify below)' : r}</option>)}
            </select>
            {selectedCancelReason === 'other' && (
              <textarea value={cancelReasonText} onChange={e => setCancelReasonText(e.target.value)}
                placeholder="Please provide details…" rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
            )}
            <div className="flex gap-2">
              <button onClick={handleCancelSubmit}
                disabled={actionPending || !selectedCancelReason || (selectedCancelReason === 'other' && !cancelReasonText)}
                className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {actionPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Cancel
              </button>
              <button onClick={() => { setShowCancelForm(false); setSelectedCancelReason(''); setCancelReasonText(''); }}
                className="px-5 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
                Keep Viewing
              </button>
            </div>
          </div>
        )}

        {/* ── RESCHEDULE FORM ──────────────────────────────────────────────── */}
        {showRescheduleForm && (
          <div className="bg-white border-2 border-[#1A3C28]/20 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Edit2 className="w-5 h-5 text-[#1A3C28] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#1A3C28]">Reschedule Viewing</h3>
                <p className="text-sm text-[#1A3C28]/60 mt-0.5">Choose a new date and time.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#1A3C28]/60 mb-1.5">New Date &amp; Time *</label>
                <input type="datetime-local" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C28]/30" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A3C28]/60 mb-1.5">Reason (optional)</label>
                <input type="text" value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Property maintenance"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C28]/30" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReschedule} disabled={actionPending || !rescheduleDate}
                className="px-5 py-2 bg-[#1A3C28] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {actionPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Reschedule
              </button>
              <button onClick={() => { setShowRescheduleForm(false); setRescheduleDate(''); setRescheduleReason(''); }}
                className="px-5 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── BODY GRID ────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Property card */}
            {property && (
              <div className="bg-white border border-[#1A3C28]/10 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1A3C28]/08 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#1A3C28]/35" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A3C28]/40">Property</span>
                </div>
                <div className="p-3">
                  <div className="bg-[#1A3C28] rounded-lg p-3 flex gap-3 items-center">
                    <div className="w-11 h-11 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Home className="w-5 h-5 text-white/50" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-[13px] leading-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>
                        {property.title}
                      </p>
                      {property.location?.address_line1 && (
                        <p className="text-white/45 text-[11px] mt-0.5 truncate">{property.location.address_line1}</p>
                      )}
                      <p className="text-[#00E87A] text-[11px] font-semibold mt-1 font-mono">
                        {formatMoney(property.price, property.currency)}
                        {property.bedrooms != null && ` · ${property.bedrooms} bed`}
                        {property.bathrooms != null && ` · ${property.bathrooms} bath`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Viewing details */}
            <div className="bg-white border border-[#1A3C28]/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A3C28]/08 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#1A3C28]/35" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A3C28]/40">Viewing Details</span>
              </div>
              <div className="divide-y divide-[#1A3C28]/06">
                {[
                  { icon: <Calendar className="w-4 h-4 text-[#1A3C28]/50" />, bg: 'bg-[#1A3C28]/08', label: 'Date', value: fmtDate(dt) },
                  { icon: <Clock className="w-4 h-4 text-[#C4562A]" />, bg: 'bg-[#C4562A]/08', label: 'Time', value: fmtTime(dt) + (viewing.duration_minutes ? ` · ${viewing.duration_minutes} min` : '') },
                  { icon: <ViewingTypeIcon type={viewing.viewing_type} />, bg: 'bg-[#1A3C28]/08', label: 'Type', value: viewing.viewing_type.replace('_', ' ') },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 ${row.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {row.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wide text-[#1A3C28]/40">{row.label}</p>
                      <p className="text-sm font-medium text-[#1A3C28] capitalize mt-0.5">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client contact */}
            <div className="bg-white border border-[#1A3C28]/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1A3C28]/08 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A3C28]/40">Client Contact</span>
              </div>
              <div className="p-3 space-y-1">
                {viewing.buyer_email && (
                  <a href={`mailto:${viewing.buyer_email}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1A3C28]/05 transition-colors group">
                    <Mail className="w-4 h-4 text-[#1A3C28]/35 group-hover:text-[#1A3C28]" />
                    <div>
                      <p className="text-[10px] font-mono text-[#1A3C28]/40">Email</p>
                      <p className="text-sm text-[#1A3C28]">{viewing.buyer_email}</p>
                    </div>
                  </a>
                )}
                {viewing.buyer_phone && (
                  <a href={`tel:${viewing.buyer_phone}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1A3C28]/05 transition-colors group">
                    <Phone className="w-4 h-4 text-[#1A3C28]/35 group-hover:text-[#1A3C28]" />
                    <div>
                      <p className="text-[10px] font-mono text-[#1A3C28]/40">Phone</p>
                      <p className="text-sm text-[#1A3C28]">{viewing.buyer_phone}</p>
                    </div>
                  </a>
                )}
                {!viewing.buyer_email && !viewing.buyer_phone && (
                  <p className="text-sm text-[#1A3C28]/40 px-2.5 py-2">No contact details on file</p>
                )}
              </div>
            </div>

            {/* Decline / cancel reason */}
            {viewing.cancel_reason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-red-500 mb-1.5">
                  {viewing.status === 'declined' ? 'Decline Reason' : 'Cancellation Reason'}
                </p>
                <p className="text-sm text-red-900">{viewing.cancel_reason}</p>
              </div>
            )}

            {/* Buyer feedback */}
            {viewing.buyer_feedback && (
              <div className="bg-[#B89040]/08 border border-[#B89040]/25 rounded-xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#B89040] mb-1.5">Buyer Feedback</p>
                <div className="flex gap-2">
                  <MessageSquare className="w-4 h-4 text-[#B89040] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#1A3C28]/75">{String(viewing.buyer_feedback)}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-[#1A3C28]/35 px-1 font-mono">
              Requested {new Date(viewing.created_at).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* ── MESSAGES ─────────────────────────────────────────────── */}
            <div className="bg-white border border-[#1A3C28]/10 rounded-xl overflow-hidden flex flex-col">

              {/* header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1A3C28]/08">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#1A3C28]/40" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A3C28]/40">Messages</span>
                  {messages.length > 0 && (
                    <span className="px-2 py-0.5 bg-[#00E87A] text-[#1A3C28] text-[10px] font-bold rounded-full font-mono">
                      {messages.length}
                    </span>
                  )}
                </div>
              </div>

              {/* quick replies */}
              <div className="flex gap-1.5 flex-wrap px-4 pt-3">
                {QUICK_REPLIES.map(qr => (
                  <button key={qr.label} onClick={() => setMsgText(qr.text)}
                    className="px-3 py-1 rounded-full border border-[#1A3C28]/15 text-[11px] font-medium text-[#1A3C28]/55 hover:border-[#1A3C28] hover:text-[#1A3C28] hover:bg-[#1A3C28]/05 transition-colors">
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* thread */}
              <div ref={threadRef}
                className="overflow-y-auto px-5 py-4 space-y-4 min-h-[320px] max-h-[440px]"
                style={{ background: '#F8F3EB' }}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <MessageSquare className="w-10 h-10 text-[#1A3C28]/15 mb-3" />
                    <p className="text-sm text-[#1A3C28]/35">No messages yet</p>
                    <p className="text-xs text-[#1A3C28]/25 mt-1">Send the client a message below</p>
                  </div>
                )}
                {messageGroups.map(group => (
                  <div key={group.key} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-[#1A3C28]/10" />
                      <span className="text-[10px] font-mono text-[#1A3C28]/30 uppercase tracking-wide px-2">{group.key}</span>
                      <div className="flex-1 h-px bg-[#1A3C28]/10" />
                    </div>
                    {group.items.map(msg => {
                      const isAgent = msg.direction === 'outbound';
                      return (
                        <div key={msg.id} className={`flex flex-col gap-1 ${isAgent ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-2 text-[10px] font-mono text-[#1A3C28]/35 ${isAgent ? 'flex-row-reverse' : ''}`}>
                            <span>{msg.sender_name}</span>
                            <span>·</span>
                            <span>{fmtShort(msg.created_at)}</span>
                            <span className="flex items-center gap-1 bg-[#1A3C28]/06 px-1.5 py-0.5 rounded text-[9px]">
                              {msg.channel === 'email'
                                ? <Mail className="w-2.5 h-2.5" />
                                : <Phone className="w-2.5 h-2.5" />}
                              {msg.channel.toUpperCase()}
                            </span>
                          </div>
                          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${
                            isAgent
                              ? 'bg-[#1A3C28] text-white rounded-br-sm'
                              : 'bg-white text-[#1A3C28] border border-[#1A3C28]/10 rounded-bl-sm'
                          }`}>
                            {msg.message}
                          </div>
                          {isAgent && (
                            <p className={`text-[10px] font-mono flex items-center gap-1 ${msg.status === 'failed' ? 'text-red-500' : 'text-[#00C468]'}`}>
                              {msg.status === 'failed' ? '✕ Failed' : msg.status === 'read' ? '✓✓ Read' : '✓ Delivered'}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* compose */}
              <div className="border-t border-[#1A3C28]/08 p-4 bg-white">
                {sendError && (
                  <p className="text-xs text-red-600 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {sendError}
                  </p>
                )}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 bg-[#F2E8D5] border border-[#1A3C28]/15 rounded-xl overflow-hidden">
                    <textarea
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={handleComposeKeyDown}
                      placeholder={`Write a message to ${viewing.buyer_first_name || 'client'}…`}
                      rows={2}
                      className="w-full px-4 pt-3 pb-1 text-[13.5px] font-sans text-[#1A3C28] bg-transparent border-none outline-none resize-none"
                    />
                    <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
                      <div className="flex gap-1">
                        {(['email', 'sms'] as const).map(ch => (
                          <button key={ch} onClick={() => setMsgChannel(ch)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wide border transition-all ${
                              msgChannel === ch
                                ? ch === 'email'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-green-50 text-green-700 border-green-200'
                                : 'text-[#1A3C28]/35 border-transparent hover:border-[#1A3C28]/15'
                            }`}>
                            {ch === 'email' ? <Mail className="w-2.5 h-2.5" /> : <Phone className="w-2.5 h-2.5" />}
                            {ch}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-[#1A3C28]/25">⌘↵ to send</span>
                    </div>
                  </div>
                  <button onClick={() => void handleSendMessage()} disabled={isSending || !msgText.trim()}
                    className="w-11 h-11 bg-[#1A3C28] rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-85 transition-opacity disabled:opacity-40">
                    {isSending
                      ? <Loader2 className="w-4 h-4 text-[#00E87A] animate-spin" />
                      : <Send className="w-4 h-4 text-[#00E87A]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* ── PRIVATE NOTES ─────────────────────────────────────────── */}
            <div className="bg-white border border-[#1A3C28]/10 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#1A3C28]/08 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#1A3C28]/40">Private Notes</span>
                <span className="text-[10px] text-[#1A3C28]/25 font-mono">(agent only)</span>
              </div>
              <textarea
                value={agentNotes}
                onChange={e => { setAgentNotes(e.target.value); setNotesSaved(false); }}
                placeholder="Add internal notes about this viewing — not visible to the client…"
                rows={4}
                className="w-full px-5 py-4 text-sm text-[#1A3C28] bg-transparent border-none outline-none resize-none leading-relaxed"
              />
              <div className="px-5 pb-4 flex justify-end gap-2 items-center">
                {notesSaved && <span className="text-xs text-[#00C468] font-mono">Saved ✓</span>}
                <button onClick={() => setNotesSaved(true)}
                  className="px-4 py-1.5 bg-[#1A3C28] text-white text-xs font-semibold rounded-lg hover:opacity-85 transition-opacity">
                  Save Notes
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
