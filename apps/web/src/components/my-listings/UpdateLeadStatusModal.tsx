'use client';

import { useState } from 'react';
import {
  X,
  Zap,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  MessageCircle,
  Tag,
} from 'lucide-react';
import { leadsApi, type LeadRow, type UpdateLeadPayload } from '@/lib/api-client';

interface Props {
  lead: LeadRow;
  authToken: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type StatusOption = {
  value: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  /** Maps to API fields */
  temperature?: string;
  stage: string;
};

const statusOptions: StatusOption[] = [
  {
    value: 'new',
    label: 'New Lead',
    description: 'Just received, needs initial contact',
    icon: AlertCircle,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    stage: 'new',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    description: 'Initial contact made, gathering information',
    icon: MessageCircle,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    stage: 'contacted',
  },
  {
    value: 'qualified',
    label: 'Qualified',
    description: 'Budget and needs confirmed, ready to show properties',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-700 border-green-200',
    stage: 'qualified',
  },
  {
    value: 'nurturing',
    label: 'Nurturing',
    description: 'Interested but timeline is longer term',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    temperature: 'nurture',
    stage: 'contacted',
  },
  {
    value: 'hot',
    label: 'Hot Lead',
    description: 'Highly engaged, ready to make a decision soon',
    icon: Zap,
    color: 'bg-red-100 text-red-700 border-red-200',
    temperature: 'hot',
    stage: 'active',
  },
  {
    value: 'cold',
    label: 'Cold',
    description: 'Low engagement, minimal response',
    icon: TrendingDown,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    temperature: 'cold',
    stage: 'contacted',
  },
  {
    value: 'converted',
    label: 'Converted',
    description: 'Successfully converted to active client',
    icon: Award,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    stage: 'closed',
  },
  {
    value: 'lost',
    label: 'Lost',
    description: 'No longer pursuing this opportunity',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    stage: 'lost',
  },
];

const lostReasons = [
  'Chose another agent',
  'Bought through another channel',
  'Budget constraints',
  'Timeline changed',
  'Lost interest',
  'Property not available',
  'Other',
];

function currentStatusValue(lead: LeadRow): string {
  if (lead.stage === 'closed') return 'converted';
  if (lead.stage === 'lost') return 'lost';
  if (lead.temperature === 'hot') return 'hot';
  if (lead.temperature === 'cold') return 'cold';
  if (lead.temperature === 'nurture') return 'nurturing';
  if (lead.stage === 'qualified') return 'qualified';
  if (lead.stage === 'contacted') return 'contacted';
  return 'new';
}

export function UpdateLeadStatusModal({ lead, authToken, onClose, onSuccess }: Props) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatusValue(lead));
  const [lostReason, setLostReason] = useState(lead.lost_reason ?? '');
  const [notes, setNotes] = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !newTags.includes(trimmed)) {
      setNewTags([...newTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => setNewTags(newTags.filter((t) => t !== tag));

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const option = statusOptions.find((s) => s.value === selectedStatus)!;
      const payload: UpdateLeadPayload = { stage: option.stage as UpdateLeadPayload['stage'] };
      if (option.temperature) payload.temperature = option.temperature;
      if (selectedStatus === 'lost' && lostReason) payload.lostReason = lostReason;
      if (scheduleFollowUp && followUpDate) payload.nextFollowUp = followUpDate;
      if (notes.trim()) {
        // Append notes separately as an activity
        await leadsApi.createActivity(authToken, lead.id, {
          type: 'note',
          description: `Status changed to ${option.label}${notes ? `: ${notes}` : ''}`,
        });
      }
      await leadsApi.update(authToken, lead.id, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = statusOptions.find((s) => s.value === selectedStatus)!;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Update Lead Status</h2>
              <p className="text-sm text-gray-500 mt-1">{lead.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Lead Status</label>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions.map((status) => {
                const Icon = status.icon;
                const isSelected = selectedStatus === status.value;
                return (
                  <button
                    key={status.value}
                    onClick={() => setSelectedStatus(status.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected ? `${status.color} border-current` : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? '' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-medium ${isSelected ? '' : 'text-gray-900'}`}>{status.label}</div>
                        <div className={`text-xs mt-1 ${isSelected ? 'opacity-90' : 'text-gray-500'}`}>
                          {status.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lost Reason */}
          {selectedStatus === 'lost' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Lost Lead</label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a reason…</option>
                {lostReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Tags</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type a tag and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            {newTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any additional notes about this status change..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Schedule Follow-up */}
          {selectedStatus !== 'lost' && selectedStatus !== 'converted' && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleFollowUp}
                  onChange={(e) => setScheduleFollowUp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Schedule follow-up reminder</span>
              </label>
              {scheduleFollowUp && (
                <div className="mt-3 ml-7">
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                This lead will be marked as <strong>{selectedOption.label}</strong>
                {scheduleFollowUp && followUpDate && (
                  <>
                    {' '}with a follow-up reminder on{' '}
                    <strong>
                      {new Date(followUpDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </strong>
                  </>
                )}
                .
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Saving…' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
