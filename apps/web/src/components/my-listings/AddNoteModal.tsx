'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  StickyNote,
  Pin,
  Clock,
  User,
  Users,
  Bell,
  Lock,
  FileText,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Home,
  Calendar,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  Info,
  Paperclip,
  Plus,
  Hash,
  Sparkles,
  Save
} from 'lucide-react';
import { propertiesApi } from '@/lib/api-client';

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  authToken: string;
  onSaved?: () => void;
}

const noteCategories = [
  { 
    id: 'important', 
    label: 'Important', 
    icon: AlertCircle,
    color: 'bg-red-50 border-red-500 text-red-700',
    description: 'Critical information'
  },
  { 
    id: 'property-details', 
    label: 'Property Details', 
    icon: Home,
    color: 'bg-blue-50 border-blue-500 text-blue-700',
    description: 'Features & specifications'
  },
  { 
    id: 'pricing', 
    label: 'Pricing', 
    icon: DollarSign,
    color: 'bg-green-50 border-green-500 text-green-700',
    description: 'Strategy & negotiations'
  },
  { 
    id: 'feedback', 
    label: 'Feedback', 
    icon: MessageSquare,
    color: 'bg-purple-50 border-purple-500 text-purple-700',
    description: 'Buyer & showing comments'
  },
  { 
    id: 'timeline', 
    label: 'Timeline', 
    icon: Calendar,
    color: 'bg-orange-50 border-orange-500 text-orange-700',
    description: 'Deadlines & milestones'
  },
  { 
    id: 'issues', 
    label: 'Issues & Concerns', 
    icon: AlertTriangle,
    color: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    description: 'Problems to address'
  },
  { 
    id: 'ideas', 
    label: 'Ideas & Strategy', 
    icon: Lightbulb,
    color: 'bg-indigo-50 border-indigo-500 text-indigo-700',
    description: 'Marketing & tactics'
  },
  { 
    id: 'general', 
    label: 'General', 
    icon: FileText,
    color: 'bg-gray-50 border-gray-500 text-gray-700',
    description: 'Miscellaneous notes'
  }
];

const visibilityOptions = [
  {
    id: 'private',
    label: 'Private',
    description: 'Only visible to you',
    icon: Lock
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Share with your team',
    icon: Users
  },
  {
    id: 'client',
    label: 'Client',
    description: 'Visible to client',
    icon: User
  }
];

const quickTemplates = [
  {
    category: 'property-details',
    templates: [
      'Recent upgrades include...',
      'Property highlights: ',
      'Special features worth noting: '
    ]
  },
  {
    category: 'pricing',
    templates: [
      'Pricing strategy: Listed at $XXX based on...',
      'Comparable properties in the area...',
      'Room to negotiate: '
    ]
  },
  {
    category: 'feedback',
    templates: [
      'Showing feedback from [date]: ',
      'Common buyer concerns: ',
      'Positive reactions to: '
    ]
  },
  {
    category: 'timeline',
    templates: [
      'Important deadline: [date] - ',
      'Next steps: ',
      'Follow up required by: '
    ]
  },
  {
    category: 'issues',
    templates: [
      'Issue identified: ',
      'Action required: ',
      'Seller needs to address: '
    ]
  }
];

export function AddNoteModal({ open, onOpenChange, propertyId, authToken, onSaved }: AddNoteModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPinned: false,
    visibility: 'private',
    tags: [] as string[],
    mentions: [] as string[],
    reminder: '',
    attachments: [] as string[]
  });

  const [customTag, setCustomTag] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedCategory = noteCategories.find(c => c.id === formData.category);
const templates = quickTemplates.find(t => t.category === formData.category)?.templates || [];

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

  const handleUseTemplate = (template: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${template}` : template
    }));
    setShowTemplates(false);
  };

  const handleSubmit = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      await propertiesApi.createNote(authToken, propertyId, {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        isPinned: formData.isPinned,
        visibility: formData.visibility,
        tags: formData.tags,
        reminder: formData.reminder || null,
      });
      onSaved?.();
      onOpenChange(false);
      setTimeout(() => {
        setFormData({
          title: '',
          content: '',
          category: 'general',
          isPinned: false,
          visibility: 'private',
          tags: [],
          mentions: [],
          reminder: '',
          attachments: [],
        });
        setSaveError(null);
      }, 300);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.content.trim();
  const wordCount = formData.content.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <StickyNote className="w-6 h-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Add Note
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                  Capture important information about this listing
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="p-2 hover:bg-white/60 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-800 flex-1">
                Notes help you track important details, feedback, and action items for this listing
              </p>
              {templates.length > 0 && (
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  {showTemplates ? 'Hide' : 'Templates'}
                </button>
              )}
            </div>

            {/* Templates */}
            {showTemplates && templates.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Quick Templates for {selectedCategory?.label}
                </h4>
                <div className="space-y-2">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleUseTemplate(template)}
                      className="w-full text-left px-4 py-2 bg-white hover:bg-purple-50 border border-purple-200 rounded-lg text-sm transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Seller Motivation, Pricing Strategy, Recent Upgrades..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                autoFocus
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {noteCategories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = formData.category === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: category.id }));
                        setShowTemplates(false);
                      }}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        isSelected ? category.color : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      title={category.description}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium text-center">{category.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                placeholder="Write your note here... You can use @mentions and #tags"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Use @ to mention team members</span>
                  <span>•</span>
                  <span>Use # for quick tags</span>
                </div>
                <span className="text-xs text-gray-400">
                  {wordCount} word{wordCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Pin and Visibility */}
            <div className="grid grid-cols-2 gap-4">
              {/* Pin Option */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-medium text-sm text-yellow-900">
                      <Pin className="w-4 h-4" />
                      Pin this note
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Keep at the top for easy access
                    </p>
                  </div>
                </label>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {visibilityOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
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
                  placeholder="Add tags for easy filtering..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Suggested Tags */}
              <div className="flex flex-wrap gap-2 mb-2">
                {['urgent', 'follow-up', 'client-request', 'action-needed', 'review'].map((suggestedTag) => (
                  !formData.tags.includes(suggestedTag) && (
                    <button
                      key={suggestedTag}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tags: [...prev.tags, suggestedTag]
                        }));
                      }}
                      className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
                    >
                      + {suggestedTag}
                    </button>
                  )
                ))}
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Reminder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Bell className="w-4 h-4 inline mr-1" />
                Set Reminder (Optional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.reminder}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>No reminder</option>
                  <option>9:00 AM</option>
                  <option>12:00 PM</option>
                  <option>3:00 PM</option>
                  <option>5:00 PM</option>
                </select>
              </div>
              {formData.reminder && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  You'll be reminded about this note on {new Date(formData.reminder).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Paperclip className="w-4 h-4 inline mr-1" />
                Attachments (Optional)
              </label>
              <button className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 text-gray-600">
                <Paperclip className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium">Attach files or photos</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click to browse or drag and drop
                  </p>
                </div>
              </button>
            </div>

            {/* Preview */}
            {formData.title && formData.content && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Preview</h3>
                </div>
                <div className={`${formData.isPinned ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{formData.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            selectedCategory?.color.replace('border-', 'border-0 ')
                          }`}>
                            {selectedCategory?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      {formData.isPinned && (
                        <Pin className={`w-4 h-4 text-yellow-700 fill-yellow-700`} />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.content}</p>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {formData.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {!isFormValid && !saveError && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Title and content are required
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
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
