'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Home,
  Calendar,
  Tag,
  Briefcase,
  Globe,
  MessageSquare,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  Star,
  AlertCircle,
  FileText,
  Users,
  Search,
  ThumbsUp,
  Activity,
} from 'lucide-react';
import { leadsApi, usersApi, UserSearchResult } from '@/lib/api-client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  authToken: string;
  onSuccess?: () => void;
}

const leadSources = [
  { value: 'website',      label: 'Website Inquiry',    icon: Globe },
  { value: 'phone',        label: 'Phone Call',         icon: Phone },
  { value: 'email',        label: 'Email',              icon: Mail },
  { value: 'walk-in',      label: 'Walk-in',            icon: Users },
  { value: 'referral',     label: 'Referral',           icon: ThumbsUp },
  { value: 'social-media', label: 'Social Media',       icon: MessageSquare },
  { value: 'open-house',   label: 'Open House',         icon: Home },
  { value: 'online-ad',    label: 'Online Advertising', icon: Target },
  { value: 'zillow',       label: 'Zillow',             icon: Search },
  { value: 'realtor',      label: 'Realtor.com',        icon: Search },
  { value: 'other',        label: 'Other',              icon: Tag },
];

const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Land', 'Commercial', 'Luxury', 'Investment'];
const features = ['Pool', 'Garage', 'Fireplace', 'Hardwood Floors', 'Updated Kitchen', 'Home Office', 'Backyard', 'Basement', 'Smart Home', 'Solar Panels', 'Gated Community', 'View'];
const commonTags = ['Hot Lead', 'First Time Buyer', 'Investor', 'Cash Buyer', 'Relocating', 'Upsizing', 'Downsizing', 'Luxury Market'];

const steps = [
  { id: 1, name: 'Lead Source & Contact', icon: User },
  { id: 2, name: 'Property Interest',     icon: Home },
  { id: 3, name: 'Qualification & Timeline', icon: TrendingUp },
  { id: 4, name: 'Notes & Follow-up',     icon: FileText },
];

function buildInitialForm(propertyId: string) {
  return {
    leadSource: 'website',
    customSource: '',
    sourceDetails: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    preferredContact: 'email',
    company: '',
    occupation: '',
    propertyInterest: 'buying',
    propertyTypes: [] as string[],
    interestedInListing: !!propertyId,
    listingId: propertyId,
    minBudget: '',
    maxBudget: '',
    locationNotes: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    mustHaveFeatures: [] as string[],
    qualificationStatus: 'unqualified',
    financialStatus: 'unknown',
    preApproved: false,
    preApprovalAmount: '',
    lenderName: '',
    cashBuyer: false,
    needsToSellFirst: false,
    currentPropertyValue: '',
    timeframe: 'not-sure',
    urgency: 'medium',
    motivation: '',
    searchStage: 'just-looking',
    leadScore: 50,
    priority: 'medium',
    assignedAgent: '',
    followUpDate: '',
    followUpTime: '',
    followUpMethod: 'email',
    notes: '',
    internalNotes: '',
    tags: [] as string[],
    customTags: '',
    communicationPreferences: [] as string[],
  };
}

export function AddLeadModal({ open, onOpenChange, propertyId, authToken, onSuccess }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => buildInitialForm(propertyId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    if (!open) return;
    usersApi.search(authToken, '', 'agent')
      .then(setAgents)
      .catch(() => setAgents([]));
  }, [open, authToken]);

  if (!open) return null;

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(buildInitialForm(propertyId));
    setError(null);
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, value: string) => {
    const current = formData[field as keyof typeof formData] as string[];
    handleInputChange(
      field,
      current.includes(value) ? current.filter((i) => i !== value) : [...current, value],
    );
  };

  const tempFromQualification = () => {
    if (formData.qualificationStatus === 'hot') return 'hot';
    if (formData.qualificationStatus === 'qualified' || formData.qualificationStatus === 'qualifying') return 'warm';
    return 'cold';
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const name = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Unnamed Lead';
      const preferences = [
        formData.propertyTypes.length ? `Types: ${formData.propertyTypes.join(', ')}` : '',
        formData.mustHaveFeatures.length ? `Features: ${formData.mustHaveFeatures.join(', ')}` : '',
        formData.locationNotes ? `Locations: ${formData.locationNotes}` : '',
        formData.motivation ? `Motivation: ${formData.motivation}` : '',
        formData.interestedInListing && formData.listingId
          ? `Interested in listing: ${formData.listingId}`
          : '',
      ].filter(Boolean).join('\n') || undefined;

      const allNotes = [
        formData.notes,
        formData.internalNotes ? `[Internal] ${formData.internalNotes}` : '',
        formData.tags.length ? `Tags: ${formData.tags.join(', ')}` : '',
        formData.customTags ? `Custom tags: ${formData.customTags}` : '',
      ].filter(Boolean).join('\n') || undefined;

      const nextFollowUp =
        formData.followUpDate
          ? formData.followUpTime
            ? `${formData.followUpDate}T${formData.followUpTime}:00`
            : `${formData.followUpDate}T09:00:00`
          : undefined;

      const interestTypeMap: Record<string, string> = {
        buying: 'buyer',
        selling: 'seller',
        both: 'buyer',
      };
      const leadType = interestTypeMap[formData.propertyInterest] ?? 'buyer';

      await leadsApi.create(authToken, {
        name,
        type: leadType,
        email:    formData.email   || undefined,
        phone:    formData.phone   || undefined,
        source:   formData.leadSource,
        timeline: formData.timeframe !== 'not-sure' ? formData.timeframe : undefined,
        budgetMin: formData.minBudget ? Number(formData.minBudget.replace(/,/g, '')) : undefined,
        budgetMax: formData.maxBudget ? Number(formData.maxBudget.replace(/,/g, '')) : undefined,
        preferences,
        temperature: tempFromQualification(),
        stage: 'new',
        prequalified: formData.preApproved || formData.financialStatus === 'pre-approved',
        notes:       allNotes,
        nextFollowUp,
        assignedTo:  formData.assignedAgent || undefined,
      });

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col overflow-hidden">
      <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">

        {/* Sticky Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Add New Lead</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-6 flex items-center justify-between max-w-3xl">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                          ${isActive    ? 'bg-blue-600 text-white'  : ''}
                          ${isCompleted ? 'bg-green-600 text-white' : ''}
                          ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span
                        className={`text-xs mt-2 text-center
                          ${isActive    ? 'text-blue-600 font-medium' : ''}
                          ${isCompleted ? 'text-green-600' : ''}
                          ${!isActive && !isCompleted ? 'text-gray-400' : ''}`}
                      >
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 mb-6 transition-colors
                          ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-4xl mx-auto px-6 py-8 w-full">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

            {/* ── Step 1: Lead Source & Contact ── */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900">Lead Source & Contact Information</h2>

                {/* Lead Source */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Lead Source <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {leadSources.map((source) => {
                      const Icon = source.icon;
                      const active = formData.leadSource === source.value;
                      return (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() => handleInputChange('leadSource', source.value)}
                          className={`p-4 rounded-lg border-2 text-left transition-all
                            ${active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${active ? 'text-blue-900' : 'text-gray-700'}`}>
                              {source.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {formData.leadSource === 'other' && (
                    <input
                      type="text"
                      placeholder="Specify source"
                      value={formData.customSource}
                      onChange={(e) => handleInputChange('customSource', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {['referral', 'online-ad', 'social-media'].includes(formData.leadSource) && (
                    <input
                      type="text"
                      placeholder={
                        formData.leadSource === 'referral'     ? 'Referred by' :
                        formData.leadSource === 'online-ad'    ? 'Campaign name' :
                        'Platform/Campaign details'
                      }
                      value={formData.sourceDetails}
                      onChange={(e) => handleInputChange('sourceDetails', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="John"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="john.doe@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.alternatePhone}
                          onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(555) 987-6543"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
                      <select
                        value={formData.preferredContact}
                        onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="text">Text Message</option>
                        <option value="any">Any</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Occupation (Optional)</label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => handleInputChange('occupation', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Software Engineer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Property Interest ── */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900">Property Interest & Requirements</h2>

                {/* Interest Type */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    What is the lead interested in? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'buying',  label: 'Buying',  icon: Home },
                      { value: 'selling', label: 'Selling', icon: Tag },
                      { value: 'both',    label: 'Both',    icon: TrendingUp },
                    ].map(({ value, label, icon: Icon }) => {
                      const active = formData.propertyInterest === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleInputChange('propertyInterest', value)}
                          className={`p-4 rounded-lg border-2 transition-all
                            ${active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium block ${active ? 'text-blue-900' : 'text-gray-700'}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Listing */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="specificListing"
                      checked={formData.interestedInListing}
                      onChange={(e) => handleInputChange('interestedInListing', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="specificListing" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Lead is interested in a specific listing
                      </label>
                      {formData.interestedInListing && (
                        <input
                          type="text"
                          value={formData.listingId}
                          onChange={(e) => handleInputChange('listingId', e.target.value)}
                          placeholder="Enter listing ID or address"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Property Types */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Property Types of Interest</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {propertyTypes.map((type) => {
                      const active = formData.propertyTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleArrayItem('propertyTypes', type)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                            ${active ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Budget Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Minimum Budget</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.minBudget}
                          onChange={(e) => handleInputChange('minBudget', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="250,000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Maximum Budget</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.maxBudget}
                          onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="500,000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferred Locations */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Preferred Locations</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.locationNotes}
                      onChange={(e) => handleInputChange('locationNotes', e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="e.g., Downtown area, near schools, walkable neighborhood..."
                    />
                  </div>
                </div>

                {/* Property Requirements */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Property Requirements</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Bedrooms</label>
                      <select
                        value={formData.bedrooms}
                        onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Bathrooms</label>
                      <select
                        value={formData.bathrooms}
                        onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Min Sq Ft</label>
                      <input
                        type="text"
                        value={formData.squareFeet}
                        onChange={(e) => handleInputChange('squareFeet', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1,500"
                      />
                    </div>
                  </div>
                </div>

                {/* Must-Have Features */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Must-Have Features</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {features.map((feature) => {
                      const active = formData.mustHaveFeatures.includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => toggleArrayItem('mustHaveFeatures', feature)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm transition-all text-left
                            ${active ? 'border-blue-600 bg-blue-50 text-blue-900 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          {feature}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Qualification & Timeline ── */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900">Qualification & Timeline</h2>

                {/* Qualification Status */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Qualification Status</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: 'unqualified', label: 'Unqualified', border: '#4b5563', bg: '#f3f4f6', color: '#1f2937' },
                      { value: 'qualifying',  label: 'Qualifying',  border: '#eab308', bg: '#fef9c3', color: '#854d0e' },
                      { value: 'qualified',   label: 'Qualified',   border: '#16a34a', bg: '#dcfce7', color: '#14532d' },
                      { value: 'hot',         label: 'Hot Lead',    border: '#dc2626', bg: '#fee2e2', color: '#7f1d1d' },
                    ].map((s) => {
                      const active = formData.qualificationStatus === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => handleInputChange('qualificationStatus', s.value)}
                          style={active ? { borderColor: s.border, backgroundColor: s.bg, color: s.color } : {}}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                            ${active ? '' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Status */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Financial Status</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.financialStatus}
                      onChange={(e) => handleInputChange('financialStatus', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="needs-financing">Needs Financing</option>
                      <option value="pre-qualified">Pre-Qualified</option>
                      <option value="pre-approved">Pre-Approved</option>
                      <option value="cash-buyer">Cash Buyer</option>
                    </select>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preApproved}
                          onChange={(e) => handleInputChange('preApproved', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Pre-Approved</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.cashBuyer}
                          onChange={(e) => handleInputChange('cashBuyer', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Cash Buyer</span>
                      </label>
                    </div>
                  </div>

                  {formData.preApproved && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Pre-Approval Amount</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.preApprovalAmount}
                            onChange={(e) => handleInputChange('preApprovalAmount', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="500,000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Lender Name</label>
                        <input
                          type="text"
                          value={formData.lenderName}
                          onChange={(e) => handleInputChange('lenderName', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Wells Fargo"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Needs to Sell First */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="needsToSell"
                      checked={formData.needsToSellFirst}
                      onChange={(e) => handleInputChange('needsToSellFirst', e.target.checked)}
                      className="mt-1 w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="needsToSell" className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Needs to sell current property first
                      </label>
                      {formData.needsToSellFirst && (
                        <div className="mt-3">
                          <label className="block text-xs text-gray-500 mb-2">Current Property Value (Estimate)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={formData.currentPropertyValue}
                              onChange={(e) => handleInputChange('currentPropertyValue', e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="350,000"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeframe */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Purchase Timeframe</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'immediately',    label: 'Immediately' },
                      { value: '1-3-months',     label: '1–3 Months' },
                      { value: '3-6-months',     label: '3–6 Months' },
                      { value: '6-12-months',    label: '6–12 Months' },
                      { value: '12-months-plus', label: '12+ Months' },
                      { value: 'just-browsing',  label: 'Just Browsing' },
                      { value: 'not-sure',       label: 'Not Sure' },
                    ].map((t) => {
                      const active = formData.timeframe === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => handleInputChange('timeframe', t.value)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                            ${active ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Urgency */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Urgency Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'low',    label: 'Low',    icon: Activity },
                      { value: 'medium', label: 'Medium', icon: TrendingUp },
                      { value: 'high',   label: 'High',   icon: AlertCircle },
                    ].map(({ value, label, icon: Icon }) => {
                      const active = formData.urgency === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleInputChange('urgency', value)}
                          className={`p-4 rounded-lg border-2 transition-all
                            ${active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium block ${active ? 'text-blue-900' : 'text-gray-700'}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search Stage */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Where are they in their search?</label>
                  <select
                    value={formData.searchStage}
                    onChange={(e) => handleInputChange('searchStage', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="just-looking">Just Looking / Researching</option>
                    <option value="actively-searching">Actively Searching</option>
                    <option value="ready-to-make-offer">Ready to Make an Offer</option>
                    <option value="under-contract">Under Contract Elsewhere</option>
                    <option value="backup-plan">Looking for Backup Options</option>
                  </select>
                </div>

                {/* Motivation */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Motivation / Reason for Move</label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="e.g., Relocating for job, growing family, downsizing, investment opportunity..."
                  />
                </div>
              </div>
            )}

            {/* ── Step 4: Notes & Follow-up ── */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900">Notes & Follow-up</h2>

                {/* Lead Score */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Lead Score: <span className="text-blue-600 text-lg font-semibold">{formData.leadScore}</span>/100
                    </label>
                    <div className="flex items-center gap-2">
                      {[80, 60, 40, 20, 1].map((threshold) => (
                        <Star
                          key={threshold}
                          className={`w-5 h-5 ${formData.leadScore >= threshold ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.leadScore}
                    onChange={(e) => handleInputChange('leadScore', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <p className="text-xs text-gray-500">Adjust based on lead quality and likelihood to convert</p>
                </div>

                {/* Priority */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Priority Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'low',    label: 'Low Priority',    cls: 'bg-gray-100 text-gray-700 border-gray-300' },
                      { value: 'medium', label: 'Medium Priority', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
                      { value: 'high',   label: 'High Priority',   cls: 'bg-red-100 text-red-700 border-red-300' },
                    ].map((p) => {
                      const active = formData.priority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => handleInputChange('priority', p.value)}
                          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                            ${active ? p.cls : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assign Agent */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Assign to Agent</label>
                  <select
                    value={formData.assignedAgent}
                    onChange={(e) => handleInputChange('assignedAgent', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned (Me)</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.firstName} {agent.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Follow-up */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Schedule Follow-up</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="time"
                          value={formData.followUpTime}
                          onChange={(e) => handleInputChange('followUpTime', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Follow-up Method</label>
                    <select
                      value={formData.followUpMethod}
                      onChange={(e) => handleInputChange('followUpMethod', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone Call</option>
                      <option value="text">Text Message</option>
                      <option value="in-person">In-Person Meeting</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {commonTags.map((tag) => {
                      const active = formData.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleArrayItem('tags', tag)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm transition-all
                            ${active ? 'border-purple-600 bg-purple-50 text-purple-900 font-medium' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={formData.customTags}
                    onChange={(e) => handleInputChange('customTags', e.target.value)}
                    placeholder="Add custom tags (comma separated)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Lead Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add any relevant notes about this lead..."
                  />
                </div>

                {/* Internal Notes */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Internal Notes (Team Only)</label>
                  <textarea
                    value={formData.internalNotes}
                    onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Private notes for internal use only..."
                  />
                </div>

                {/* Communication Preferences */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Communication Preferences</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'email-updates', label: 'Email Updates' },
                      { value: 'sms-alerts',    label: 'SMS Alerts' },
                      { value: 'newsletter',    label: 'Newsletter' },
                      { value: 'market-reports', label: 'Market Reports' },
                    ].map((pref) => (
                      <label
                        key={pref.value}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.communicationPreferences.includes(pref.value)}
                          onChange={() => toggleArrayItem('communicationPreferences', pref.value)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{pref.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium transition-all
                  ${currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`h-2 rounded-full transition-all
                      ${currentStep === step.id ? 'bg-blue-600 w-8' : ''}
                      ${currentStep > step.id  ? 'bg-green-600 w-2' : ''}
                      ${currentStep < step.id  ? 'bg-gray-300 w-2' : ''}`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {currentStep === steps.length
                  ? (submitting ? 'Creating…' : 'Create Lead')
                  : 'Next Step'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
