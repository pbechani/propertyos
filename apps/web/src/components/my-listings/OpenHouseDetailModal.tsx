'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import {
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  TrendingUp,
  Edit,
  CheckCircle2,
  XCircle,
  Star,
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  Download,
  Share2,
  ThumbsUp,
  UserCheck,
  ClipboardList,
  MoreVertical
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { agentApi } from '@/lib/api-client';
import { OpenHouseCheckInModal } from './OpenHouseCheckInModal';

interface Visitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  checkInTime: string;
  interestLevel: 'high' | 'medium' | 'low';
  preRegistered: boolean;
  notes: string;
  addedToLeads: boolean;
}

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

const mockVisitors: Visitor[] = [
  {
    id: '1',
    name: 'Sarah Martinez',
    email: 'sarah.m@email.com',
    phone: '(310) 555-0123',
    checkInTime: '2:15 PM',
    interestLevel: 'high',
    preRegistered: true,
    notes: 'Looking for family home in good school district. Very interested in the property.',
    addedToLeads: true
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '(310) 555-0456',
    checkInTime: '2:30 PM',
    interestLevel: 'high',
    preRegistered: true,
    notes: 'First-time buyer, pre-approved for $900K. Mentioned submitting an offer.',
    addedToLeads: true
  },
  {
    id: '3',
    name: 'Jennifer Williams',
    email: 'jen.williams@email.com',
    phone: '(310) 555-0789',
    checkInTime: '2:45 PM',
    interestLevel: 'medium',
    preRegistered: false,
    notes: 'Walk-in visitor. Interested but needs to sell current home first.',
    addedToLeads: false
  },
  {
    id: '4',
    name: 'David Park',
    email: 'david.park@email.com',
    phone: '(310) 555-0321',
    checkInTime: '3:00 PM',
    interestLevel: 'medium',
    preRegistered: true,
    notes: 'Investor looking at multiple properties in the area.',
    addedToLeads: true
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.t@email.com',
    phone: '(310) 555-0654',
    checkInTime: '3:20 PM',
    interestLevel: 'low',
    preRegistered: false,
    notes: 'Just browsing, not actively looking to buy.',
    addedToLeads: false
  }
];

const mockFeedback = [
  {
    id: '1',
    visitorName: 'Sarah Martinez',
    rating: 5,
    comment: 'Beautiful home! Love the modern kitchen and spacious backyard. Definitely interested.',
    timestamp: '2:45 PM'
  },
  {
    id: '2',
    visitorName: 'Michael Chen',
    rating: 5,
    comment: 'Perfect layout for our family. The location is ideal and the finishes are top-notch.',
    timestamp: '3:00 PM'
  },
  {
    id: '3',
    visitorName: 'David Park',
    rating: 4,
    comment: 'Good investment opportunity. Would like more information about rental potential.',
    timestamp: '3:15 PM'
  }
];

export function OpenHouseDetailModal({ open, onOpenChange, onEdit, onCancelled, authToken, openHouse, propertyAddress, currentAgentName }: OpenHouseDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [_visitorNote, _setVisitorNote] = useState('');
  const [_selectedVisitor, _setSelectedVisitor] = useState<string | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

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
                  {mockVisitors.filter(v => v.preRegistered).length}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Pre-Registered
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-orange-600">
                  {mockVisitors.filter(v => v.addedToLeads).length}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center justify-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Added to Leads
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
              {isCompleted && (
                <>
                  <Tabs.Trigger
                    value="visitors"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    Visitors
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                      {mockVisitors.length}
                    </span>
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="feedback"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    Feedback
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                      {mockFeedback.length}
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

              {/* Visitors Tab */}
              <Tabs.Content value="visitors" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Visitor Sign-In List</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {mockVisitors.length} total visitors • {mockVisitors.filter(v => v.interestLevel === 'high').length} high interest
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export List
                    </button>
                    <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add Visitor
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {mockVisitors.map((visitor) => (
                    <div key={visitor.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-medium">
                              {visitor.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {visitor.name}
                                {visitor.preRegistered && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    Pre-registered
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">Checked in at {visitor.checkInTime}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              {visitor.email}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {visitor.phone}
                            </div>
                          </div>
                          {visitor.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                              <div className="font-medium text-gray-900 mb-1">Notes:</div>
                              {visitor.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getInterestLevelColor(visitor.interestLevel)}`}>
                            {visitor.interestLevel.charAt(0).toUpperCase() + visitor.interestLevel.slice(1)} Interest
                          </span>
                          {visitor.addedToLeads && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              In Leads
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2">
                          <Mail className="w-4 h-4" />
                          Send Email
                        </button>
                        <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2">
                          <Phone className="w-4 h-4" />
                          Call
                        </button>
                        {!visitor.addedToLeads && (
                          <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add to Leads
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs.Content>

              {/* Feedback Tab */}
              <Tabs.Content value="feedback" className="space-y-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">Visitor Feedback</h3>
                  <p className="text-sm text-gray-600">
                    {mockFeedback.length} responses • Average rating: 4.7/5
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-2xl font-semibold text-green-700">4.7</div>
                    <div className="text-xs text-gray-600 mt-1">Average Rating</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <ThumbsUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-blue-700">87%</div>
                    <div className="text-xs text-gray-600 mt-1">Positive Feedback</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-semibold text-purple-700">{mockFeedback.length}</div>
                    <div className="text-xs text-gray-600 mt-1">Total Comments</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {mockFeedback.map((feedback) => (
                    <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium mb-1">{feedback.visitorName}</div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-4 h-4 ${star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{feedback.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700">{feedback.comment}</p>
                    </div>
                  ))}
                </div>
              </Tabs.Content>

              {/* Activity Log Tab */}
              <Tabs.Content value="activity" className="space-y-3">
                <h3 className="font-semibold text-lg mb-4">Event Timeline</h3>
                
                <div className="space-y-3">
                  {[
                    { time: '3:45 PM', action: 'Open house ended', icon: CheckCircle2, color: 'text-green-600' },
                    { time: '3:20 PM', action: 'Lisa Thompson checked in (Walk-in)', icon: UserPlus, color: 'text-blue-600' },
                    { time: '3:00 PM', action: 'David Park checked in (Pre-registered)', icon: UserPlus, color: 'text-blue-600' },
                    { time: '2:45 PM', action: 'Jennifer Williams checked in (Walk-in)', icon: UserPlus, color: 'text-blue-600' },
                    { time: '2:30 PM', action: 'Michael Chen checked in (Pre-registered)', icon: UserPlus, color: 'text-blue-600' },
                    { time: '2:15 PM', action: 'Sarah Martinez checked in (Pre-registered)', icon: UserPlus, color: 'text-blue-600' },
                    { time: '2:00 PM', action: 'Open house started', icon: CheckCircle2, color: 'text-green-600' },
                    { time: '1:30 PM', action: 'Marketing materials set up', icon: ClipboardList, color: 'text-purple-600' },
                    { time: '10:00 AM', action: 'Signage installed', icon: MapPin, color: 'text-orange-600' }
                  ].map((event, index) => (
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