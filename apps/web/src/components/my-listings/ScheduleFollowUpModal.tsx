'use client';

import { useState } from 'react';
import {
  X,
  Calendar,
  Bell,
  Phone,
  Mail,
  MessageSquare,
  Coffee,
  Home,
  FileText,
  CheckCircle2,
  Users,
  MapPin,
  Repeat,
} from 'lucide-react';
import { leadsApi, type LeadRow } from '@/lib/api-client';

interface Props {
  lead: LeadRow;
  authToken: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type FollowUpType = 'call' | 'email' | 'sms' | 'meeting' | 'viewing' | 'other';
type Priority = 'high' | 'medium' | 'low';

const followUpTypes = [
  { value: 'call',    label: 'Phone Call',        icon: Phone,        color: 'bg-blue-100 text-blue-700' },
  { value: 'email',   label: 'Email',              icon: Mail,         color: 'bg-purple-100 text-purple-700' },
  { value: 'sms',     label: 'SMS',                icon: MessageSquare,color: 'bg-green-100 text-green-700' },
  { value: 'meeting', label: 'In-Person Meeting',  icon: Coffee,       color: 'bg-orange-100 text-orange-700' },
  { value: 'viewing', label: 'Property Viewing',   icon: Home,         color: 'bg-pink-100 text-pink-700' },
  { value: 'other',   label: 'Other',              icon: FileText,     color: 'bg-gray-100 text-gray-700' },
] as const;

export function ScheduleFollowUpModal({ lead, authToken, onClose, onSuccess }: Props) {
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [date, setDate]                 = useState('');
  const [time, setTime]                 = useState('');
  const [duration, setDuration]         = useState('30');
  const [priority, setPriority]         = useState<Priority>('medium');
  const [subject, setSubject]           = useState('');
  const [notes, setNotes]               = useState('');
  const [location, setLocation]         = useState('');
  const [isRecurring, setIsRecurring]   = useState(false);
  const [recurringPattern, setRecurringPattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState('15');
  const [inviteOthers, setInviteOthers] = useState(false);
  const [invitees, setInvitees]         = useState('');

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const selectedTypeCfg = followUpTypes.find((t) => t.value === followUpType);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const followUpAt = date && time ? new Date(`${date}T${time}`).toISOString() : null;

      const descParts = [
        `Follow-up scheduled: ${subject}`,
        `Type: ${selectedTypeCfg?.label}`,
        `Priority: ${priority}`,
        followUpAt ? `Date/Time: ${new Date(followUpAt).toLocaleString()}` : null,
        `Duration: ${duration} min`,
        location ? `Location: ${location}` : null,
        isRecurring ? `Recurring: ${recurringPattern}` : null,
        reminderEnabled ? `Reminder: ${reminderMinutes} min before` : null,
        inviteOthers && invitees ? `Invitees: ${invitees}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join(' | ');

      await leadsApi.createActivity(authToken, lead.id, {
        type: followUpType === 'viewing' ? 'viewing' : followUpType === 'meeting' ? 'meeting' : followUpType,
        description: descParts,
        ...(followUpAt ? { metadata: { scheduled_at: followUpAt } } : {}),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule follow-up');
    } finally {
      setSaving(false);
    }
  };

  const isValid = !!date && !!time && !!subject;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Schedule Follow-Up</h2>
                <p className="text-sm text-gray-600 mt-0.5">with {lead.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Follow-up Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Follow-Up Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {followUpTypes.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setFollowUpType(value)}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    followUpType === value ? `${color} border-current` : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${followUpType === value ? '' : 'text-gray-400'}`} />
                  <div className={`text-xs font-medium text-center ${followUpType === value ? '' : 'text-gray-900'}`}>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject / Title *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`e.g., Follow up on ${selectedTypeCfg?.label.toLowerCase()}`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Duration & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Location — only for meeting/viewing */}
          {(followUpType === 'meeting' || followUpType === 'viewing') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter meeting location or property address"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any notes or talking points for this follow-up…"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            {/* Recurring */}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Recurring Follow-Up</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">Schedule this follow-up to repeat automatically</p>
                {isRecurring && (
                  <select
                    value={recurringPattern}
                    onChange={(e) => setRecurringPattern(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>
            </label>

            {/* Reminder */}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Set Reminder</span>
                </div>
                <p className="text-xs text-blue-700 mt-0.5">Get notified before this follow-up</p>
                {reminderEnabled && (
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="5">5 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="1440">1 day before</option>
                  </select>
                )}
              </div>
            </label>

            {/* Invite Others */}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors">
              <input
                type="checkbox"
                checked={inviteOthers}
                onChange={(e) => setInviteOthers(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Invite Team Members</span>
                </div>
                <p className="text-xs text-purple-700 mt-0.5">Add other agents or team members</p>
                {inviteOthers && (
                  <input
                    type="text"
                    value={invitees}
                    onChange={(e) => setInvitees(e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    className="mt-2 w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  />
                )}
              </div>
            </label>
          </div>

          {/* Live summary */}
          {isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <strong>{subject}</strong> scheduled for{' '}
                  <strong>
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </strong>{' '}
                  at <strong>{time}</strong> ({duration} minutes)
                  {reminderEnabled ? ` with a reminder ${reminderMinutes} min before` : ''}.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            {saving ? 'Scheduling…' : 'Schedule Follow-Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
