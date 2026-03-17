'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Star,
  MapPin,
  Home,
  Lightbulb,
  DollarSign,
  Heart,
  Zap,
  Trees,
  Camera,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Plus,
  AlertCircle,
  Tag,
  Target
} from 'lucide-react';

import { propertiesApi } from '@/lib/api-client';

interface AddSellingPointModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  authToken: string;
  onSaved?: () => void;
}

const categories = [
  { 
    id: 'location', 
    label: 'Location & Neighborhood', 
    icon: MapPin,
    color: 'bg-purple-50 border-purple-500 text-purple-700',
    examples: ['Close to schools', 'Walking distance to transit', 'Quiet cul-de-sac']
  },
  { 
    id: 'renovation', 
    label: 'Renovations & Updates', 
    icon: Home,
    color: 'bg-blue-50 border-blue-500 text-blue-700',
    examples: ['New kitchen', 'Updated bathrooms', 'Fresh paint']
  },
  { 
    id: 'unique', 
    label: 'Unique Features', 
    icon: Sparkles,
    color: 'bg-pink-50 border-pink-500 text-pink-700',
    examples: ['Vaulted ceilings', 'Original hardwood', 'Custom built-ins']
  },
  { 
    id: 'outdoor', 
    label: 'Outdoor Spaces', 
    icon: Trees,
    color: 'bg-green-50 border-green-500 text-green-700',
    examples: ['Large backyard', 'Covered patio', 'Mature landscaping']
  },
  { 
    id: 'efficiency', 
    label: 'Energy & Efficiency', 
    icon: Zap,
    color: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    examples: ['Solar panels', 'New HVAC', 'Energy-efficient windows']
  },
  { 
    id: 'smart', 
    label: 'Smart Home & Tech', 
    icon: Lightbulb,
    color: 'bg-indigo-50 border-indigo-500 text-indigo-700',
    examples: ['Smart thermostat', 'Security system', 'EV charger']
  },
  { 
    id: 'value', 
    label: 'Value & Investment', 
    icon: DollarSign,
    color: 'bg-emerald-50 border-emerald-500 text-emerald-700',
    examples: ['Below market price', 'High ROI area', 'No HOA fees']
  },
  { 
    id: 'lifestyle', 
    label: 'Lifestyle & Amenities', 
    icon: Heart,
    color: 'bg-red-50 border-red-500 text-red-700',
    examples: ['Home office space', 'Wine cellar', 'Home theater']
  }
];

const priorityLevels = [
  {
    value: 'high',
    label: 'High Priority',
    description: 'Top selling feature - highlight in all marketing',
    icon: Star,
    color: 'bg-red-50 border-red-500 text-red-700'
  },
  {
    value: 'medium',
    label: 'Medium Priority',
    description: 'Important feature worth mentioning',
    icon: Star,
    color: 'bg-yellow-50 border-yellow-500 text-yellow-700'
  },
  {
    value: 'low',
    label: 'Low Priority',
    description: 'Nice to have, additional benefit',
    icon: Star,
    color: 'bg-blue-50 border-blue-500 text-blue-700'
  }
];

const suggestedPoints = {
  location: [
    'Walking distance to top-rated schools',
    'Close to public transportation',
    'Minutes from downtown',
    'Quiet, family-friendly neighborhood',
    'Near parks and recreation'
  ],
  renovation: [
    'Fully remodeled kitchen with high-end appliances',
    'All bathrooms recently updated',
    'New roof (with year)',
    'Fresh interior paint throughout',
    'Refinished hardwood floors'
  ],
  unique: [
    'High ceilings and abundant natural light',
    'Original architectural details',
    'Custom built-in storage solutions',
    'Open floor plan perfect for entertaining',
    'Premium lot with views'
  ],
  outdoor: [
    'Professionally landscaped yard',
    'Large deck ideal for entertaining',
    'Private, fenced backyard',
    'Low-maintenance xeriscaping',
    'Mature trees and garden areas'
  ],
  efficiency: [
    'Solar panels reduce energy costs',
    'New energy-efficient HVAC system',
    'Dual-pane windows throughout',
    'Tankless water heater',
    'Excellent insulation'
  ],
  smart: [
    'Smart home automation system',
    'Integrated security cameras',
    'Smart thermostat and lighting',
    'EV charging station',
    'Whole-home audio system'
  ],
  value: [
    'Priced below recent comparables',
    'No HOA or low HOA fees',
    'Recent appraisal available',
    'Tax incentives/exemptions',
    'Growing neighborhood value'
  ],
  lifestyle: [
    'Dedicated home office space',
    'Finished basement with wet bar',
    'Primary suite with spa-like bathroom',
    'Walk-in closets and ample storage',
    'Outdoor kitchen and fire pit'
  ]
};

export function AddSellingPointModal({ open, onOpenChange, propertyId, authToken, onSaved }: AddSellingPointModalProps) {
  const [formData, setFormData] = useState({
    category: 'location',
    title: '',
    description: '',
    priority: 'high',
    tags: [] as string[],
    images: [] as string[],
    showInListing: true,
    showInFlyer: true,
    showOnWebsite: true
  });

  const [customTag, setCustomTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCategory = categories.find(c => c.id === formData.category);
  const selectedPriority = priorityLevels.find(p => p.value === formData.priority);
  const suggestions = suggestedPoints[formData.category as keyof typeof suggestedPoints] || [];

  const handleAddTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()]
      }));
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleUseSuggestion = (suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await propertiesApi.createSellingPoint(authToken, propertyId, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        tags: formData.tags,
        showInListing: formData.showInListing,
        showInFlyer: formData.showInFlyer,
        showOnWebsite: formData.showOnWebsite,
      });
      onSaved?.();
      onOpenChange(false);
      setTimeout(() => {
        setFormData({
          category: 'location',
          title: '',
          description: '',
          priority: 'high',
          tags: [],
          images: [],
          showInListing: true,
          showInFlyer: true,
          showOnWebsite: true,
        });
        setSaveError(null);
      }, 300);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save selling point');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.description.trim();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Add Selling Point
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                Highlight a key feature that makes this property stand out
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-white/60 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = formData.category === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: category.id }));
                        setShowSuggestions(false);
                      }}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        isSelected ? category.color : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? '' : 'text-gray-400'}`} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{category.label}</div>
                          <div className={`text-xs mt-0.5 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                            e.g., {category.examples[0]}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title with Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Selling Point Title <span className="text-red-500">*</span>
                </label>
                {suggestions.length > 0 && (
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {showSuggestions ? 'Hide' : 'Show'} Suggestions
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Walking Distance to Top-Rated Schools"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-blue-900 mb-2">Suggested selling points for {selectedCategory?.label}:</div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleUseSuggestion(suggestion)}
                        className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Provide compelling details that will resonate with buyers. Be specific about measurements, dates, brands, or other details that add value..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Tip: Include specific details like dates, measurements, or brand names
                </p>
                <span className="text-xs text-gray-400">
                  {formData.description.length} characters
                </span>
              </div>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {priorityLevels.map((priority) => {
                  const Icon = priority.icon;
                  const isSelected = formData.priority === priority.value;
                  
                  return (
                    <button
                      key={priority.value}
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        isSelected ? priority.color : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'fill-current' : 'text-gray-400'}`} />
                      <div className="font-medium text-sm">{priority.label}</div>
                      <div className={`text-xs mt-1 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                        {priority.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add keywords like 'modern', 'move-in ready', etc."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                Supporting Photos (Optional)
              </label>
              <button className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center gap-3 text-gray-600">
                <ImageIcon className="w-10 h-10 text-gray-400" />
                <div className="text-center">
                  <p className="font-medium">Upload photos that showcase this feature</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click to browse or drag and drop images
                  </p>
                </div>
              </button>
            </div>

            {/* Display Options */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Target className="w-4 h-4 inline mr-1" />
                Where to Display This Selling Point
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showInListing}
                    onChange={(e) => setFormData(prev => ({ ...prev, showInListing: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-sm">MLS Listing Description</div>
                    <div className="text-xs text-gray-600">Include in public listing remarks</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showInFlyer}
                    onChange={(e) => setFormData(prev => ({ ...prev, showInFlyer: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-sm">Property Flyers & Brochures</div>
                    <div className="text-xs text-gray-600">Feature in printed marketing materials</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOnWebsite}
                    onChange={(e) => setFormData(prev => ({ ...prev, showOnWebsite: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-sm">Agent Website & Social Media</div>
                    <div className="text-xs text-gray-600">Show on your website and social posts</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            {formData.title && formData.description && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                      <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{formData.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            selectedPriority?.value === 'high' 
                              ? 'bg-red-100 text-red-800'
                              : selectedPriority?.value === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedPriority?.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{formData.description}</p>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex flex-col gap-3">
            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {!isFormValid && !saveError && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Please fill in all required fields
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Dialog.Close
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Add Selling Point'}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
