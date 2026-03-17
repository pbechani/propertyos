'use client';

import { X, Star, Sparkles, TrendingUp, Award, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface SellingPoint {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface EditSellingPointModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellingPoint: SellingPoint | null;
  onSave?: (sellingPoint: SellingPoint) => void;
}

const priorityOptions = [
  {
    value: 'high' as const,
    label: 'High Priority',
    description: 'Feature prominently in all marketing materials',
    color: 'red',
    icon: Award,
  },
  {
    value: 'medium' as const,
    label: 'Medium Priority',
    description: 'Include in property descriptions and tours',
    color: 'yellow',
    icon: TrendingUp,
  },
  {
    value: 'low' as const,
    label: 'Low Priority',
    description: 'Mention when relevant or asked',
    color: 'blue',
    icon: Sparkles,
  },
];

const exampleSellingPoints = [
  'Recently renovated kitchen with high-end appliances',
  'Prime location near schools and shopping',
  'Energy-efficient systems and solar panels',
  'Spacious outdoor entertaining area',
  'Smart home technology throughout',
  'Walk-in closets and ample storage',
  'Updated bathrooms with modern fixtures',
  'Hardwood floors throughout main level',
];

export function EditSellingPointModal({ open, onOpenChange, sellingPoint, onSave }: EditSellingPointModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  useEffect(() => {
    if (sellingPoint) {
      setFormData({
        title: sellingPoint.title,
        description: sellingPoint.description,
        priority: sellingPoint.priority,
      });
    }
  }, [sellingPoint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellingPoint && onSave) {
      onSave({
        ...sellingPoint,
        ...formData,
      });
    }
    onOpenChange(false);
  };

  const selectedPriority = priorityOptions.find(p => p.value === formData.priority);

  if (!sellingPoint) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Edit Selling Point
                </Dialog.Title>
                <p className="text-sm text-gray-600">
                  Update key features that make this property stand out
                </p>
              </div>
            </div>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-140px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Priority Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Priority Level *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {priorityOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = formData.priority === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: option.value })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `border-${option.color}-500 bg-${option.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSelected
                                ? `bg-${option.color}-500`
                                : 'bg-gray-100'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                isSelected ? 'text-white' : 'text-gray-500'
                              }`}
                            />
                          </div>
                          <div>
                            <div className={`font-semibold text-sm ${
                              isSelected ? `text-${option.color}-900` : 'text-gray-900'
                            }`}>
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selling Point Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Point Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Prime Location, Recently Renovated Kitchen"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Keep it concise and compelling - this appears in marketing materials
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Provide specific details that will appeal to buyers..."
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {formData.description.length} characters
                  </p>
                  <p className="text-xs text-gray-500">
                    Be specific - include numbers, dates, and unique features
                  </p>
                </div>
              </div>

              {/* Writing Tips */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-purple-900 mb-2">Writing Effective Selling Points</h4>
                    <ul className="text-sm text-purple-800 space-y-1.5">
                      <li>✓ Use specific numbers and measurements (e.g., "2,500 sq ft" not "spacious")</li>
                      <li>✓ Include recent upgrades with dates and costs (e.g., "Kitchen renovated 2025 - $45k")</li>
                      <li>✓ Highlight unique features that competitors don't have</li>
                      <li>✓ Focus on buyer benefits, not just features (e.g., "Walk to 5 restaurants")</li>
                      <li>✓ Add emotional appeal while staying factual</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Example Selling Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Need Inspiration? Click to use these examples:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {exampleSellingPoints.map((example, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, title: example })}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-sm text-left text-gray-700 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhancement Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Description Enhancements
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      description: formData.description + '\n\nKey Features:\n• \n• \n• ' 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Key Features List
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      description: formData.description + '\n\nBuyer Benefits:\n• \n• ' 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Buyer Benefits
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      description: formData.description + '\n\nRecent Updates: ' 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Recent Updates
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      description: formData.description + '\n\nWarranty/Guarantee: ' 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Warranty Info
                  </button>
                </div>
              </div>

              {/* Preview Card */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview (How it will appear)
                </label>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                      <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {formData.title || 'Your Selling Point Title'}
                        </h3>
                        {selectedPriority && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${selectedPriority.color}-100 text-${selectedPriority.color}-800`}>
                            {selectedPriority.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {formData.description || 'Your detailed description will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
