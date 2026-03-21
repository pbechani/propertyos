// @ts-nocheck
"use client"
import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Home, 
  Calendar, 
  FileText, 
  Settings, 
  Sparkles,
  MapPin,
  Clock,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { agentApi, propertiesApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

interface FormData {
  // Step 1: Property selection
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;

  // Step 2: Open House Details
  date: string;
  startTime: string;
  endTime: string;
  expectedAttendees: string;

  // Step 3: Marketing
  description: string;
  
  // Step 4: Settings (kept for future use)
  sendReminders: boolean;
  allowWalkIns: boolean;
  requireRegistration: boolean;
  publishOnline: boolean;
  sendFollowUps: boolean;
}

const steps = [
  { id: 1, name: 'Property', icon: Home },
  { id: 2, name: 'Schedule', icon: Calendar },
  { id: 3, name: 'Description', icon: FileText },
  { id: 4, name: 'Settings', icon: Settings },
];

export function CreateOpenHouseWizard({ onClose, onSuccess }: { onClose: () => void; onSuccess?: (id: string) => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    propertyId: '',
    propertyTitle: '',
    propertyAddress: '',
    date: '',
    startTime: '',
    endTime: '',
    expectedAttendees: '',
    description: '',
    sendReminders: true,
    allowWalkIns: true,
    requireRegistration: false,
    publishOnline: true,
    sendFollowUps: true,
  });
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingListings(true);
    propertiesApi.getMyListings(token)
      .then((res) => setListings(res?.data ?? []))
      .catch(() => setListings([]))
      .finally(() => setLoadingListings(false));
  }, []);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const token = getAccessToken();
    if (!token || !formData.propertyId) return;

    const scheduledAt = `${formData.date}T${formData.startTime}:00`;
    const endAt = `${formData.date}T${formData.endTime}:00`;
    const maxAttendees = formData.expectedAttendees ? parseInt(formData.expectedAttendees, 10) : undefined;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const record = await agentApi.createOpenHouse(token, formData.propertyId, {
        scheduledAt,
        endAt,
        maxAttendees,
        description: formData.description || undefined,
      });
      if (onSuccess) onSuccess(record.id);
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to create open house. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Create Open House</h2>
              <p className="text-sm text-slate-600 mt-1">Step {currentStep} of {steps.length}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-slate-900 text-white' : isCurrent ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>{step.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {submitError && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{submitError}</span>
            </div>
          )}
          {currentStep === 1 && (
            <PropertyPickerStep
              listings={listings}
              loading={loadingListings}
              selectedId={formData.propertyId}
              onSelect={(id, title, address) => {
                updateFormData('propertyId', id);
                updateFormData('propertyTitle', title);
                updateFormData('propertyAddress', address);
              }}
            />
          )}
          {currentStep === 2 && <ScheduleStep formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && <DescriptionStep formData={formData} updateFormData={updateFormData} />}
          {currentStep === 4 && <SettingsStep formData={formData} updateFormData={updateFormData} />}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${currentStep === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            {currentStep === steps.length ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.propertyId || !formData.date || !formData.startTime || !formData.endTime}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {submitting ? 'Creating...' : 'Create Open House'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !formData.propertyId}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyPickerStep({ listings, loading, selectedId, onSelect }: {
  listings: any[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string, title: string, address: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select a Property</h3>
        <div className="text-center py-12 text-slate-400">Loading your listings...</div>
      </div>
    );
  }
  if (!listings.length) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select a Property</h3>
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No listings found</p>
          <p className="text-sm text-slate-500 mt-1">Create a property listing first before scheduling an open house.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Select a Property</h3>
        <p className="text-sm text-slate-600">Choose the property you want to host an open house for.</p>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {listings.map((listing) => {
          const address = [
            listing.location?.address_line1,
            listing.location?.city,
            listing.location?.region,
          ].filter(Boolean).join(', ') || listing.title;
          const isSelected = selectedId === listing.id;
          return (
            <button
              key={listing.id}
              onClick={() => onSelect(listing.id, listing.title, address)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{listing.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{address}</span>
                  </div>
                  {(listing.bedrooms || listing.bathrooms) && (
                    <p className="text-xs text-slate-400 mt-1">
                      {listing.bedrooms ? `${listing.bedrooms} bed` : ''}
                      {listing.bedrooms && listing.bathrooms ? ' · ' : ''}
                      {listing.bathrooms ? `${listing.bathrooms} bath` : ''}
                    </p>
                  )}
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-slate-900 flex-shrink-0 mt-0.5" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Schedule Open House</h3>
        <p className="text-sm text-slate-600">Set the date and time for your open house event.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => updateFormData('date', e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => updateFormData('startTime', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => updateFormData('endTime', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Expected Attendees</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={formData.expectedAttendees}
              onChange={(e) => updateFormData('expectedAttendees', e.target.value)}
              placeholder="10"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">Helps manage capacity and prepare materials.</p>
        </div>
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 mb-3">Popular Time Slots</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Saturday 2–4 PM', start: '14:00', end: '16:00' },
              { label: 'Sunday 1–3 PM', start: '13:00', end: '15:00' },
              { label: 'Saturday 10–12 PM', start: '10:00', end: '12:00' },
              { label: 'Sunday 3–5 PM', start: '15:00', end: '17:00' },
            ].map((slot) => (
              <button
                key={slot.label}
                onClick={() => { updateFormData('startTime', slot.start); updateFormData('endTime', slot.end); }}
                className="px-4 py-2.5 border border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DescriptionStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Description</h3>
        <p className="text-sm text-slate-600">Add a description to help attendees know what to expect.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Open House Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe the property and what attendees can expect at the open house..."
          rows={8}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
}

function SettingsStep({ formData, updateFormData }: any) {
  const toggles = [
    { key: 'sendReminders', label: 'Send Reminders', description: 'Automatically send reminders to registered attendees' },
    { key: 'allowWalkIns', label: 'Allow Walk-ins', description: 'Allow visitors to register on the day via tablet sign-in' },
    { key: 'requireRegistration', label: 'Require Registration', description: 'Require pre-registration before attending' },
    { key: 'publishOnline', label: 'Publish Online', description: 'List this open house on the public portal' },
    { key: 'sendFollowUps', label: 'Send Follow-ups', description: 'Send automated follow-up emails after the event' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Event Settings</h3>
        <p className="text-sm text-slate-600">Configure how your open house will be managed.</p>
      </div>
      <div className="space-y-4">
        {toggles.map(({ key, label, description }) => (
          <div key={key} className="flex items-start justify-between p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex-1 mr-4">
              <p className="font-medium text-slate-900">{label}</p>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
            <button
              onClick={() => updateFormData(key as keyof FormData, !formData[key])}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${formData[key] ? 'bg-slate-900' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FormData {
  // Step 1: Property Details
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  
  // Step 2: Open House Details
  date: string;
  startTime: string;
  endTime: string;
  expectedAttendees: string;
  
  // Step 3: Marketing
  title: string;
  description: string;
  highlights: string;
  photos: string[];
  
  // Step 4: Settings
  sendReminders: boolean;
  allowWalkIns: boolean;
  requireRegistration: boolean;
  publishOnline: boolean;
  sendFollowUps: boolean;
}

const steps = [
  { id: 1, name: 'Property Details', icon: Home },
  { id: 2, name: 'Schedule', icon: Calendar },
  { id: 3, name: 'Marketing', icon: FileText },
  { id: 4, name: 'Settings', icon: Settings },
];

export function CreateOpenHouseWizard({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'Single Family',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    date: '',
    startTime: '',
    endTime: '',
    expectedAttendees: '',
    title: '',
    description: '',
    highlights: '',
    photos: [],
    sendReminders: true,
    allowWalkIns: true,
    requireRegistration: false,
    publishOnline: true,
    sendFollowUps: true,
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAIGenerate = async (field: 'title' | 'description' | 'highlights') => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const generated = {
      title: `Stunning ${formData.propertyType} in ${formData.city || 'Prime Location'}`,
      description: `Welcome to this beautiful ${formData.bedrooms || '3'} bedroom, ${formData.bathrooms || '2'} bathroom ${formData.propertyType.toLowerCase()} located in the heart of ${formData.city || 'the city'}. This ${formData.sqft || '2,000'} sq ft home features modern finishes, an open floor plan, and abundant natural light. Perfect for families seeking comfort and style in a desirable neighborhood. Don't miss this opportunity to see this exceptional property.`,
      highlights: `• Spacious ${formData.bedrooms || '3'} bedrooms with ample closet space\n• Modern kitchen with stainless steel appliances\n• Updated bathrooms with designer fixtures\n• Large backyard perfect for entertaining\n• Close to schools, parks, and shopping\n• Newly renovated with premium finishes`
    };
    
    updateFormData(field, generated[field]);
    setIsGenerating(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    // Handle form submission
    onClose();
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Create Open House</h2>
              <p className="text-sm text-slate-600 mt-1">Step {currentStep} of {steps.length}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-slate-900 text-white'
                          : isCurrent
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {currentStep === 1 && (
            <PropertyDetailsStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 2 && (
            <ScheduleStep formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 3 && (
            <MarketingStep
              formData={formData}
              updateFormData={updateFormData}
              onAIGenerate={handleAIGenerate}
              isGenerating={isGenerating}
            />
          )}
          {currentStep === 4 && (
            <SettingsStep formData={formData} updateFormData={updateFormData} />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentStep === 1
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Save Draft
            </button>
            {currentStep === steps.length ? (
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Create Open House
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyDetailsStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Information</h3>
        
        <div className="space-y-4">
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Street Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="123 Main Street"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* City, State, Zip */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="San Francisco"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateFormData('state', e.target.value)}
                placeholder="CA"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Zip Code</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => updateFormData('zipCode', e.target.value)}
                placeholder="94102"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Property Type and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => updateFormData('propertyType', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option>Single Family</option>
                <option>Condo</option>
                <option>Townhouse</option>
                <option>Multi-Family</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  placeholder="1,250,000"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bedrooms, Bathrooms, Sqft */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bedrooms</label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => updateFormData('bedrooms', e.target.value)}
                placeholder="3"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Bathrooms</label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => updateFormData('bathrooms', e.target.value)}
                placeholder="2"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Square Feet</label>
              <input
                type="text"
                value={formData.sqft}
                onChange={(e) => updateFormData('sqft', e.target.value)}
                placeholder="2,000"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Schedule Open House</h3>
        
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData('date', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateFormData('startTime', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateFormData('endTime', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Expected Attendees */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Expected Attendees
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={formData.expectedAttendees}
                onChange={(e) => updateFormData('expectedAttendees', e.target.value)}
                placeholder="10"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">
              This helps us prepare materials and manage capacity
            </p>
          </div>

          {/* Quick Schedule Suggestions */}
          <div className="pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Popular Time Slots
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Saturday 2-4 PM', start: '14:00', end: '16:00' },
                { label: 'Sunday 1-3 PM', start: '13:00', end: '15:00' },
                { label: 'Saturday 10-12 PM', start: '10:00', end: '12:00' },
                { label: 'Sunday 3-5 PM', start: '15:00', end: '17:00' },
              ].map((slot) => (
                <button
                  key={slot.label}
                  onClick={() => {
                    updateFormData('startTime', slot.start);
                    updateFormData('endTime', slot.end);
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketingStep({ formData, updateFormData, onAIGenerate, isGenerating }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Marketing Materials</h3>
        
        <div className="space-y-4">
          {/* Title with AI Generate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Listing Title
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Beautiful 3BR Home in Prime Location"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
              <button
                onClick={() => onAIGenerate('title')}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
          </div>

          {/* Description with AI Generate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Property Description
            </label>
            <div className="space-y-2">
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe the property features, location, and unique selling points..."
                rows={5}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
              />
              <button
                onClick={() => onAIGenerate('description')}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'Generating Description...' : 'Generate with AI'}
              </button>
            </div>
          </div>

          {/* Key Highlights with AI Generate */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Key Highlights
            </label>
            <div className="space-y-2">
              <textarea
                value={formData.highlights}
                onChange={(e) => updateFormData('highlights', e.target.value)}
                placeholder="• Feature 1&#10;• Feature 2&#10;• Feature 3"
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none font-mono text-sm"
              />
              <button
                onClick={() => onAIGenerate('highlights')}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 border-2 border-purple-200 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Generate Highlights'}
              </button>
            </div>
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Property Photos
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-slate-300 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 mb-1">
                <span className="font-medium text-slate-900">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">PNG, JPG up to 10MB each</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsStep({ formData, updateFormData }: any) {
  const toggles = [
    {
      id: 'sendReminders',
      icon: Bell,
      label: 'Send Reminders',
      description: 'Automatically send reminders to registered attendees',
      value: formData.sendReminders,
    },
    {
      id: 'allowWalkIns',
      icon: Users,
      label: 'Allow Walk-ins',
      description: 'Accept visitors without prior registration',
      value: formData.allowWalkIns,
    },
    {
      id: 'requireRegistration',
      icon: FileText,
      label: 'Require Registration',
      description: 'Visitors must register before attending',
      value: formData.requireRegistration,
    },
    {
      id: 'publishOnline',
      icon: Eye,
      label: 'Publish Online',
      description: 'Make this open house visible on your website',
      value: formData.publishOnline,
    },
    {
      id: 'sendFollowUps',
      icon: Mail,
      label: 'Send Follow-ups',
      description: 'Automatically email attendees after the event',
      value: formData.sendFollowUps,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Open House Settings</h3>
        
        <div className="space-y-3">
          {toggles.map((toggle) => {
            const Icon = toggle.icon;
            return (
              <div
                key={toggle.id}
                className="flex items-start justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex gap-3 flex-1">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{toggle.label}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{toggle.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateFormData(toggle.id, !toggle.value)}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    toggle.value ? 'bg-slate-900' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      toggle.value ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Preview */}
      <div className="p-5 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-medium text-slate-900 mb-3">Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Property:</span>
            <span className="font-medium text-slate-900">
              {formData.address || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Date & Time:</span>
            <span className="font-medium text-slate-900">
              {formData.date && formData.startTime
                ? `${formData.date} at ${formData.startTime}`
                : 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Expected Attendees:</span>
            <span className="font-medium text-slate-900">
              {formData.expectedAttendees || 'Not specified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Online Visibility:</span>
            <span className="font-medium text-slate-900">
              {formData.publishOnline ? 'Published' : 'Private'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
