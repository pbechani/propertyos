'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Clock, User, Phone, Mail, Users, MessageSquare, Video, Home } from 'lucide-react';

interface ScheduleViewingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleViewingModal({ open, onOpenChange }: ScheduleViewingModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Client Info
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    numberOfAttendees: '1',
    
    // Viewing Details
    viewingType: 'in-person',
    date: '',
    time: '',
    duration: '30',
    
    // Agent & Preferences
    agent: 'you',
    specialRequests: '',
    sendReminder: true,
    sendConfirmation: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Scheduling viewing:', formData);
    onOpenChange(false);
    // Reset form
    setStep(1);
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      numberOfAttendees: '1',
      viewingType: 'in-person',
      date: '',
      time: '',
      duration: '30',
      agent: 'you',
      specialRequests: '',
      sendReminder: true,
      sendConfirmation: true
    });
  };

  const isStep1Valid = formData.clientName && formData.clientEmail && formData.clientPhone;
  const isStep2Valid = formData.date && formData.time;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-xl font-semibold">Schedule Viewing</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                2847 Westwood Boulevard, Los Angeles
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                Client Info
              </span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                Date & Time
              </span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                Preferences
              </span>
            </div>
            <div className="flex gap-2">
              <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
            {/* Step 1: Client Information */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Client Name *
                    </div>
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </div>
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number *
                      </div>
                    </label>
                    <input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Number of Attendees
                    </div>
                  </label>
                  <select
                    value={formData.numberOfAttendees}
                    onChange={(e) => handleInputChange('numberOfAttendees', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3">3 people</option>
                    <option value="4">4 people</option>
                    <option value="5">5+ people</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Make sure to verify contact information. Automated reminders will be sent to this email and phone number.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Viewing Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('viewingType', 'in-person')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.viewingType === 'in-person'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Home className={`w-6 h-6 mx-auto mb-2 ${
                        formData.viewingType === 'in-person' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <div className={`text-sm font-medium ${
                        formData.viewingType === 'in-person' ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        In-Person
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('viewingType', 'virtual')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.viewingType === 'virtual'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Video className={`w-6 h-6 mx-auto mb-2 ${
                        formData.viewingType === 'virtual' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <div className={`text-sm font-medium ${
                        formData.viewingType === 'virtual' ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        Virtual Tour
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInputChange('viewingType', 'open-house')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.viewingType === 'open-house'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${
                        formData.viewingType === 'open-house' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      <div className={`text-sm font-medium ${
                        formData.viewingType === 'open-house' ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        Open House
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time *
                      </div>
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            ? 'border-blue-600 bg-blue-50 text-blue-600 font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Time Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['9:00', '11:00', '14:00', '16:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleInputChange('time', time)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⏰ Please ensure the selected time doesn't conflict with existing appointments. Check the calendar before confirming.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Preferences & Confirmation */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Agent
                  </label>
                  <select
                    value={formData.agent}
                    onChange={(e) => handleInputChange('agent', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="you">You (John Doe)</option>
                    <option value="sarah">Sarah Kim</option>
                    <option value="mike">Mike Davis</option>
                    <option value="jennifer">Jennifer Walsh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Notifications
                  </label>
                  
                  <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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

                  <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-sm mb-3">Viewing Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium">{formData.clientName || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{formData.viewingType.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date & Time:</span>
                      <span className="font-medium">
                        {formData.date && formData.time 
                          ? `${new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${formData.time}`
                          : 'Not specified'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{formData.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attendees:</span>
                      <span className="font-medium">{formData.numberOfAttendees} {parseInt(formData.numberOfAttendees) === 1 ? 'person' : 'people'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Step {step} of 3
            </div>
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Schedule Viewing
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
