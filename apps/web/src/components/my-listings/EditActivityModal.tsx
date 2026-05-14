'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Calendar,
  Clock,
  CheckSquare,
  Users,
  Star,
  Phone,
  FileText,
  Home,
  DollarSign,
  Bell,
  AlertCircle,
  Repeat,
  MapPin,
  Paperclip,
  User,
  CheckCircle2,
  Sparkles,
  Trash2,
  Archive,
  Copy,
  History,
  Save
} from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  status: 'completed' | 'pending' | 'scheduled' | 'in-progress';
  category: string;
  priority?: string;
  assignedTo?: string;
  location?: string;
  recurrence?: string;
  reminderBefore?: string;
  notifyAssignee?: boolean;
}

interface EditActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
}

const activityTypes = [
  {
    id: 'client-relations',
    label: 'Client Relations',
    icon: Users,
    color: 'bg-purple-50 border-purple-500 text-purple-700',
    activities: [
      'Send closing gift',
      'Thank you card',
      '30-day follow-up call',
      '90-day check-in',
      'Anniversary card',
      'Holiday greeting'
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Star,
    color: 'bg-pink-50 border-pink-500 text-pink-700',
    activities: [
      'Request review/testimonial',
      'Update portfolio',
      'Social media post',
      'Case study',
      'Before/after photos'
    ]
  },
  {
    id: 'administrative',
    label: 'Administrative',
    icon: FileText,
    color: 'bg-blue-50 border-blue-500 text-blue-700',
    activities: [
      'Update MLS status',
      'Remove yard sign',
      'Remove lockbox',
      'File documents',
      'Update CRM'
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: DollarSign,
    color: 'bg-green-50 border-green-500 text-green-700',
    activities: [
      'Commission processing',
      'Referral fee payment',
      'Expense reconciliation',
      'Tax documentation'
    ]
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: Phone,
    color: 'bg-orange-50 border-orange-500 text-orange-700',
    activities: [
      'Follow-up call',
      'Send email update',
      'Schedule meeting',
      'Client check-in'
    ]
  },
  {
    id: 'property',
    label: 'Property Related',
    icon: Home,
    color: 'bg-indigo-50 border-indigo-500 text-indigo-700',
    activities: [
      'Property inspection',
      'Maintenance reminder',
      'Service provider referral',
      'Home warranty follow-up'
    ]
  },
  {
    id: 'custom',
    label: 'Custom Activity',
    icon: CheckSquare,
    color: 'bg-gray-50 border-gray-500 text-gray-700',
    activities: []
  }
];

const priorityLevels = [
  {
    value: 'high',
    label: 'High',
    description: 'Urgent, must do soon',
    color: 'bg-red-50 border-red-500 text-red-700',
    icon: AlertCircle
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Important, normal timeline',
    color: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    icon: CheckCircle2
  },
  {
    value: 'low',
    label: 'Low',
    description: 'Nice to have, flexible timing',
    color: 'bg-blue-50 border-blue-500 text-blue-700',
    icon: CheckSquare
  }
];

const statusOptions = [
  { value: 'pending', label: 'Pending', description: 'Not started yet', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'scheduled', label: 'Scheduled', description: 'Planned for specific date', color: 'bg-blue-100 text-blue-800' },
  { value: 'in-progress', label: 'In Progress', description: 'Currently working on it', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completed', description: 'Task finished', color: 'bg-green-100 text-green-800' }
];

const recurrenceOptions = [
  { value: 'none', label: 'None (One-time)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (every 3 months)' },
  { value: 'yearly', label: 'Yearly (anniversary)' }
];

export function EditActivityModal({ open, onOpenChange, activity }: EditActivityModalProps) {
  const [formData, setFormData] = useState({
    activityType: activity?.category || 'client-relations',
    title: activity?.title || '',
    description: activity?.description || '',
    dueDate: activity?.dueDate || '',
    dueTime: activity?.dueTime || '',
    priority: activity?.priority || 'medium',
    status: activity?.status || 'scheduled',
    assignedTo: activity?.assignedTo || '',
    location: activity?.location || '',
    recurrence: activity?.recurrence || 'none',
    reminderBefore: activity?.reminderBefore || '1-day',
    notifyAssignee: activity?.notifyAssignee ?? true,
    attachments: [] as string[]
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        activityType: activity.category || 'client-relations',
        title: activity.title || '',
        description: activity.description || '',
        dueDate: activity.dueDate || '',
        dueTime: activity.dueTime || '',
        priority: activity.priority || 'medium',
        status: activity.status || 'scheduled',
        assignedTo: activity.assignedTo || '',
        location: activity.location || '',
        recurrence: activity.recurrence || 'none',
        reminderBefore: activity.reminderBefore || '1-day',
        notifyAssignee: activity.notifyAssignee ?? true,
        attachments: []
      });
      setHasChanges(false);
    }
  }, [activity]);

  const selectedType = activityTypes.find(t => t.id === formData.activityType);
  const selectedPriority = priorityLevels.find(p => p.value === formData.priority);
  const selectedStatus = statusOptions.find(s => s.value === formData.status);

  const handleChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSubmit = () => {
    console.log('Updating activity:', { id: activity?.id, ...formData });
    onOpenChange(false);
    setHasChanges(false);
  };

  const handleDelete = () => {
    console.log('Deleting activity:', activity?.id);
    onOpenChange(false);
    setShowDeleteConfirm(false);
  };

  const handleDuplicate = () => {
    console.log('Duplicating activity:', { ...formData, id: 'new' });
    onOpenChange(false);
  };

  const handleArchive = () => {
    console.log('Archiving activity:', activity?.id);
    onOpenChange(false);
  };

  const isFormValid = formData.title.trim() && formData.dueDate;

  if (!activity) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Edit Activity
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  Modify activity details and settings
                  {hasChanges && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                      Unsaved changes
                    </span>
                  )}
                </Dialog.Description>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <button
                onClick={handleDuplicate}
                className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Duplicate activity"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleArchive}
                className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Archive activity"
              >
                <Archive className="w-5 h-5 text-gray-600" />
              </button>
              <Dialog.Close className="p-2 hover:bg-indigo-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Activity Info Bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <History className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">Activity Information</div>
                    <p className="text-sm text-blue-700 mt-1">
                      Created on {new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedStatus?.color}`}>
                  {selectedStatus?.label}
                </span>
              </div>
            </div>

            {/* Activity Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Activity Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.activityType === type.id;
                  
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleChange({ activityType: type.id })}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        isSelected ? type.color : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium">{type.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activity Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange({ title: e.target.value })}
                placeholder="e.g., Send thank you card to sellers"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange({ description: e.target.value })}
                rows={3}
                placeholder="Add details about this activity, specific instructions, or notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Date, Time, Status in Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange({ dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Due Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time (Optional)
                </label>
                <select
                  value={formData.dueTime}
                  onChange={(e) => handleChange({ dueTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange({ status: e.target.value as 'pending' | 'scheduled' | 'in-progress' | 'completed' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {priorityLevels.map((priority) => {
                  const Icon = priority.icon;
                  const isSelected = formData.priority === priority.value;
                  
                  return (
                    <button
                      key={priority.value}
                      onClick={() => handleChange({ priority: priority.value })}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        isSelected ? priority.color : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                      <div className="font-medium text-sm">{priority.label}</div>
                      <div className={`text-xs mt-1 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                        {priority.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-2 gap-4">
              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Assigned To (Optional)
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleChange({ assignedTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Me (default)</option>
                  <option value="assistant">My Assistant</option>
                  <option value="team-member-1">Sarah Johnson</option>
                  <option value="team-member-2">Mike Chen</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange({ location: e.target.value })}
                  placeholder="Property address, office, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Repeat className="w-4 h-4 inline mr-1" />
                Recurrence
              </label>
              <select
                value={formData.recurrence}
                onChange={(e) => handleChange({ recurrence: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {recurrenceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formData.recurrence !== 'none' && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  This activity will automatically repeat {formData.recurrence}
                </p>
              )}
            </div>

            {/* Reminder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Bell className="w-4 h-4 inline mr-1" />
                Reminder
              </label>
              <select
                value={formData.reminderBefore}
                onChange={(e) => handleChange({ reminderBefore: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">No reminder</option>
                <option value="same-day">Same day at 9:00 AM</option>
                <option value="1-day">1 day before</option>
                <option value="2-days">2 days before</option>
                <option value="1-week">1 week before</option>
              </select>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Paperclip className="w-4 h-4 inline mr-1" />
                Attachments (Optional)
              </label>
              <button className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 text-gray-600">
                <Paperclip className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium">Attach files or documents</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click to browse or drag and drop
                  </p>
                </div>
              </button>
            </div>

            {/* Notification Options */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Notifications
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyAssignee}
                    onChange={(e) => handleChange({ notifyAssignee: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-medium text-sm">Notify assignee of changes</div>
                    <div className="text-xs text-gray-600">Send email notification about updates</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            {formData.title && formData.dueDate && hasChanges && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Updated Preview</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedType?.color.replace('border-', 'border-0 ')
                      }`}>
                        {selectedType && <selectedType.icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{formData.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            selectedPriority?.color.replace('border-', 'border-0 ')
                          }`}>
                            {selectedPriority?.label} Priority
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedStatus?.color}`}>
                            {selectedStatus?.label}
                          </span>
                        </div>
                        {formData.description && (
                          <p className="text-sm text-gray-600 mb-2">{formData.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(formData.dueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                            {formData.dueTime && ` at ${formData.dueTime}`}
                          </span>
                          {formData.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {formData.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Activity
              </button>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {!isFormValid && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Please fill in all required fields
                  </span>
                )}
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">Delete this activity?</h4>
                    <p className="text-sm text-red-700 mb-3">
                      This action cannot be undone. The activity and all its data will be permanently removed.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                {hasChanges ? 'Discard Changes' : 'Close'}
              </Dialog.Close>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}