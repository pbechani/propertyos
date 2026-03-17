'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X, Calendar, Clock, Phone, Mail, MapPin, Home, Video, Users,
  MessageSquare, Check, XCircle, Edit2, Send, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Viewing {
  id: string;
  date: string;
  time: string;
  client: string;
  phone: string;
  email: string;
  status: 'confirmed' | 'pending' | 'completed' | 'declined';
  agent: string;
  viewingType?: 'in-person' | 'virtual' | 'open-house';
  duration?: string;
  numberOfAttendees?: string;
  specialRequests?: string;
  submittedDate?: string;
}

interface ViewingDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewing: Viewing | null;
  onConfirm?: (viewing: Viewing) => void;
  onDecline?: (viewing: Viewing, reason: string) => void;
  onReschedule?: (viewing: Viewing) => void;
}

export function ViewingDetailModal({ 
  open, 
  onOpenChange, 
  viewing,
  onConfirm,
  onDecline,
  onReschedule 
}: ViewingDetailModalProps) {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false);
  const [showDeclineSuccess, setShowDeclineSuccess] = useState(false);

  if (!viewing) return null;

  const handleConfirm = () => {
    onConfirm?.(viewing);
    setShowConfirmSuccess(true);
    setTimeout(() => {
      setShowConfirmSuccess(false);
      onOpenChange(false);
    }, 2000);
  };

  const handleDeclineSubmit = () => {
    const reason = selectedDeclineReason === 'other' ? declineReason : selectedDeclineReason;
    onDecline?.(viewing, reason);
    setShowDeclineSuccess(true);
    setTimeout(() => {
      setShowDeclineSuccess(false);
      setShowDeclineForm(false);
      setDeclineReason('');
      setSelectedDeclineReason('');
      onOpenChange(false);
    }, 2000);
  };

  const handleReschedule = () => {
    onReschedule?.(viewing);
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      declined: 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getViewingTypeIcon = (type?: string) => {
    switch (type) {
      case 'in-person':
        return <Home className="w-5 h-5" />;
      case 'virtual':
        return <Video className="w-5 h-5" />;
      case 'open-house':
        return <Users className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  const declineReasons = [
    'Property already sold',
    'Client did not respond to confirmation',
    'Schedule conflict',
    'Property temporarily unavailable',
    'Client requested cancellation',
    'other'
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-50">
          
          {/* Success Messages */}
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
              <Dialog.Title className="text-xl font-semibold">Viewing Request Details</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                Review and manage this viewing request
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(viewing.status)}`}>
                {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
              </span>
              <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Viewing Information */}
              <div className="space-y-6">
                {/* Property Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Property</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900">2847 Westwood Boulevard</div>
                    <div className="text-sm text-gray-600">Los Angeles, CA 90064</div>
                    <div className="text-sm text-gray-600">$825,000 • 4 bed • 3 bath • 2,450 sq ft</div>
                  </div>
                </div>

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
                          {new Date(viewing.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Time & Duration</div>
                        <div className="font-medium">{viewing.time}</div>
                        {viewing.duration && (
                          <div className="text-sm text-gray-500">{viewing.duration} minutes</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getViewingTypeIcon(viewing.viewingType)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Viewing Type</div>
                        <div className="font-medium capitalize">
                          {viewing.viewingType?.replace('-', ' ') || 'In-Person'}
                        </div>
                      </div>
                    </div>

                    {viewing.numberOfAttendees && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Expected Attendees</div>
                          <div className="font-medium">
                            {viewing.numberOfAttendees} {parseInt(viewing.numberOfAttendees) === 1 ? 'person' : 'people'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Timeline */}
                {viewing.submittedDate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-800">
                      <strong>Requested:</strong> {new Date(viewing.submittedDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Client Information */}
              <div className="space-y-6">
                {/* Client Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Client Information</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold">
                          {viewing.client.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{viewing.client}</div>
                        <div className="text-sm text-gray-500">Potential Buyer</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <a 
                        href={`mailto:${viewing.email}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <Mail className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="text-sm text-gray-900 group-hover:text-blue-600">{viewing.email}</div>
                        </div>
                      </a>

                      <a 
                        href={`tel:${viewing.phone}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                      >
                        <Phone className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Phone</div>
                          <div className="text-sm text-gray-900 group-hover:text-blue-600">{viewing.phone}</div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {viewing.specialRequests && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">Special Requests</h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-900">{viewing.specialRequests}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Agent */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Assigned Agent</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                        {viewing.agent === 'You' ? 'JD' : viewing.agent.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{viewing.agent === 'You' ? 'John Doe (You)' : viewing.agent}</div>
                        <div className="text-sm text-gray-500">Premium Realty Group</div>
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
                      {declineReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason === 'other' ? 'Other (specify below)' : reason}
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
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Please provide details..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleDeclineSubmit}
                      disabled={!selectedDeclineReason || (selectedDeclineReason === 'other' && !declineReason)}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Decline
                    </button>
                    <button
                      onClick={() => {
                        setShowDeclineForm(false);
                        setSelectedDeclineReason('');
                        setDeclineReason('');
                      }}
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
          {!showDeclineForm && viewing.status === 'pending' && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Awaiting confirmation
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeclineForm(true)}
                  className="px-6 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Decline
                </button>
                <button
                  onClick={handleReschedule}
                  className="px-6 py-2.5 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  Reschedule
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Confirm Viewing
                </button>
              </div>
            </div>
          )}

          {viewing.status === 'confirmed' && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-green-50">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">This viewing has been confirmed</span>
              </div>
              <button
                onClick={handleReschedule}
                className="px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Reschedule
              </button>
            </div>
          )}

          {viewing.status === 'declined' && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">This viewing has been declined</span>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
