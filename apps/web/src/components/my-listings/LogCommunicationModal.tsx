'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  MessageSquare,
  Video,
  PhoneOutgoing,
  PhoneIncoming,
  Send,
  MailOpen,
  CheckCircle2,
  User,
  Clock,
  Calendar,
  FileText,
  Tag,
  AlertCircle,
  Users
} from 'lucide-react';
import { propertiesApi } from '@/lib/api-client';

interface LogCommunicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  authToken: string;
  onLogged?: (entry: LoggedCommunication) => void;
}

export interface LoggedCommunication {
  type: string;
  contact: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  subject: string;
  summary: string;
  date: string;
  time: string;
  duration: string;
  outcome: string;
  followUpRequired: boolean;
  followUpDetails: string;
  followUpDate: string;
  tags: string[];
}

const communicationTypes = [
  { id: 'call-out', label: 'Outgoing Call', icon: PhoneOutgoing, color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'call-in', label: 'Incoming Call', icon: PhoneIncoming, color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'email-sent', label: 'Email Sent', icon: Send, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'email-received', label: 'Email Received', icon: MailOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'text', label: 'Text Message', icon: MessageSquare, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'video-call', label: 'Video Call', icon: Video, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'in-person', label: 'In-Person Meeting', icon: Users, color: 'text-orange-600 bg-orange-50 border-orange-200' }
];

const outcomeOptions = [
  'Positive - Very interested',
  'Positive - Offer coming',
  'Positive - Follow-up scheduled',
  'Neutral - Informational',
  'Neutral - Awaiting response',
  'Needs attention - Urgent follow-up required',
  'Needs attention - Pricing concerns',
  'Negative - Not interested'
];

export function LogCommunicationModal({ open, onOpenChange, propertyId, authToken, onLogged }: LogCommunicationModalProps) {
  const [formData, setFormData] = useState({
    type: 'call-out',
    contact: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: '',
    subject: '',
    summary: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    duration: '',
    outcome: '',
    followUpRequired: false,
    followUpDetails: '',
    followUpDate: '',
    tags: [] as string[],
    attachments: [] as string[]
  });

  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      type: 'call-out',
      contact: '',
      contactRole: '',
      contactEmail: '',
      contactPhone: '',
      subject: '',
      summary: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: '',
      outcome: '',
      followUpRequired: false,
      followUpDetails: '',
      followUpDate: '',
      tags: [],
      attachments: [],
    });
    setSaveError(null);
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleSubmit = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      const communicationDate = `${formData.date}T${formData.time}:00.000Z`;
      const saved = await propertiesApi.createCommunicationLog(authToken, propertyId, {
        type: formData.type,
        contactName: formData.contact,
        contactRole: formData.contactRole || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null,
        subject: formData.subject,
        summary: formData.summary,
        communicationDate,
        duration: formData.duration || null,
        outcome: formData.outcome || null,
        followUpRequired: formData.followUpRequired,
        followUpDetails: formData.followUpDetails || null,
        followUpDate: formData.followUpDate || null,
        tags: formData.tags,
      });
      if (onLogged) {
        onLogged(saved as unknown as LoggedCommunication);
      }
      onOpenChange(false);
      resetForm();
    } catch {
      setSaveError('Failed to save communication log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = formData.contact && formData.subject && formData.summary;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-xl font-semibold">Log Communication</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                Record all interactions related to this listing
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Communication Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Communication Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {communicationTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleInputChange('type', type.id)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        formData.type === type.id
                          ? `${type.color} border-current`
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${formData.type === type.id ? '' : 'text-gray-400'}`} />
                        <span className={`font-medium text-sm ${formData.type === type.id ? '' : 'text-gray-700'}`}>
                          {type.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    placeholder="Enter contact name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role/Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.contactRole}
                    onChange={(e) => handleInputChange('contactRole', e.target.value)}
                    placeholder="e.g., Prospective Buyer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-3 gap-4">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(formData.type.includes('call') || formData.type === 'video-call' || formData.type === 'in-person') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="e.g., 15 min"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject/Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Brief subject line describing the communication"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Summary/Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={5}
                placeholder="Detailed notes about the conversation, key points discussed, questions asked, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outcome/Result
              </label>
              <select
                value={formData.outcome}
                onChange={(e) => handleInputChange('outcome', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select outcome...</option>
                {outcomeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Follow-up Required */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.followUpRequired}
                  onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Follow-up Required</div>
                  <div className="text-sm text-gray-600">Set a reminder for follow-up action</div>
                </div>
              </label>

              {formData.followUpRequired && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Details
                    </label>
                    <input
                      type="text"
                      value={formData.followUpDetails}
                      onChange={(e) => handleInputChange('followUpDetails', e.target.value)}
                      placeholder="What needs to be done?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
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
                  placeholder="Add tag..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Add
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
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
            {saveError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{saveError}</span>
              </div>
            )}
            {!saveError && !isValid && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>Please fill in all required fields</span>
              </div>
            )}
            {!saveError && isValid && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready to log communication</span>
              </div>
            )}
            <div className="flex gap-3">
              <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </Dialog.Close>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isSaving ? 'Saving…' : 'Log Communication'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
