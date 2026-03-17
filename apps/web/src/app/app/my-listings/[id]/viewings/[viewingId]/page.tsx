'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, X, Calendar, Clock, User, Phone, Mail, MapPin, Home, Video, Users,
  MessageSquare, Check, XCircle, Edit2, Send, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import {
  propertiesApi,
  viewingsApi,
  type ListingViewingRecord,
  type PropertyListing,
} from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth-session';
import { formatMoney } from '@/lib/formatters';

const DECLINE_REASONS = [
  'Property already sold',
  'Client did not respond to confirmation',
  'Schedule conflict',
  'Property temporarily unavailable',
  'Client requested cancellation',
  'other',
];

function getStatusBadgeClass(status: string) {
  const map: Record<string, string> = {
    requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    declined:  'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[status] ?? 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

function ViewingTypeIcon({ type }: { type: string }) {
  if (type === 'virtual') return <Video className="w-5 h-5" />;
  if (type === 'open_house') return <Users className="w-5 h-5" />;
  return <Home className="w-5 h-5" />;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

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

  // Actions
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');
  const [declineReasonText, setDeclineReasonText] = useState('');
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false);
  const [showDeclineSuccess, setShowDeclineSuccess] = useState(false);
  const [agentNotes, setAgentNotes] = useState('');

  useEffect(() => {
    if (!authToken) { setIsLoading(false); return; }
    Promise.all([
      propertiesApi.getPropertyViewings(authToken, listingId),
      propertiesApi.getById(listingId, authToken),
    ])
      .then(([records, listing]) => {
        const found = records.find(r => r.id === viewingId) ?? null;
        if (!found) setError('Viewing not found.');
        setViewing(found);
        setProperty(listing);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load viewing.'))
      .finally(() => setIsLoading(false));
  }, [listingId, viewingId, authToken]);

  async function handleConfirm() {
    if (!viewing) return;
    setActionPending(true);
    setActionError('');
    try {
      await viewingsApi.confirm(authToken, viewing.id);
      setViewing({ ...viewing, status: 'confirmed' });
      setShowConfirmSuccess(true);
      setTimeout(() => setShowConfirmSuccess(false), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionPending(false);
    }
  }

  async function handleDeclineSubmit() {
    if (!viewing) return;
    const reason = selectedDeclineReason === 'other' ? declineReasonText : selectedDeclineReason;
    if (!reason.trim()) return;
    setActionPending(true);
    setActionError('');
    try {
      await viewingsApi.decline(authToken, viewing.id, { reason });
      setViewing({ ...viewing, status: 'declined' });
      setShowDeclineSuccess(true);
      setShowDeclineForm(false);
      setTimeout(() => setShowDeclineSuccess(false), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionPending(false);
    }
  }

  async function handleReschedule() {
    if (!viewing || !rescheduleDate) return;
    setActionPending(true);
    setActionError('');
    try {
      const result = await viewingsApi.reschedule(authToken, viewing.id, {
        scheduledAt: new Date(rescheduleDate).toISOString(),
        reason: rescheduleReason.trim() || undefined,
      });
      setViewing({ ...viewing, scheduled_at: result.scheduled_at, status: result.status });
      setShowRescheduleForm(false);
      setRescheduleDate('');
      setRescheduleReason('');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionPending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !viewing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <button onClick={() => router.push(`/app/my-listings/${listingId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to listing
        </button>
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p>{error || 'Viewing not found.'}</p>
        </div>
      </div>
    );
  }

  const dt = new Date(viewing.scheduled_at);
  const buyerName = [viewing.buyer_first_name, viewing.buyer_last_name].filter(Boolean).join(' ') || 'Unknown Buyer';
  const displayStatus = viewing.status === 'requested' ? 'pending' : viewing.status;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/app/my-listings/${listingId}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listing
      </button>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">

        {/* Success overlays */}
        {showConfirmSuccess && (
          <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Viewing Confirmed!</h3>
              <p className="text-gray-600">Confirmation email has been sent to the client.</p>
            </div>
          </div>
        )}

        {showDeclineSuccess && (
          <div className="absolute inset-0 bg-white z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Viewing Declined</h3>
              <p className="text-gray-600">The client has been notified.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h1 className="text-xl font-semibold">Viewing Request Details</h1>
            <p className="text-sm text-gray-600 mt-1">Review and manage this viewing request</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusBadgeClass(viewing.status)}`}>
              {displayStatus}
            </span>
            <button onClick={() => router.push(`/app/my-listings/${listingId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body — 2 column */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">

            {/* ── Left column ── */}
            <div className="space-y-6">

              {/* Property Info */}
              {property && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Property</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900">{property.title}</div>
                    {property.location?.address_line1 && (
                      <div className="text-sm text-gray-600">{property.location.address_line1}</div>
                    )}
                    {property.location?.city && (
                      <div className="text-sm text-gray-600">
                        {property.location.city}{property.location.region ? `, ${property.location.region}` : ''}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      {formatMoney(property.price, property.currency)}
                      {property.bedrooms != null && ` • ${property.bedrooms} bed`}
                      {property.bathrooms != null && ` • ${property.bathrooms} bath`}
                      {property.area_sqm != null && ` • ${property.area_sqm} m²`}
                    </div>
                  </div>
                </div>
              )}

              {/* Viewing Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Viewing Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Date</div>
                      <div className="font-medium">
                        {dt.toLocaleDateString('en-ZA', {
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Time &amp; Duration</div>
                      <div className="font-medium">
                        {dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {viewing.duration_minutes && (
                        <div className="text-sm text-gray-500">{viewing.duration_minutes} minutes</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 text-green-600">
                      <ViewingTypeIcon type={viewing.viewing_type} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Viewing Type</div>
                      <div className="font-medium capitalize">
                        {viewing.viewing_type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requested timestamp */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <strong>Requested:</strong>{' '}
                  {new Date(viewing.created_at).toLocaleString('en-ZA', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="space-y-6">

              {/* Client Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Client Information</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">{initials(buyerName)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{buyerName}</div>
                      <div className="text-sm text-gray-500">Potential Buyer</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {viewing.buyer_email && (
                      <a href={`mailto:${viewing.buyer_email}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <Mail className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="text-sm text-gray-900 group-hover:text-blue-600">{viewing.buyer_email}</div>
                        </div>
                      </a>
                    )}
                    {viewing.buyer_phone && (
                      <a href={`tel:${viewing.buyer_phone}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                        <Phone className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Phone</div>
                          <div className="text-sm text-gray-900 group-hover:text-blue-600">{viewing.buyer_phone}</div>
                        </div>
                      </a>
                    )}
                    {!viewing.buyer_email && !viewing.buyer_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 p-3">
                        <User className="w-4 h-4" /> No contact details on file
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buyer feedback */}
              {viewing.buyer_feedback && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Buyer Feedback</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-900">{String(viewing.buyer_feedback)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel/decline reason */}
              {viewing.cancel_reason && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    {viewing.status === 'declined' ? 'Decline Reason' : 'Cancellation Reason'}
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900">{viewing.cancel_reason}</p>
                  </div>
                </div>
              )}

              {/* Assigned Agent */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Assigned Agent</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
                      {initials(agentName)}
                    </div>
                    <div>
                      <div className="font-medium">{agentName} (You)</div>
                      {user?.companyName && (
                        <div className="text-sm text-gray-500">{user.companyName}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Notes */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Agent Notes</h3>
                <textarea
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  placeholder="Add internal notes about this viewing request..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Decline Form */}
          {showDeclineForm && (
            <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Decline Viewing Request</h3>
                  <p className="text-sm text-red-800">
                    The client will be notified via email. Please select a reason for declining.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Reason for Declining *
                  </label>
                  <select
                    value={selectedDeclineReason}
                    onChange={(e) => setSelectedDeclineReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  >
                    <option value="">Select a reason...</option>
                    {DECLINE_REASONS.map(r => (
                      <option key={r} value={r}>
                        {r === 'other' ? 'Other (specify below)' : r}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDeclineReason === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Additional Details *
                    </label>
                    <textarea
                      value={declineReasonText}
                      onChange={(e) => setDeclineReasonText(e.target.value)}
                      placeholder="Please provide details..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                    />
                  </div>
                )}

                {actionError && <p className="text-sm text-red-600">{actionError}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={handleDeclineSubmit}
                    disabled={
                      actionPending ||
                      !selectedDeclineReason ||
                      (selectedDeclineReason === 'other' && !declineReasonText)
                    }
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Decline
                  </button>
                  <button
                    onClick={() => { setShowDeclineForm(false); setSelectedDeclineReason(''); setDeclineReasonText(''); }}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Reschedule Form */}
          {showRescheduleForm && (
            <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <Edit2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Reschedule Viewing</h3>
                  <p className="text-sm text-blue-800">
                    Select a new date and time. The client will be notified of the change.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    New Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="e.g. Seller requested a different time"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                {actionError && <p className="text-sm text-red-600">{actionError}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={handleReschedule}
                    disabled={actionPending || !rescheduleDate}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Reschedule
                  </button>
                  <button
                    onClick={() => { setShowRescheduleForm(false); setRescheduleDate(''); setRescheduleReason(''); }}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showDeclineForm && !showRescheduleForm && viewing.status === 'requested' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              Awaiting confirmation
            </div>
            {actionError && <p className="text-sm text-red-600 mx-4">{actionError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineForm(true)}
                className="px-6 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={() => { setShowRescheduleForm(true); setShowDeclineForm(false); }}
                className="px-6 py-2.5 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
              >
                <Edit2 className="w-5 h-5" />
                Reschedule
              </button>
              <button
                onClick={handleConfirm}
                disabled={actionPending}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {actionPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Confirm Viewing
              </button>
            </div>
          </div>
        )}

        {viewing.status === 'confirmed' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-green-50">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">This viewing has been confirmed</span>
            </div>
            <div className="flex gap-3">
              {!showRescheduleForm && (
                <button
                  onClick={() => setShowRescheduleForm(true)}
                  className="px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Reschedule
                </button>
              )}
              <button
                onClick={() => router.push(`/app/my-listings/${listingId}`)}
                className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Listing
              </button>
            </div>
          </div>
        )}

        {(viewing.status === 'declined' || viewing.status === 'cancelled') && (
          <div className="flex items-center px-6 py-4 border-t border-gray-200 bg-red-50 gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            <span className="font-medium capitalize">This viewing has been {viewing.status}</span>
          </div>
        )}

        {viewing.status === 'completed' && (
          <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 text-gray-600">
            <CheckCircle2 className="w-5 h-5 text-gray-400" />
            <span className="text-sm">This viewing has been completed.</span>
          </div>
        )}
      </div>
    </div>
  );
}
