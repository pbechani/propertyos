'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Clock, Users, MessageSquare, Video, Home, Loader2 } from 'lucide-react';
import { viewingsApi, companiesApi, type CompanyMember } from '@/lib/api-client';
import { getStoredUser, getActiveCompanyContext } from '@/lib/auth-session';
import { ContactPersonSelector } from '@/components/shared/ContactPersonSelector';
import type { ContactPerson } from '@/components/shared/ContactPersonSelector';

interface ScheduleViewingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  authToken: string;
  onSuccess?: () => void;
}

const VIEWING_TYPE_MAP: Record<string, 'physical' | 'virtual'> = {
  'in-person': 'physical',
  'virtual': 'virtual',
  'open-house': 'physical',
};

export function ScheduleViewingModal({ open, onOpenChange, propertyId, authToken, onSuccess }: ScheduleViewingModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contactPerson, setContactPerson] = useState<ContactPerson | undefined>();
  const [teamMembers, setTeamMembers] = useState<CompanyMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    numberOfAttendees: '1',
    viewingType: 'in-person',
    date: '',
    time: '',
    duration: '30',
    agent: '',
    specialRequests: '',
    sendReminder: true,
    sendConfirmation: true,
  });

  useEffect(() => {
    const user = getStoredUser();
    const company = getActiveCompanyContext();
    if (user) {
      setCurrentUserId(user.id);
      setFormData(prev => ({ ...prev, agent: user.id }));
    }
    if (company && authToken) {
      companiesApi.listMembers(authToken, company.id)
        .then(members => setTeamMembers(members.filter(m => m.status === 'active')))
        .catch(() => { /* silently fall back to empty list */ });
    }
  }, [authToken]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) { setStep(step - 1); setSubmitError(''); }
  };

  const resetForm = () => {
    setStep(1);
    setSubmitError('');
    setContactPerson(undefined);
    setFormData({
      numberOfAttendees: '1',
      viewingType: 'in-person',
      date: '',
      time: '',
      duration: '30',
      agent: currentUserId ?? '',
      specialRequests: '',
      sendReminder: true,
      sendConfirmation: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.time) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString();
      await viewingsApi.bookForBuyer(authToken, propertyId, {
        viewingType: VIEWING_TYPE_MAP[formData.viewingType] ?? 'physical',
        scheduledAt,
        durationMinutes: parseInt(formData.duration, 10),
        buyerContactName: contactPerson?.name ?? '',
        buyerContactEmail: contactPerson?.email || undefined,
        buyerContactPhone: contactPerson?.phone || undefined,
        notes: formData.specialRequests || undefined,
        sendConfirmation: formData.sendConfirmation,
        sendReminder: formData.sendReminder,
      });
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to schedule viewing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = !!(contactPerson?.name && contactPerson.name.trim().length > 0);
  const isStep2Valid = formData.date && formData.time;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1A3C28]/10">
            <div>
              <Dialog.Title className="text-xl font-semibold text-[#1A3C28]">Schedule Viewing</Dialog.Title>
              <Dialog.Description className="text-sm text-[#1A3C28]/55 mt-1">
                2847 Westwood Boulevard, Los Angeles
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-[#1A3C28]/[0.07] rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#1A3C28]/50" />
            </Dialog.Close>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${step >= 1 ? 'text-[#1A3C28]' : 'text-[#1A3C28]/35'}`}>
                Client Info
              </span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-[#1A3C28]' : 'text-[#1A3C28]/35'}`}>
                Date & Time
              </span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-[#1A3C28]' : 'text-[#1A3C28]/35'}`}>
                Preferences
              </span>
            </div>
            <div className="flex gap-2">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-[#1A3C28]' : 'bg-[#1A3C28]/15'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-[#1A3C28]' : 'bg-[#1A3C28]/15'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-[#1A3C28]' : 'bg-[#1A3C28]/15'}`} />
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
            {/* Step 1: Contact Person */}
            {step === 1 && (
              <div className="space-y-5">
                <ContactPersonSelector
                  value={contactPerson}
                  onChange={setContactPerson}
                  authToken={authToken}
                  label="Who is attending?"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-[#1A3C28]/65 mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Number of Attendees
                    </div>
                  </label>
                  <select
                    value={formData.numberOfAttendees}
                    onChange={(e) => handleInputChange('numberOfAttendees', e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#1A3C28]/20 rounded-lg focus:ring-2 focus:ring-[#1A3C28]/30 focus:border-[#1A3C28]/50 outline-none transition-colors"
                  >
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3">3 people</option>
                    <option value="4">4 people</option>
                    <option value="5">5+ people</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A3C28]/65 mb-3">
                    Viewing Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('viewingType', 'in-person')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.viewingType === 'in-person'
                          ? 'border-[#1A3C28] bg-[#1A3C28]/[0.05]'
                          : 'border-[#1A3C28]/15 hover:border-[#1A3C28]/30'
                      }`}
                    >
                      <Home className={`w-6 h-6 mx-auto mb-2 ${
                        formData.viewingType === 'in-person' ? 'text-[#1A3C28]' : 'text-[#1A3C28]/50'
                      }`} />
                      <div className={`text-sm font-medium ${
                        formData.viewingType === 'in-person' ? 'text-[#1A3C28]' : 'text-[#1A3C28]/65'
                      }`}>
                        In-Person
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('viewingType', 'virtual')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.viewingType === 'virtual'
                          ? 'border-[#1A3C28] bg-[#1A3C28]/[0.05]'
                          : 'border-[#1A3C28]/15 hover:border-[#1A3C28]/30'
                      }`}
                    >
                      <Video className={`w-6 h-6 mx-auto mb-2 ${
                        formData.viewingType === 'virtual' ? 'text-[#1A3C28]' : 'text-[#1A3C28]/50'
                      }`} />
                      <div className={`text-sm font-medium ${
                        formData.viewingType === 'virtual' ? 'text-[#1A3C28]' : 'text-[#1A3C28]/65'
                      }`}>
                        Virtual Tour
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('viewingType', 'open-house')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.viewingType === 'open-house'
                          ? 'border-[#1A3C28] bg-[#1A3C28]/[0.05]'
                          : 'border-[#1A3C28]/15 hover:border-[#1A3C28]/30'
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${
                        formData.viewingType === 'open-house' ? 'text-[#1A3C28]' : 'text-[#1A3C28]/50'
                      }`} />
                      <div className={`text-sm font-medium ${
                        formData.viewingType === 'open-house' ? 'text-[#1A3C28]' : 'text-[#1A3C28]/65'
                      }`}>
                        Open House
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A3C28]/65 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date *
                      </div>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-[#1A3C28]/20 rounded-lg focus:ring-2 focus:ring-[#1A3C28]/30 focus:border-[#1A3C28]/50 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A3C28]/65 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time *
                      </div>
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="w-full px-4 py-2.5 border border-[#1A3C28]/20 rounded-lg focus:ring-2 focus:ring-[#1A3C28]/30 focus:border-[#1A3C28]/50 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A3C28]/65 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['15', '30', '45', '60'].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => handleInputChange('duration', duration)}
                        className={`px-4 py-2.5 border-2 rounded-lg transition-all ${
                          formData.duration === duration
                            ? 'border-[#1A3C28] bg-[#1A3C28]/[0.05] text-[#1A3C28] font-medium'
                            : 'border-[#1A3C28]/15 hover:border-[#1A3C28]/30'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#1A3C28]/65 mb-2">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['9:00', '11:00', '14:00', '16:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleInputChange('time', time)}
                        className="px-4 py-2 border border-[#1A3C28]/20 rounded-lg hover:bg-[#1A3C28]/[0.04] transition-colors text-sm"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#B89040]/[0.06] border border-[#B89040]/25 rounded-lg p-4">
                  <p className="text-sm text-[#1A3C28]">
                    ⏰ Please ensure the selected time doesn&apos;t conflict with existing appointments. Check the calendar before confirming.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Preferences & Confirmation */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A3C28]/65 mb-2">
                    Assigned Agent
                  </label>
                  <select
                    value={formData.agent}
                    onChange={(e) => handleInputChange('agent', e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#1A3C28]/20 rounded-lg focus:ring-2 focus:ring-[#1A3C28]/30 focus:border-[#1A3C28]/50 outline-none transition-colors"
                  >
                    {teamMembers.length === 0 ? (
                      <option value={currentUserId ?? ''} disabled={!currentUserId}>
                        {currentUserId ? 'You' : 'Loading...'}
                      </option>
                    ) : (
                      teamMembers.map(member => {
                        const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;
                        const isCurrentUser = member.user_id === currentUserId;
                        return (
                          <option key={member.user_id} value={member.user_id}>
                            {isCurrentUser ? `You (${name})` : name}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A3C28]/65 mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Special Requests or Notes
                    </div>
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    placeholder="Any special requirements, accessibility needs, or additional information..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-[#1A3C28]/20 rounded-lg focus:ring-2 focus:ring-[#1A3C28]/30 focus:border-[#1A3C28]/50 outline-none transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-[#1A3C28]/65">
                    Notifications
                  </label>
                  
                  <label className="flex items-start gap-3 p-4 border border-[#1A3C28]/[0.12] rounded-lg hover:bg-[#1A3C28]/[0.04] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sendConfirmation}
                      onChange={(e) => handleInputChange('sendConfirmation', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Send Confirmation Email</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Client will receive an email confirmation with viewing details and location
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-[#1A3C28]/[0.12] rounded-lg hover:bg-[#1A3C28]/[0.04] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sendReminder}
                      onChange={(e) => handleInputChange('sendReminder', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Send Reminder (24 hours before)</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Automated reminder will be sent via email and SMS
                      </div>
                    </div>
                  </label>
                </div>

                {/* Summary */}
                <div className="bg-[#1A3C28]/[0.04] border border-[#1A3C28]/10 rounded-lg p-4">
                  <div className="font-medium text-sm mb-3">Viewing Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#1A3C28]/55">Client:</span>
                      <span className="font-medium">{contactPerson?.name || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1A3C28]/55">Type:</span>
                      <span className="font-medium capitalize">{formData.viewingType.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1A3C28]/55">Date & Time:</span>
                      <span className="font-medium">
                        {formData.date && formData.time 
                          ? `${new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${formData.time}`
                          : 'Not specified'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1A3C28]/55">Duration:</span>
                      <span className="font-medium">{formData.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#1A3C28]/55">Attendees:</span>
                      <span className="font-medium">{formData.numberOfAttendees} {parseInt(formData.numberOfAttendees) === 1 ? 'person' : 'people'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#1A3C28]/10 bg-[#1A3C28]/[0.03]">
            <div className="flex-1">
              {submitError ? (
                <p className="text-sm text-[#C4562A]">{submitError}</p>
              ) : (
                <span className="text-sm text-[#1A3C28]/50">Step {step} of 3</span>
              )}
            </div>
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border border-[#1A3C28]/20 rounded-lg hover:bg-white transition-colors font-medium disabled:opacity-50"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="px-6 py-2.5 bg-[#1A3C28] text-white rounded-lg hover:bg-[#2D5A40] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#1A3C28] text-[#00E87A] rounded-lg hover:bg-[#2D5A40] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Scheduling...' : 'Schedule Viewing'}
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
