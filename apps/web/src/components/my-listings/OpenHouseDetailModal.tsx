'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import {
  X,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Edit,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  Download,
  Share2,
  UserCheck,
  ClipboardList,
  MoreVertical
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { agentApi, viewingActionsApi, type OpenHouseAttendee } from '@/lib/api-client';
import { OpenHouseCheckInModal } from './OpenHouseCheckInModal';

interface OpenHouseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onCancelled?: (openHouseId: string) => void;
  authToken?: string;
  propertyAddress?: string;
  currentAgentName?: string;
  openHouse: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    attendance: number;
    interestedParties: number;
    status: 'upcoming' | 'in-progress' | 'ended' | 'completed' | 'cancelled';
    notes: string;
    preparationChecklist?: { task: string; completed: boolean }[];
    marketingOptions?: { channel: string; enabled: boolean }[];
  };
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getAttendeeName(a: OpenHouseAttendee): string {
  if (a.buyer_id) {
    const full = [a.first_name, a.last_name].filter(Boolean).join(' ');
    return full || '(Unknown)';
  }
  return a.guest_name ?? '(Unknown)';
}

export function OpenHouseDetailModal({ open, onOpenChange, onEdit, onCancelled, authToken, openHouse, propertyAddress, currentAgentName }: OpenHouseDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [attendees, setAttendees] = useState<OpenHouseAttendee[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Manual guest registration form state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState({ guestName: '', guestEmail: '', guestPhone: '', interestLevel: 'medium' as 'high' | 'medium' | 'low' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  async function handleRegisterGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!registerForm.guestName.trim()) return;
    setIsRegistering(true);
    setRegisterError('');
    try {
      const newAttendee = await viewingActionsApi.agentRegisterGuest(authToken ?? '', openHouse.id, {
        guestName: registerForm.guestName.trim(),
        guestEmail: registerForm.guestEmail.trim() || undefined,
        guestPhone: registerForm.guestPhone.trim() || undefined,
        interestLevel: registerForm.interestLevel,
      });
      setAttendees(prev => [...prev, newAttendee]);
      setRegisterForm({ guestName: '', guestEmail: '', guestPhone: '', interestLevel: 'medium' });
      setShowRegisterForm(false);
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : 'Failed to register guest');
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleCancelEvent() {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      await agentApi.cancelOpenHouse(authToken ?? '', openHouse.id, { reason: cancelReason.trim() });
      onCancelled?.(openHouse.id);
      onOpenChange(false);
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel event');
    } finally {
      setIsCancelling(false);
    }
  }

  const agentName = currentAgentName ?? 'Agent';
  const agentInitials = getInitials(agentName);

  // Check-in is only enabled when the current datetime falls within the open house window
  const isCheckInEnabled = (() => {
    try {
      const [sh, sm] = openHouse.startTime.split(':').map(Number);
      const [eh, em] = openHouse.endTime.split(':').map(Number);
      // Build Date objects for start and end on the open house date
      const base = new Date(openHouse.date);
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm, 0);
      const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em, 59);
      const now = new Date();
      return now >= start && now <= end;
    } catch {
      return false;
    }
  })();

  // Compute duration from start/end time strings (HH:MM)
  const durationLabel = (() => {
    try {
      const [sh, sm] = openHouse.startTime.split(':').map(Number);
      const [eh, em] = openHouse.endTime.split(':').map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins <= 0) return openHouse.endTime;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ');
    } catch {
      return '—';
    }
  })();

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'ended':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const STATUS_DISPLAY: Record<string, string> = {
    upcoming: 'Upcoming',
    'in-progress': 'In Progress',
    ended: 'Ended',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const isActive = openHouse.status === 'upcoming' || openHouse.status === 'in-progress';
  const isCompleted = openHouse.status === 'completed' || openHouse.status === 'ended';

  useEffect(() => {
    if (!open || !authToken) return;
    setIsLoadingAttendees(true);
    viewingActionsApi
      .getOpenHouseRegistrations(authToken, openHouse.id)
      .then(setAttendees)
      .catch(() => setAttendees([]))
      .finally(() => setIsLoadingAttendees(false));
  }, [open, openHouse.id, authToken]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Dialog.Title className="text-xl font-semibold">Open House Details</Dialog.Title>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(openHouse.status)}`}>
                  {STATUS_DISPLAY[openHouse.status] ?? openHouse.status}
                </span>
              </div>
              <Dialog.Description className="text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(openHouse.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {openHouse.startTime} - {openHouse.endTime}
                  </div>
                </div>
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <>
                  <button
                    onClick={() => onEdit?.()}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={() => setIsCheckInOpen(true)}
                    disabled={!isCheckInEnabled}
                    title={!isCheckInEnabled ? `Check-in opens at ${openHouse.startTime} on ${new Date(openHouse.date).toLocaleDateString()}` : undefined}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Start Check-In
                  </button>
                </>
              )}
              {isCompleted && (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[180px] z-50">
                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Report
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share Results
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item onSelect={() => onEdit?.()} className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Details
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              )}
              <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </Dialog.Close>
            </div>
          </div>

          {/* Stats Bar - Only show for completed events */}
          {isCompleted && (
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-200 bg-gray-50">
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">{openHouse.attendance}</div>
                <div className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Total Visitors
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{openHouse.interestedParties}</div>
                <div className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  High Interest
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-purple-600">
                  {attendees.filter(a => !!a.buyer_id).length}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Pre-Registered
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-orange-600">
                  {attendees.filter(a => a.attended).length}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Checked In
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <Tabs.List className="flex border-b border-gray-200 px-6">
              <Tabs.Trigger
                value="overview"
                className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors"
              >
                Overview
              </Tabs.Trigger>
              {/* Registrants tab — always shown so agent can see who signed up */}
              <Tabs.Trigger
                value="registrants"
                className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                Registrants
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                  {attendees.length}
                </span>
              </Tabs.Trigger>
              {isCompleted && (
                <>
                  <Tabs.Trigger
                    value="visitors"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    Visitors
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                      {attendees.filter(a => a.attended).length}
                    </span>
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="feedback"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    Feedback
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                      0
                    </span>
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="activity"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors"
                  >
                    Activity Log
                  </Tabs.Trigger>
                </>
              )}
            </Tabs.List>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              <Tabs.Content value="overview" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Event Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      Event Information
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property</span>
                        <span className="font-medium">{propertyAddress ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Event Type</span>
                        <span className="font-medium">Public Open House</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date</span>
                        <span className="font-medium">
                          {new Date(openHouse.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time</span>
                        <span className="font-medium">{openHouse.startTime} - {openHouse.endTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{durationLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Staff Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Staff
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Host Agent</div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {agentInitials}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{agentName}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    Event Notes
                  </h3>
                  <p className="text-sm text-gray-700">{openHouse.notes}</p>
                </div>

                {/* Marketing Channels */}
                {isActive && openHouse.marketingOptions && openHouse.marketingOptions.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-indigo-600" />
                      Marketing Status
                    </h3>
                    <div className="space-y-3">
                      {openHouse.marketingOptions.map((opt) => (
                        <div
                          key={opt.channel}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            opt.enabled
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {opt.enabled ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span className={`text-sm font-medium ${opt.enabled ? '' : 'text-gray-400'}`}>
                              {opt.channel}
                            </span>
                          </div>
                          <span className={`text-xs ${opt.enabled ? 'text-green-700' : 'text-gray-400'}`}>
                            {opt.enabled ? 'Enabled' : 'Not enabled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preparation Checklist */}
                {isActive && openHouse.preparationChecklist && openHouse.preparationChecklist.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-orange-600" />
                      Preparation Checklist
                    </h3>
                    <div className="space-y-2">
                      {openHouse.preparationChecklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                          <span className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Tabs.Content>

              {/* Registrants Tab — people who pre-registered, shown for all statuses */}
              <Tabs.Content value="registrants" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">Registered Attendees</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {attendees.length === 0 ? 'No one has registered yet' : `${attendees.length} person${attendees.length !== 1 ? 's' : ''} registered`}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowRegisterForm(v => !v); setRegisterError(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Registrant
                  </button>
                </div>

                {/* Inline registration form */}
                {showRegisterForm && (
                  <form onSubmit={handleRegisterGuest} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-900">Register a Guest</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={registerForm.guestName}
                          onChange={e => setRegisterForm(f => ({ ...f, guestName: e.target.value }))}
                          placeholder="e.g. John Smith"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={registerForm.guestEmail}
                          onChange={e => setRegisterForm(f => ({ ...f, guestEmail: e.target.value }))}
                          placeholder="e.g. john@email.com"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={registerForm.guestPhone}
                          onChange={e => setRegisterForm(f => ({ ...f, guestPhone: e.target.value }))}
                          placeholder="e.g. +27 82 000 0000"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Interest Level</label>
                        <select
                          value={registerForm.interestLevel}
                          onChange={e => setRegisterForm(f => ({ ...f, interestLevel: e.target.value as 'high' | 'medium' | 'low' }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                    {registerError && <p className="text-xs text-red-600">{registerError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowRegisterForm(false)} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                      <button type="submit" disabled={isRegistering} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                        {isRegistering && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Register
                      </button>
                    </div>
                  </form>
                )}

                {isLoadingAttendees ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading registrants…</span>
                  </div>
                ) : attendees.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">No registrations yet</p>
                    <p className="text-xs text-gray-400 mt-1">Buyers who register via the property page will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendees.map((att) => {
                      const name = getAttendeeName(att);
                      const email = att.email ?? att.guest_email ?? '—';
                      const phone = att.phone ?? att.guest_phone ?? null;
                      const interestColors: Record<string, string> = {
                        high: 'bg-green-100 text-green-700',
                        medium: 'bg-amber-100 text-amber-700',
                        low: 'bg-gray-100 text-gray-600',
                      };
                      const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div key={att.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-500 truncate">{email}{phone ? ` · ${phone}` : ''}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs text-gray-400">
                              {new Date(att.registered_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                            </span>
                            {att.attended && (
                              <span className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Attended
                              </span>
                            )}
                            {att.interest_level && (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${interestColors[att.interest_level] ?? ''}`}>
                                {att.interest_level} interest
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Tabs.Content>

              {/* Visitors Tab */}
              <Tabs.Content value="visitors" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Visitor Sign-In List</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {attendees.filter(a => a.attended).length} total visitors • {attendees.filter(a => a.attended && a.interest_level === 'high').length} high interest
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export List
                    </button>
                  </div>
                </div>

                {isLoadingAttendees ? (
                  <div className="flex justify-center py-8"><span className="text-sm text-gray-500">Loading visitors…</span></div>
                ) : attendees.filter(a => a.attended).length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No visitors checked in.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendees.filter(a => a.attended).map((attendee) => {
                      const name = getAttendeeName(attendee);
                      const email = attendee.email ?? attendee.guest_email ?? '—';
                      const phone = attendee.phone ?? attendee.guest_phone ?? '—';
                      const checkInTime = attendee.checked_in_at
                        ? new Date(attendee.checked_in_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const interestLevel = attendee.interest_level ?? 'low';
                      const isPreRegistered = !!attendee.buyer_id;
                      return (
                        <div key={attendee.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-medium">
                                  {getInitials(name)}
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {name}
                                    {isPreRegistered && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                        Pre-registered
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">Checked in at {checkInTime}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  {email}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  {phone}
                                </div>
                              </div>
                              {attendee.notes && (
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                                  <div className="font-medium text-gray-900 mb-1">Notes:</div>
                                  {attendee.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getInterestLevelColor(interestLevel)}`}>
                                {interestLevel.charAt(0).toUpperCase() + interestLevel.slice(1)} Interest
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-3 border-t border-gray-100">
                            {email !== '—' && (
                              <a
                                href={`mailto:${email}`}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Send Email
                              </a>
                            )}
                            {phone !== '—' && (
                              <a
                                href={`tel:${phone}`}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
                              >
                                <Phone className="w-4 h-4" />
                                Call
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Tabs.Content>

              {/* Feedback Tab */}
              <Tabs.Content value="feedback" className="space-y-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">Visitor Feedback</h3>
                  <p className="text-sm text-gray-600">0 responses</p>
                </div>
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No feedback collected yet.</p>
                </div>
              </Tabs.Content>

              {/* Activity Log Tab */}
              <Tabs.Content value="activity" className="space-y-3">
                <h3 className="font-semibold text-lg mb-4">Event Timeline</h3>

                <div className="space-y-3">
                  {(
                    [
                      { time: openHouse.endTime, action: 'Open house ended', icon: CheckCircle2, color: 'text-green-600', sortKey: openHouse.endTime },
                      ...attendees
                        .filter(a => a.checked_in_at)
                        .sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())
                        .map(a => {
                          const name = getAttendeeName(a);
                          const type = a.buyer_id ? 'Pre-registered' : 'Walk-in';
                          const t = new Date(a.checked_in_at!).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                          return { time: t, action: `${name} checked in (${type})`, icon: UserPlus, color: 'text-blue-600', sortKey: a.checked_in_at! };
                        }),
                      { time: openHouse.startTime, action: 'Open house started', icon: CheckCircle2, color: 'text-green-600', sortKey: openHouse.startTime },
                    ] as { time: string; action: string; icon: React.ComponentType<{ className?: string }>; color: string; sortKey: string }[]
                  ).map((event, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <event.icon className={`w-4 h-4 ${event.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{event.action}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{event.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs.Content>
            </div>
          </Tabs.Root>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {showCancelConfirm ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-700">Reason for cancellation <span className="text-red-500">*</span></p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Seller request, property sold, scheduling conflict…"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                {cancelError && <p className="text-xs text-red-600">{cancelError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowCancelConfirm(false); setCancelReason(''); setCancelError(''); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCancelEvent}
                    disabled={!cancelReason.trim() || isCancelling}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {isCancelling ? 'Cancelling…' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {isCompleted ? (
                    <>Event completed on {new Date(openHouse.date).toLocaleDateString()}</>
                  ) : (
                    <>Scheduled for {new Date(openHouse.date).toLocaleDateString()}</>
                  )}
                </div>
            <div className="flex gap-2">
              {isActive && !showCancelConfirm && (
                <button
                  onClick={() => { setShowCancelConfirm(true); setCancelError(''); setCancelReason(''); }}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Event
                </button>
              )}
              <Dialog.Close className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                Close
              </Dialog.Close>
            </div>
            </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Check-In Modal */}
      {isActive && (
        <OpenHouseCheckInModal
          open={isCheckInOpen}
          onOpenChange={setIsCheckInOpen}
          authToken={authToken ?? ''}
          openHouse={openHouse}
        />
      )}
    </Dialog.Root>
  );
}