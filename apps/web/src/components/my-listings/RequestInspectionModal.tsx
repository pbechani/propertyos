'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Home,
  Bug,
  Zap,
  Droplet,
  Wind,
  Shield,
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Key,
  Sparkles
} from 'lucide-react';
import { propertiesApi } from '@/lib/api-client';

interface RequestInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  authToken: string;
  propertyAddress?: string;
}

const inspectionTypes = [
  {
    id: 'general',
    label: 'General Home Inspection',
    description: 'Comprehensive property evaluation',
    icon: Home,
    color: 'bg-blue-50 border-blue-500 text-blue-700',
    estimatedCost: '$300-500',
    duration: '2-4 hours',
    recommended: true
  },
  {
    id: 'roof',
    label: 'Roof Inspection',
    description: 'Shingles, flashing, gutters',
    icon: Home,
    color: 'bg-orange-50 border-orange-500 text-orange-700',
    estimatedCost: '$150-300',
    duration: '1-2 hours',
    recommended: false
  },
  {
    id: 'pest',
    label: 'Pest & Termite',
    description: 'Wood-destroying organisms',
    icon: Bug,
    color: 'bg-red-50 border-red-500 text-red-700',
    estimatedCost: '$75-150',
    duration: '1 hour',
    recommended: true
  },
  {
    id: 'electrical',
    label: 'Electrical System',
    description: 'Wiring, panel, outlets',
    icon: Zap,
    color: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    estimatedCost: '$200-350',
    duration: '2-3 hours',
    recommended: false
  },
  {
    id: 'plumbing',
    label: 'Plumbing Inspection',
    description: 'Pipes, drains, water heater',
    icon: Droplet,
    color: 'bg-cyan-50 border-cyan-500 text-cyan-700',
    estimatedCost: '$150-275',
    duration: '1-2 hours',
    recommended: false
  },
  {
    id: 'hvac',
    label: 'HVAC System',
    description: 'Heating & cooling systems',
    icon: Wind,
    color: 'bg-teal-50 border-teal-500 text-teal-700',
    estimatedCost: '$150-250',
    duration: '1-2 hours',
    recommended: false
  },
  {
    id: 'foundation',
    label: 'Foundation & Structure',
    description: 'Structural integrity check',
    icon: Shield,
    color: 'bg-purple-50 border-purple-500 text-purple-700',
    estimatedCost: '$300-600',
    duration: '2-3 hours',
    recommended: false
  },
  {
    id: 'mold',
    label: 'Mold & Air Quality',
    description: 'Indoor air quality testing',
    icon: Wind,
    color: 'bg-green-50 border-green-500 text-green-700',
    estimatedCost: '$200-400',
    duration: '1-2 hours',
    recommended: false
  },
  {
    id: 'septic',
    label: 'Septic System',
    description: 'Septic tank & drainage',
    icon: Droplet,
    color: 'bg-indigo-50 border-indigo-500 text-indigo-700',
    estimatedCost: '$250-450',
    duration: '2-3 hours',
    recommended: false
  }
];

const urgencyLevels = [
  {
    value: 'standard',
    label: 'Standard',
    description: '5-7 business days',
    color: 'bg-gray-50 border-gray-500 text-gray-700'
  },
  {
    value: 'priority',
    label: 'Priority',
    description: '2-3 business days',
    color: 'bg-blue-50 border-blue-500 text-blue-700',
    extraCost: '+$50'
  },
  {
    value: 'rush',
    label: 'Rush',
    description: 'Next business day',
    color: 'bg-red-50 border-red-500 text-red-700',
    extraCost: '+$100'
  }
];

export function RequestInspectionModal({ open, onOpenChange, propertyId, authToken, propertyAddress }: RequestInspectionModalProps) {
  const [formData, setFormData] = useState({
    inspectionTypes: [] as string[],
    preferredDate: '',
    preferredTime: '',
    alternateDate: '',
    alternateTime: '',
    urgency: 'standard',
    inspectorName: '',
    inspectorCompany: '',
    inspectorPhone: '',
    inspectorEmail: '',
    accessMethod: 'lockbox',
    lockboxCode: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    areasOfConcern: '',
    specialInstructions: '',
    notifyClient: true,
    sendReportTo: 'both',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedInspectionTypes = inspectionTypes.filter(type => 
    formData.inspectionTypes.includes(type.id)
  );


  const calculateEstimatedCost = () => {
    let total = 0;
    selectedInspectionTypes.forEach(type => {
      const costRange = type.estimatedCost.replace('$', '').split('-');
      const avgCost = (parseInt(costRange[0]) + parseInt(costRange[1])) / 2;
      total += avgCost;
    });
    
    if (formData.urgency === 'priority') total += 50;
    if (formData.urgency === 'rush') total += 100;
    
    return total;
  };

  const handleSubmit = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await propertiesApi.createInspectionRequest(authToken, propertyId, {
        inspectionTypes: formData.inspectionTypes,
        urgency: formData.urgency,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        alternateDate: formData.alternateDate || undefined,
        alternateTime: formData.alternateTime || undefined,
        inspectorName: formData.inspectorName || undefined,
        inspectorCompany: formData.inspectorCompany || undefined,
        inspectorPhone: formData.inspectorPhone || undefined,
        inspectorEmail: formData.inspectorEmail || undefined,
        accessMethod: formData.accessMethod,
        lockboxCode: formData.lockboxCode || undefined,
        contactPerson: formData.contactPerson || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        areasOfConcern: formData.areasOfConcern || undefined,
        specialInstructions: formData.specialInstructions || undefined,
        notifyClient: formData.notifyClient,
        sendReportTo: formData.sendReportTo,
      });
      onOpenChange(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to request inspection');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.inspectionTypes.length > 0 &&
      formData.preferredDate !== '' &&
      formData.preferredTime !== '' &&
      (formData.accessMethod !== 'contact' || formData.contactPerson !== '')
    );
  };

  const toggleInspectionType = (typeId: string) => {
    if (formData.inspectionTypes.includes(typeId)) {
      setFormData(prev => ({
        ...prev,
        inspectionTypes: prev.inspectionTypes.filter(id => id !== typeId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        inspectionTypes: [...prev.inspectionTypes, typeId]
      }));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Request Property Inspection
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                  {propertyAddress || 'Address not provided'}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="p-2 hover:bg-indigo-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Inspection Types */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Inspection Type(s) <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-500">
                  {formData.inspectionTypes.length} selected
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {inspectionTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.inspectionTypes.includes(type.id);
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleInspectionType(type.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all relative ${
                        isSelected ? type.color : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {type.recommended && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                          Recommended
                        </span>
                      )}
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                      <div className="font-medium text-sm mb-1">{type.label}</div>
                      <div className={`text-xs mb-2 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                        {type.description}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={isSelected ? 'font-medium' : 'text-gray-600'}>
                          {type.estimatedCost}
                        </span>
                        <span className={isSelected ? 'opacity-70' : 'text-gray-500'}>
                          {type.duration}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Inspections Summary */}
            {formData.inspectionTypes.length > 0 && (
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 mb-2">Selected Inspections</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedInspectionTypes.map(type => (
                        <span
                          key={type.id}
                          className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm text-blue-700 flex items-center gap-2"
                        >
                          <type.icon className="w-3 h-3" />
                          {type.label}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-blue-700">
                      Estimated total cost: <span className="font-semibold">${calculateEstimatedCost().toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduling */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduling Preferences
              </h3>
              
              <div className="space-y-4">
                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {urgencyLevels.map((urgency) => {
                      const isSelected = formData.urgency === urgency.value;
                      
                      return (
                        <button
                          key={urgency.value}
                          onClick={() => setFormData(prev => ({ ...prev, urgency: urgency.value }))}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            isSelected ? urgency.color : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="font-medium text-sm">{urgency.label}</div>
                          <div className={`text-xs mt-1 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                            {urgency.description}
                          </div>
                          {urgency.extraCost && (
                            <div className={`text-xs mt-1 font-medium ${isSelected ? '' : 'text-gray-600'}`}>
                              {urgency.extraCost}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Preferred Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Preferred Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select time</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* Alternate Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternate Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.alternateDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternateDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternate Time (Optional)
                    </label>
                    <select
                      value={formData.alternateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, alternateTime: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select time</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspector Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Inspector Details{' '}
                <span className="text-sm font-normal text-gray-500">(Optional — leave blank if unknown)</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inspector Name</label>
                  <input
                    type="text"
                    value={formData.inspectorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectorName: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.inspectorCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectorCompany: e.target.value }))}
                    placeholder="Inspection company"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.inspectorPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectorPhone: e.target.value }))}
                    placeholder="+27 ..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.inspectorEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectorEmail: e.target.value }))}
                    placeholder="inspector@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Property Access */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Property Access
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Access Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'lockbox', label: 'Lockbox', icon: Key },
                      { value: 'occupied', label: 'Occupied - Call First', icon: Phone },
                      { value: 'contact', label: 'Meet On-Site', icon: User }
                    ].map((method) => {
                      const Icon = method.icon;
                      const isSelected = formData.accessMethod === method.value;
                      
                      return (
                        <button
                          key={method.value}
                          onClick={() => setFormData(prev => ({ ...prev, accessMethod: method.value }))}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                          <div className="font-medium text-sm">{method.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.accessMethod === 'lockbox' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lockbox Code
                    </label>
                    <input
                      type="text"
                      value={formData.lockboxCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, lockboxCode: e.target.value }))}
                      placeholder="Enter lockbox code"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {(formData.accessMethod === 'occupied' || formData.accessMethod === 'contact') && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="Name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="contact@example.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Additional Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Concern (Optional)
                  </label>
                  <textarea
                    value={formData.areasOfConcern}
                    onChange={(e) => setFormData(prev => ({ ...prev, areasOfConcern: e.target.value }))}
                    rows={3}
                    placeholder="Describe any specific areas or issues the inspector should focus on (e.g., 'Water stains on ceiling in master bedroom', 'Cracks in foundation near garage')..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    rows={2}
                    placeholder="Any special instructions for the inspector (e.g., 'Please park on street', 'Dog in backyard - use front door only')..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notification Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyClient}
                    onChange={(e) => setFormData(prev => ({ ...prev, notifyClient: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-sm">Notify client of inspection schedule</div>
                    <div className="text-xs text-gray-600">Send email to client with inspection details</div>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send inspection report to:
                  </label>
                  <select
                    value={formData.sendReportTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendReportTo: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="me">Me only</option>
                    <option value="client">Client only</option>
                    <option value="both">Me and client</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-700" />
                  <span className="font-semibold text-green-900">Estimated Total Cost</span>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  ${calculateEstimatedCost().toFixed(0)}
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Final cost will be confirmed by inspector. Payment typically due after inspection is completed.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {saveError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {!isFormValid() && !saveError && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Please fill in all required fields
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Dialog.Close
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSaving ? 'Submitting...' : 'Request Inspection'}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
