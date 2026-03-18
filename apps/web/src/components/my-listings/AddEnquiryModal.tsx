'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  MessageSquare,
  Calendar,
  Tag,
  Mail,
  Phone,
  Globe,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
  Home,
  Send,
  Flag,
  MapPin,
} from 'lucide-react';
import { propertiesApi, type PropertyInquiryRecord } from '@/lib/api-client';

// ── constants ─────────────────────────────────────────────────────────────────

const ENQUIRY_SOURCES = [
  { value: 'website',         label: 'Website Form',     Icon: Globe },
  { value: 'phone',           label: 'Phone Call',       Icon: Phone },
  { value: 'email',           label: 'Email',            Icon: Mail },
  { value: 'walk-in',         label: 'Walk-in',          Icon: Building2 },
  { value: 'referral',        label: 'Referral',         Icon: Users },
  { value: 'social-media',    label: 'Social Media',     Icon: MessageSquare },
  { value: 'property-portal', label: 'Property Portal',  Icon: Home },
  { value: 'other',           label: 'Other',            Icon: Tag },
];

const ENQUIRY_TYPES = [
  { value: 'viewing-request', label: 'Viewing Request',      description: 'Request to schedule a property viewing' },
  { value: 'price-enquiry',   label: 'Price Enquiry',        description: 'Questions about pricing or negotiations' },
  { value: 'general-info',    label: 'General Information',  description: 'General questions about the property' },
  { value: 'availability',    label: 'Availability',         description: 'Checking if property is still available' },
  { value: 'financing',       label: 'Financing Questions',  description: 'Questions about financing options' },
  { value: 'documentation',   label: 'Documentation Request', description: 'Requesting property documents or details' },
  { value: 'complaint',       label: 'Complaint',            description: 'Issue or complaint to be addressed' },
  { value: 'other',           label: 'Other',                description: 'Other type of enquiry' },
];

const PRIORITY_LEVELS = [
  { value: 'low',    label: 'Low',    color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'high',   label: 'High',   color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300' },
];

const STEPS = [
  { number: 1, title: 'Enquirer Info',    Icon: User },
  { number: 2, title: 'Enquiry Details',  Icon: MessageSquare },
  { number: 3, title: 'Property Interest', Icon: Home },
  { number: 4, title: 'Follow-up',        Icon: Calendar },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function toInquiryType(type: string): 'viewing' | 'offer' | 'question' {
  if (type === 'viewing-request') return 'viewing';
  if (type === 'price-enquiry')   return 'offer';
  return 'question';
}

function toPreferredContact(method: string): 'phone' | 'email' | 'whatsapp' | undefined {
  if (method === 'phone' || method === 'email' || method === 'whatsapp') return method;
  if (method === 'text') return 'phone';
  return undefined;
}

// ── props ─────────────────────────────────────────────────────────────────────

interface AddEnquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  authToken: string;
  onCreated?: (enquiry: PropertyInquiryRecord) => void;
}

// ── initial form state ────────────────────────────────────────────────────────

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  preferredContact: 'email',
  source: '',
  enquiryType: '',
  priority: 'medium',
  subject: '',
  message: '',
  propertyInterest: 'this-property',
  priceRange: '',
  bedrooms: '',
  propertyType: '',
  location: '',
  immediateResponse: false,
  scheduleViewing: false,
  viewingDate: '',
  viewingTime: '',
  sendBrochure: false,
  addToMailingList: false,
  followUpDate: '',
  assignedAgent: 'me',
  internalNotes: '',
};

type FormData = typeof INITIAL_FORM;

// ── component ─────────────────────────────────────────────────────────────────

export function AddEnquiryModal({ open, onOpenChange, propertyId, authToken, onCreated }: AddEnquiryModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const update = (field: keyof FormData, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  function handleClose() {
    onOpenChange(false);
    // reset after close animation
    setTimeout(() => {
      setCurrentStep(1);
      setFormData(INITIAL_FORM);
      setSaveError('');
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    // Compose message with embedded contact + notes
    const lines: string[] = [];
    lines.push(`Name: ${formData.firstName} ${formData.lastName}`);
    lines.push(`Email: ${formData.email}`);
    lines.push(`Phone: ${formData.phone}`);
    if (formData.alternatePhone) lines.push(`Alt Phone: ${formData.alternatePhone}`);
    if (formData.source)         lines.push(`Source: ${formData.source}`);
    if (formData.priority)       lines.push(`Priority: ${formData.priority}`);
    if (formData.subject)        lines.push(`Subject: ${formData.subject}`);
    if (formData.message)        lines.push('', formData.message);
    if (formData.internalNotes)  lines.push('', `[Internal Notes]: ${formData.internalNotes}`);

    const preferredDate =
      formData.scheduleViewing && formData.viewingDate && formData.viewingTime
        ? `${formData.viewingDate}T${formData.viewingTime}:00`
        : undefined;

    try {
      const result = await propertiesApi.createInquiry(authToken, propertyId, {
        inquiryType:            toInquiryType(formData.enquiryType),
        message:                lines.join('\n'),
        preferredDate,
        preferredContactMethod: toPreferredContact(formData.preferredContact),
      });

      onCreated?.(result as PropertyInquiryRecord);
      handleClose();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create enquiry');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
          aria-describedby={undefined}
        >
          <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-4xl my-auto">

            {/* ── header ── */}
            <div className="bg-white rounded-t-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900">Add New Enquiry</Dialog.Title>
                <p className="text-sm text-gray-500 mt-0.5">Record and manage incoming property enquiries</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Step {currentStep} of 4</span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* ── progress steps ── */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />
                  </div>
                  {STEPS.map((step) => {
                    const Icon = step.Icon;
                    const isCompleted = currentStep > step.number;
                    const isCurrent   = currentStep === step.number;
                    return (
                      <div key={step.number} className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all bg-white ${
                            isCompleted ? 'border-blue-600 bg-blue-600'
                            : isCurrent  ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300'
                          }`}
                        >
                          {isCompleted
                            ? <Check className="w-6 h-6 text-white" />
                            : <Icon className={`w-6 h-6 ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />}
                        </div>
                        <div className={`text-sm font-medium mt-2 ${isCurrent || isCompleted ? 'text-blue-600' : 'text-gray-500'}`}>
                          {step.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── form ── */}
              <form onSubmit={handleSubmit}>
                <div className="bg-white border border-gray-200 rounded-xl p-8">

                  {/* Step 1 — Enquirer Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">Enquirer Information</h2>
                        <p className="text-sm text-gray-600">Who is making this enquiry?</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                          <input
                            type="text" required
                            value={formData.firstName}
                            onChange={(e) => update('firstName', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                          <input
                            type="text" required
                            value={formData.lastName}
                            onChange={(e) => update('lastName', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="email" required
                              value={formData.email}
                              onChange={(e) => update('email', e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="john.doe@example.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="tel" required
                              value={formData.phone}
                              onChange={(e) => update('phone', e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone (Optional)</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.alternatePhone}
                            onChange={(e) => update('alternatePhone', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="(555) 987-6543"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Contact Method *</label>
                        <div className="grid grid-cols-3 gap-4">
                          {['email', 'phone', 'text'].map((method) => (
                            <button
                              key={method} type="button"
                              onClick={() => update('preferredContact', method)}
                              className={`p-4 border-2 rounded-lg text-center transition-all ${
                                formData.preferredContact === method ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-medium text-gray-900 capitalize">{method}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-900">
                            <strong>Quick Tip:</strong> Accurate contact information helps ensure timely follow-up and better conversion rates.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 — Enquiry Details */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">Enquiry Details</h2>
                        <p className="text-sm text-gray-600">What is this enquiry about?</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Enquiry Source *</label>
                        <div className="grid grid-cols-4 gap-3">
                          {ENQUIRY_SOURCES.map(({ value, label, Icon }) => (
                            <button
                              key={value} type="button"
                              onClick={() => update('source', value)}
                              className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center gap-2 ${
                                formData.source === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon className={`w-6 h-6 ${formData.source === value ? 'text-blue-600' : 'text-gray-400'}`} />
                              <span className="text-sm font-medium text-gray-900 text-center">{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Enquiry Type *</label>
                        <div className="grid grid-cols-2 gap-3">
                          {ENQUIRY_TYPES.map(({ value, label, description }) => (
                            <button
                              key={value} type="button"
                              onClick={() => update('enquiryType', value)}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${
                                formData.enquiryType === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-medium text-gray-900 mb-1">{label}</div>
                              <div className="text-xs text-gray-600">{description}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          <span className="flex items-center gap-2"><Flag className="w-4 h-4" />Priority Level *</span>
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {PRIORITY_LEVELS.map(({ value, label, color }) => (
                            <button
                              key={value} type="button"
                              onClick={() => update('priority', value)}
                              className={`p-3 border-2 rounded-lg font-medium transition-all ${
                                formData.priority === value
                                  ? color + ' border-current'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                        <input
                          type="text" required
                          value={formData.subject}
                          onChange={(e) => update('subject', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Interested in scheduling a viewing"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enquiry Message *</label>
                        <textarea
                          required
                          value={formData.message}
                          onChange={(e) => update('message', e.target.value)}
                          rows={6}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Enter the full enquiry message or details..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Include all relevant details from the enquirer</p>
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Property Interest */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">Property Interest</h2>
                        <p className="text-sm text-gray-600">What property are they interested in?</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Property Interest *</label>
                        <div className="space-y-3">
                          {[
                            { value: 'this-property',       Icon: Home,      label: 'This Property',      desc: 'Enquiry about the current listing' },
                            { value: 'similar-properties',  Icon: Building2, label: 'Similar Properties', desc: 'Looking for similar options in the area' },
                            { value: 'general',             Icon: Globe,     label: 'General Enquiry',    desc: 'Not specific to any property' },
                          ].map(({ value, Icon, label, desc }) => (
                            <button
                              key={value} type="button"
                              onClick={() => update('propertyInterest', value)}
                              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                formData.propertyInterest === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${formData.propertyInterest === value ? 'text-blue-600' : 'text-gray-400'}`} />
                                <div>
                                  <div className="font-medium text-gray-900">{label}</div>
                                  <div className="text-sm text-gray-600">{desc}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {formData.propertyInterest === 'similar-properties' && (
                        <div className="space-y-6 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                              <input
                                type="text"
                                value={formData.priceRange}
                                onChange={(e) => update('priceRange', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., $700k - $900k"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                              <select
                                value={formData.bedrooms}
                                onChange={(e) => update('bedrooms', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Any</option>
                                {['1','2','3','4','5+'].map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                              <select
                                value={formData.propertyType}
                                onChange={(e) => update('propertyType', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Any</option>
                                <option value="single-family">Single Family</option>
                                <option value="condo">Condo</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="multi-family">Multi-Family</option>
                                <option value="land">Land</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location</label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="text"
                                  value={formData.location}
                                  onChange={(e) => update('location', e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="City or neighbourhood"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4 — Follow-up */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">Follow-up &amp; Actions</h2>
                        <p className="text-sm text-gray-600">How should this enquiry be handled?</p>
                      </div>

                      <div className="space-y-3">
                        {/* Immediate response */}
                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.immediateResponse}
                            onChange={(e) => update('immediateResponse', e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Requires Immediate Response</div>
                            <div className="text-sm text-gray-600 mt-0.5">Flag this enquiry as urgent and requiring immediate attention</div>
                          </div>
                        </label>

                        {/* Schedule viewing */}
                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.scheduleViewing}
                            onChange={(e) => update('scheduleViewing', e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Schedule Viewing</div>
                            <div className="text-sm text-gray-600 mt-0.5">Automatically create a viewing appointment</div>
                          </div>
                        </label>

                        {formData.scheduleViewing && (
                          <div className="ml-11 grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Viewing Date</label>
                              <input
                                type="date"
                                value={formData.viewingDate}
                                onChange={(e) => update('viewingDate', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Viewing Time</label>
                              <input
                                type="time"
                                value={formData.viewingTime}
                                onChange={(e) => update('viewingTime', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}

                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.sendBrochure}
                            onChange={(e) => update('sendBrochure', e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Send Property Brochure</div>
                            <div className="text-sm text-gray-600 mt-0.5">Email property brochure and details to enquirer</div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.addToMailingList}
                            onChange={(e) => update('addToMailingList', e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Add to Mailing List</div>
                            <div className="text-sm text-gray-600 mt-0.5">Subscribe to property updates and newsletters</div>
                          </div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => update('followUpDate', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Set a reminder to follow up with this enquirer</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Agent</label>
                        <select
                          value={formData.assignedAgent}
                          onChange={(e) => update('assignedAgent', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="me">Me (Current User)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Internal Notes (Optional)</label>
                        <textarea
                          value={formData.internalNotes}
                          onChange={(e) => update('internalNotes', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Add any internal notes about this enquiry (not visible to client)..."
                        />
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-900">
                            <strong>Ready to Submit:</strong> Review all details and click &quot;Create Enquiry&quot; to add this to your enquiry management system.
                          </p>
                        </div>
                      </div>

                      {saveError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                          {saveError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── navigation buttons ── */}
                <div className="flex items-center justify-between mt-5">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                    disabled={currentStep === 1}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                      >
                        Next
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                        {isSaving ? 'Creating…' : 'Create Enquiry'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
