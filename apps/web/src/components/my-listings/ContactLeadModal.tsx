'use client';

import { useState, useRef } from 'react';
import { X, Phone, Mail, MessageSquare, Send, Paperclip, Smile } from 'lucide-react';
import { leadsApi, type LeadRow, type CreateLeadActivityPayload } from '@/lib/api-client';

interface Props {
  lead: LeadRow;
  authToken: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type ContactMethod = 'email' | 'call' | 'sms';

const emailTemplates = [
  {
    id: '1',
    name: 'Initial Follow-up',
    subject: 'Great meeting you!',
    body: `Hi [Name],

It was wonderful speaking with you about your home search. I wanted to follow up and see if you had any questions about the properties we discussed.

I've attached some additional listings that match your criteria. Let me know if you'd like to schedule viewings.

Best regards`,
  },
  {
    id: '2',
    name: 'Property Match Alert',
    subject: 'New Property Matches Your Criteria',
    body: `Hi [Name],

I found some exciting new properties that match exactly what you're looking for. These just hit the market and I wanted to make sure you saw them first.

Would you be available this week for a viewing?

Best regards`,
  },
  {
    id: '3',
    name: 'Check-in',
    subject: 'Checking in on your home search',
    body: `Hi [Name],

I wanted to check in and see how your home search is progressing. Have your needs or timeline changed at all?

I'm here to help whenever you're ready to take the next steps.

Best regards`,
  },
];

const smsTemplates = [
  'Hi [Name], just wanted to check in on your home search. Any questions I can help with?',
  'Hi [Name], found some great properties that match your criteria. When can we schedule viewings?',
  "Hi [Name], following up from our last conversation. Let me know when you're available to chat!",
  'Quick reminder about our scheduled viewing tomorrow. Looking forward to it!',
];

export function ContactLeadModal({ lead, authToken, onClose, onSuccess }: Props) {
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firstName = lead.name.split(' ')[0];

  const handleSelectTemplate = (template: (typeof emailTemplates)[0]) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body.replace('[Name]', firstName));
  };

  const handleSelectSmsTemplate = (template: string) => {
    setSmsMessage(template.replace('[Name]', firstName));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      let description = '';
      let activityType = contactMethod;

      if (contactMethod === 'email') {
        if (!lead.email) {
          setError('This lead has no email address on file.');
          setSaving(false);
          return;
        }
        await leadsApi.sendEmail(authToken, lead.id, {
          subject: emailSubject || '(no subject)',
          body: emailBody,
        });
        description = emailSubject ? `Email: ${emailSubject}` : 'Email sent';
        if (emailBody) description += `\n\n${emailBody}`;
        if (attachedFiles.length > 0) {
          description += `\n\nAttachments: ${attachedFiles.map((f) => f.name).join(', ')}`;
        }
        // sendEmail already logs the activity on the backend — skip duplicate log
        if (scheduleFollowUp && followUpDate) {
          await leadsApi.update(authToken, lead.id, { nextFollowUp: followUpDate });
        }
        onSuccess?.();
        onClose();
        return;
      } else if (contactMethod === 'sms') {
        description = smsMessage || 'SMS sent';
        activityType = 'sms';
      } else {
        description = callNotes || 'Phone call made';
        activityType = 'call';
      }

      const payload: CreateLeadActivityPayload = { type: activityType, description };
      await leadsApi.createActivity(authToken, lead.id, payload);

      if (scheduleFollowUp && followUpDate) {
        await leadsApi.update(authToken, lead.id, { nextFollowUp: followUpDate });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Contact Lead</h2>
              <p className="text-sm text-gray-500 mt-1">{lead.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Contact Method Tabs */}
          <div className="flex gap-2 mt-4">
            {(['email', 'call', 'sms'] as ContactMethod[]).map((method) => {
              const Icon = method === 'email' ? Mail : method === 'call' ? Phone : MessageSquare;
              const label = method === 'email' ? 'Email' : method === 'call' ? 'Phone Call' : 'SMS';
              return (
                <button
                  key={method}
                  onClick={() => setContactMethod(method)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    contactMethod === method
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {contactMethod === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                <div className="flex flex-wrap gap-2">
                  {emailTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {lead.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {lead.email}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  Attach Files
                </button>
                {attachedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                        <span className="text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {contactMethod === 'call' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Ready to call {lead.name}?</span>
                </div>
                {lead.phone && (
                  <>
                    <div className="text-2xl font-semibold text-blue-900 mb-3">{lead.phone}</div>
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>
                  </>
                )}
                {!lead.phone && (
                  <p className="text-sm text-blue-800">No phone number on file for this lead.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
                <p className="text-sm text-gray-600 mb-2">Document your conversation to keep track of important details</p>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={8}
                  placeholder="What did you discuss? Any action items or important details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Outcome</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Reached - Interested', 'Reached - Not Interested', 'No Answer', 'Voicemail Left'].map(
                    (outcome) => (
                      <button
                        key={outcome}
                        onClick={() => setCallNotes((prev) => (prev ? `${prev}\nOutcome: ${outcome}` : `Outcome: ${outcome}`))}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-left"
                      >
                        {outcome}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {contactMethod === 'sms' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                <div className="space-y-2">
                  {smsTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSmsTemplate(template)}
                      className="w-full text-left px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    >
                      {template.length > 80 ? `${template.substring(0, 80)}…` : template}
                    </button>
                  ))}
                </div>
              </div>

              {lead.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {lead.phone}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={6}
                  placeholder="Type your message..."
                  maxLength={160}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{smsMessage.length}/160 characters</span>
                  <Smile className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">Preview</div>
                <div className="bg-blue-600 text-white rounded-lg rounded-bl-none px-4 py-2 inline-block max-w-sm text-sm">
                  {smsMessage || 'Your message will appear here…'}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Follow-up */}
          <div className="mt-6 pt-6 border-t border-gray-200">
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

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
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
            <Send className="w-4 h-4" />
            {saving ? 'Saving…' : contactMethod === 'email' ? 'Send Email' : contactMethod === 'sms' ? 'Send SMS' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
