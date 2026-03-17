'use client';

import { useState, useEffect } from 'react';
import { agentApi, type OpenHouseRecord } from '@/lib/api-client';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import * as Checkbox from '@radix-ui/react-checkbox';
import {
  X,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Megaphone,
  UserPlus,
  FileText,
  Globe,
  Settings,
  Loader2
} from 'lucide-react';

const DEFAULT_CHECKLIST_ITEMS: { task: string; completed: boolean }[] = [
  { task: 'Print marketing materials', completed: true },
  { task: 'Install directional signage', completed: true },
  { task: 'Set up refreshments', completed: false },
  { task: 'Arrange photography', completed: false },
  { task: 'Prepare sign-in sheets', completed: true },
];

interface ScheduleOpenHouseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyAddress?: string;
  currentAgentName?: string;
  propertyId: string;
  authToken: string;
  onSuccess?: (openHouse: OpenHouseRecord) => void;
  /** When provided, the modal operates in edit/reschedule mode */
  openHouseId?: string;
  /** Full open house record — pre-populates all form fields when editing */
  openHouseRecord?: OpenHouseRecord;
}

export function ScheduleOpenHouseModal({ open, onOpenChange, propertyAddress, currentAgentName, propertyId, authToken, onSuccess, openHouseId, openHouseRecord }: ScheduleOpenHouseModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Details
    eventType: 'public',
    date: '',
    startTime: '',
    endTime: '',
    
    // Staff & Hosting
    hostAgent: 'you',
    additionalAgents: [] as string[],
    
    // Registration & Access
    requireRegistration: true,
    allowWalkIns: true,
    maxAttendees: '',
    
    // Marketing
    publishToMLS: true,
    publishToWebsite: true,
    publishToSocialMedia: true,
    sendEmailBlast: false,
    createFacebookEvent: false,
    
    // Materials & Preparation
    checklistItems: DEFAULT_CHECKLIST_ITEMS as { task: string; completed: boolean }[],
    
    // Additional Info
    specialInstructions: '',
    parkingInstructions: '',
    internalNotes: ''
  });

  const [agentInput, setAgentInput] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Pre-fill all fields from record when editing; reset to defaults when opening fresh
  useEffect(() => {
    if (!open) return;
    if (openHouseRecord) {
      const start = new Date(openHouseRecord.scheduled_at);
      const end = new Date(openHouseRecord.end_at);
      const pad = (n: number) => String(n).padStart(2, '0');
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');

      const marketing = openHouseRecord.marketing_options ?? [];
      const findMarketing = (channel: string, fallback: boolean) =>
        marketing.find((item) => item.channel === channel)?.enabled ?? fallback;

      const descParts = (openHouseRecord.description ?? '').split(' | ');

      setFormData((prev) => ({
        ...prev,
        date: `${year}-${month}-${day}`,
        startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
        maxAttendees: openHouseRecord.max_attendees ? String(openHouseRecord.max_attendees) : '',
        publishToMLS: findMarketing('MLS', true),
        publishToWebsite: findMarketing('Website', true),
        publishToSocialMedia: findMarketing('Social Media', true),
        sendEmailBlast: findMarketing('Email Blast', false),
        createFacebookEvent: findMarketing('Facebook Event', false),
        checklistItems: openHouseRecord.preparation_checklist?.length
          ? openHouseRecord.preparation_checklist
          : DEFAULT_CHECKLIST_ITEMS,
        specialInstructions: descParts[0] ?? '',
        parkingInstructions: descParts[1] ?? '',
      }));
    } else {
      setStep(1);
      setSubmitError('');
      setFormData({
        eventType: 'public',
        date: '',
        startTime: '',
        endTime: '',
        hostAgent: 'you',
        additionalAgents: [],
        requireRegistration: true,
        allowWalkIns: true,
        maxAttendees: '',
        publishToMLS: true,
        publishToWebsite: true,
        publishToSocialMedia: true,
        sendEmailBlast: false,
        createFacebookEvent: false,
        checklistItems: DEFAULT_CHECKLIST_ITEMS,
        specialInstructions: '',
        parkingInstructions: '',
        internalNotes: ''
      });
    }
  }, [open, openHouseRecord]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAgent = () => {
    if (agentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalAgents: [...prev.additionalAgents, agentInput.trim()]
      }));
      setAgentInput('');
    }
  };

  const handleRemoveAgent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalAgents: prev.additionalAgents.filter((_, i) => i !== index)
    }));
  };

  const handleToggleChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const handleAddChecklistItem = () => {
    if (checklistInput.trim()) {
      setFormData(prev => ({
        ...prev,
        checklistItems: [...prev.checklistItems, { task: checklistInput.trim(), completed: false }],
      }));
      setChecklistInput('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetForm = () => {
    setStep(1);
    setSubmitError('');
    setChecklistInput('');
    setFormData({
      eventType: 'public',
      date: '',
      startTime: '',
      endTime: '',
      hostAgent: 'you',
      additionalAgents: [],
      requireRegistration: true,
      allowWalkIns: true,
      maxAttendees: '',
      publishToMLS: true,
      publishToWebsite: true,
      publishToSocialMedia: true,
      sendEmailBlast: false,
      createFacebookEvent: false,
      checklistItems: DEFAULT_CHECKLIST_ITEMS,
      specialInstructions: '',
      parkingInstructions: '',
      internalNotes: ''
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.startTime}`).toISOString();
      const endAt = new Date(`${formData.date}T${formData.endTime}`).toISOString();
      const description = [formData.specialInstructions, formData.parkingInstructions]
        .filter(Boolean)
        .join(' | ') || undefined;
      const preparationChecklist = formData.checklistItems;
      const marketingOptions = [
        { channel: 'MLS', enabled: formData.publishToMLS },
        { channel: 'Website', enabled: formData.publishToWebsite },
        { channel: 'Social Media', enabled: formData.publishToSocialMedia },
        { channel: 'Email Blast', enabled: formData.sendEmailBlast },
        { channel: 'Facebook Event', enabled: formData.createFacebookEvent },
      ];
      const result = openHouseId
        ? await agentApi.rescheduleOpenHouse(authToken, openHouseId, { scheduledAt, endAt })
        : await agentApi.createOpenHouse(authToken, propertyId, {
            scheduledAt,
            endAt,
            maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees, 10) : undefined,
            description,
            preparationChecklist,
            marketingOptions,
          });
      onSuccess?.(result);
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to schedule open house. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.date && formData.startTime && formData.endTime;
  const isStep2Valid = formData.hostAgent;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-xl font-semibold">{openHouseId ? 'Edit Open House' : 'Schedule Open House'}</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                {propertyAddress ?? 'Property address unavailable'}
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
                Date & Time
              </span>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                Staff & Access
              </span>
              <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                Marketing
              </span>
              <span className={`text-sm font-medium ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                Preparation
              </span>
            </div>
            <div className="flex gap-2">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            {/* Step 1: Date & Time */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleInputChange('eventType', 'public')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.eventType === 'public'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${formData.eventType === 'public' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className={`text-sm font-medium ${formData.eventType === 'public' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Public Open House
                      </div>
                    </button>
                    <button
                      onClick={() => handleInputChange('eventType', 'broker')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.eventType === 'broker'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <UserPlus className={`w-6 h-6 mx-auto mb-2 ${formData.eventType === 'broker' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className={`text-sm font-medium ${formData.eventType === 'broker' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Broker Preview
                      </div>
                    </button>
                    <button
                      onClick={() => handleInputChange('eventType', 'private')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        formData.eventType === 'private'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Settings className={`w-6 h-6 mx-auto mb-2 ${formData.eventType === 'private' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className={`text-sm font-medium ${formData.eventType === 'private' ? 'text-blue-600' : 'text-gray-700'}`}>
                        Private Event
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {formData.date && formData.startTime && formData.endTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-blue-900 mb-1">Open House Scheduled</div>
                      <div className="text-blue-700">
                        {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        <br />
                        {formData.startTime} - {formData.endTime}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Staff & Access */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host Agent
                  </label>
                  <select
                    value={formData.hostAgent}
                    onChange={(e) => handleInputChange('hostAgent', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="you">You{currentAgentName ? ` (${currentAgentName})` : ''}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Staff
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={agentInput}
                      onChange={(e) => setAgentInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAgent();
                        }
                      }}
                      placeholder="Enter agent name..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddAgent}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  {formData.additionalAgents.length > 0 && (
                    <div className="space-y-2">
                      {formData.additionalAgents.map((agent, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{agent}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveAgent(index)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Attendance Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Require Registration</div>
                        <div className="text-xs text-gray-500 mt-1">Visitors must sign in before entering</div>
                      </div>
                      <Switch.Root
                        checked={formData.requireRegistration}
                        onCheckedChange={(checked) => handleInputChange('requireRegistration', checked)}
                        className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors"
                      >
                        <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                      </Switch.Root>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Allow Walk-Ins</div>
                        <div className="text-xs text-gray-500 mt-1">Accept visitors without pre-registration</div>
                      </div>
                      <Switch.Root
                        checked={formData.allowWalkIns}
                        onCheckedChange={(checked) => handleInputChange('allowWalkIns', checked)}
                        className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors"
                      >
                        <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                      </Switch.Root>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Attendees (Optional)
                      </label>
                      <input
                        type="number"
                        value={formData.maxAttendees}
                        onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                        placeholder="Leave blank for unlimited"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Marketing */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Online Listings
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox.Root
                        checked={formData.publishToMLS}
                        onCheckedChange={(checked) => handleInputChange('publishToMLS', checked as boolean)}
                        className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      >
                        <Checkbox.Indicator>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Publish to MLS</div>
                        <div className="text-xs text-gray-500">Share with all MLS subscribers</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox.Root
                        checked={formData.publishToWebsite}
                        onCheckedChange={(checked) => handleInputChange('publishToWebsite', checked as boolean)}
                        className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      >
                        <Checkbox.Indicator>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Publish to Your Website</div>
                        <div className="text-xs text-gray-500">Display on your agency website</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox.Root
                        checked={formData.publishToSocialMedia}
                        onCheckedChange={(checked) => handleInputChange('publishToSocialMedia', checked as boolean)}
                        className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      >
                        <Checkbox.Indicator>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Share on Social Media</div>
                        <div className="text-xs text-gray-500">Post to Facebook, Instagram, LinkedIn</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-purple-600" />
                    Active Promotion
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox.Root
                        checked={formData.sendEmailBlast}
                        onCheckedChange={(checked) => handleInputChange('sendEmailBlast', checked as boolean)}
                        className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      >
                        <Checkbox.Indicator>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Send Email Blast</div>
                        <div className="text-xs text-gray-500">Notify your contact list (2,847 contacts)</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox.Root
                        checked={formData.createFacebookEvent}
                        onCheckedChange={(checked) => handleInputChange('createFacebookEvent', checked as boolean)}
                        className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      >
                        <Checkbox.Indicator>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Create Facebook Event</div>
                        <div className="text-xs text-gray-500">Allow people to RSVP via Facebook</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-900">
                    <div className="font-medium mb-1">Marketing Tip</div>
                    <div className="text-amber-800">
                      Posting 7-10 days in advance typically generates the best attendance. Consider scheduling promotional posts for maximum reach.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Preparation */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    Materials & Setup
                  </h3>
                  <div className="space-y-3">
                    {formData.checklistItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox.Root
                          checked={item.completed}
                          onCheckedChange={() => handleToggleChecklistItem(index)}
                          className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shrink-0"
                        >
                          <Checkbox.Indicator>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <span className="flex-1 text-sm font-medium">{item.task}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(index)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors shrink-0"
                          aria-label={`Remove ${item.task}`}
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input
                      type="text"
                      value={checklistInput}
                      onChange={(e) => setChecklistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); }
                      }}
                      placeholder="Add a custom task..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    Visitor Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parking Instructions
                      </label>
                      <textarea
                        value={formData.parkingInstructions}
                        onChange={(e) => handleInputChange('parkingInstructions', e.target.value)}
                        rows={2}
                        placeholder="e.g., Street parking available on Westwood Blvd. Driveway available for 2 vehicles."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions for Visitors
                      </label>
                      <textarea
                        value={formData.specialInstructions}
                        onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                        rows={2}
                        placeholder="e.g., Please remove shoes when entering. Ring doorbell upon arrival."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Internal Notes (Not Visible to Public)
                      </label>
                      <textarea
                        value={formData.internalNotes}
                        onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                        rows={3}
                        placeholder="Add any internal notes or reminders for your team..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {submitError && (
              <p className="text-sm text-red-600 mb-3 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </p>
            )}
            <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            
            <div className="flex gap-3">
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {isSubmitting ? (openHouseId ? 'Saving…' : 'Scheduling…') : (openHouseId ? 'Save Changes' : 'Schedule Open House')}
                </button>
              )}
            </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
