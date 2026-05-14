'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Calendar,
  Clock,
  User,
  Home,
  MapPin,
  Paperclip,
  Send,
  MoreVertical,
  Star,
  Archive,
  Flag,
  Reply,
  Forward,
  Eye,
  Tag,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  FileText,
  File,
  PhoneOutgoing,
  PhoneIncoming,
  MailOpen,
} from 'lucide-react';
import type { Communication } from './CommunicationLog';
import type { PropertyListing } from '@/lib/api-client';
import { formatMoney } from '@/lib/formatters';

// ── helpers ───────────────────────────────────────────────────────────────────

function getTypeIcon(type: string) {
  switch (type) {
    case 'call-out':  return PhoneOutgoing;
    case 'call-in':   return PhoneIncoming;
    case 'email-sent':    return Send;
    case 'email-received': return MailOpen;
    case 'text':     return MessageSquare;
    case 'video-call': return Video;
    default:         return Phone;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'call-out':      return 'Outgoing Call';
    case 'call-in':       return 'Incoming Call';
    case 'email-sent':    return 'Email Sent';
    case 'email-received': return 'Email Received';
    case 'text':          return 'Text Message';
    case 'video-call':    return 'Video Call';
    default:             return type;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'call-out':
    case 'call-in':       return 'bg-green-100 text-green-600';
    case 'email-sent':
    case 'email-received': return 'bg-blue-100 text-blue-600';
    case 'text':          return 'bg-purple-100 text-purple-600';
    case 'video-call':    return 'bg-indigo-100 text-indigo-600';
    default:             return 'bg-gray-100 text-gray-600';
  }
}

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now  = new Date();
  const diffH = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffH < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffH < 48) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return (
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ── props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comm: Communication;
  property?: PropertyListing | null;
  propertyAddress?: string;
}

// ── component ─────────────────────────────────────────────────────────────────

export function CommunicationDetailModal({ open, onOpenChange, comm, property, propertyAddress }: Props) {
  const [replyContent, setReplyContent]   = useState('');
  const [showReplyBox, setShowReplyBox]   = useState(false);
  const [attachments, setAttachments]     = useState<File[]>([]);
  const [replySubject, setReplySubject]   = useState(`Re: ${comm.subject}`);

  if (!open) return null;

  const Icon          = getTypeIcon(comm.type);
  const typeColor     = getTypeColor(comm.type);
  const isEmail       = comm.type.includes('email');
  const isOutbound    = comm.type === 'call-out' || comm.type === 'email-sent';
  const resolvedAddr  = property?.location?.address_line1 ?? propertyAddress ?? null;
  const cityRegion    = [property?.location?.city, property?.location?.region].filter(Boolean).join(', ');
  const primaryImg    = property?.media?.find(m => m.is_primary)?.url ?? property?.media?.[0]?.url ?? null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
  };
  const removeAttachment = (idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx));
  const handleSendReply = () => {
    setReplyContent('');
    setAttachments([]);
    setReplySubject('');
    setShowReplyBox(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col overflow-hidden">
      <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
        {/* ── Header ── */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shrink-0">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Communication Detail</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {getTypeLabel(comm.type)} with {comm.contact}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Star">
                  <Star className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Archive">
                  <Archive className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Flag">
                  <Flag className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="More">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-7xl mx-auto px-6 py-6 w-full">
          <div className="grid grid-cols-3 gap-6">

            {/* ── Main thread column (2/3) ── */}
            <div className="col-span-2 space-y-6">

              {/* Quick-action bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setReplySubject(`Re: ${comm.subject}`); setShowReplyBox(v => !v); }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Reply className="w-4 h-4" />
                      Reply
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Forward className="w-4 h-4" />
                      Forward
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule Meeting
                    </button>
                  </div>
                </div>
              </div>

              {/* Reply / note compose box */}
              {showReplyBox && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isEmail ? `Reply to ${comm.contact}` : `Add Note`}
                    </h3>
                    <button
                      onClick={() => setShowReplyBox(false)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                      <input
                        type="text"
                        value={comm.contact}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        value={replySubject}
                        onChange={e => setReplySubject(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <textarea
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        rows={6}
                        placeholder={isEmail ? 'Type your message here…' : 'Add a note about this communication…'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>

                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Attachments</label>
                        {attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <File className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button onClick={() => removeAttachment(idx)} className="p-1 hover:bg-gray-200 rounded">
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <label className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 text-sm">
                        <Paperclip className="w-4 h-4" />Attach Files
                        <input type="file" multiple onChange={handleFileSelect} className="hidden" />
                      </label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowReplyBox(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                          Cancel
                        </button>
                        <button
                          onClick={handleSendReply}
                          disabled={!replyContent.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Communication entry */}
              <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                comm.type === 'text' || comm.type === 'call-in' || comm.type === 'call-out'
                  ? 'border-gray-200'
                  : 'border-gray-200'
              }`}>
                {/* Entry header */}
                <div className="px-6 py-4 border-b bg-gray-50 border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {isOutbound ? 'You' : comm.contact}
                          </span>
                          <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded">
                            {getTypeLabel(comm.type)}
                          </span>
                          {comm.duration && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{comm.duration}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span>{comm.contact}</span>
                          {comm.contactRole && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span>{comm.contactRole}</span>
                            </>
                          )}
                          <span className="text-gray-300">·</span>
                          <span>{formatTimestamp(comm.date)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  {comm.subject && (
                    <div className="mt-3 font-semibold text-gray-900">{comm.subject}</div>
                  )}
                </div>

                {/* Entry body */}
                <div className="px-6 py-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{comm.summary}</p>

                  {/* Outcome + follow-up */}
                  {(comm.outcome || comm.followUp) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
                      {comm.outcome && (
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outcome</div>
                            <div className={`text-sm font-medium mt-0.5 ${
                              comm.outcome.toLowerCase().includes('positive') ? 'text-green-700' :
                              comm.outcome.toLowerCase().includes('needs') ? 'text-red-700' :
                              comm.outcome.toLowerCase().includes('awaiting') || comm.outcome.toLowerCase().includes('pending') ? 'text-yellow-700' :
                              'text-gray-800'
                            }`}>{comm.outcome}</div>
                          </div>
                        </div>
                      )}
                      {comm.followUp && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Follow-up Required</div>
                            <div className="text-sm font-medium text-orange-700 mt-0.5">{comm.followUp}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Entry actions */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
                  <button
                    onClick={() => { setReplySubject(`Re: ${comm.subject}`); setShowReplyBox(true); }}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                  <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
                    <Forward className="w-4 h-4" />
                    Forward
                  </button>
                  <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Flag
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sidebar (1/3) ── */}
            <div className="space-y-6">

              {/* Contact card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                    {getInitials(comm.contact)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{comm.contact}</h4>
                    {comm.contactRole && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {comm.contactRole}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span>{getTypeLabel(comm.type)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{formatTimestamp(comm.date)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Phone className="w-4 h-4" />Call Contact
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Mail className="w-4 h-4" />Send Email
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                    <User className="w-4 h-4" />View Profile
                  </button>
                </div>
              </div>

              {/* Related listing card */}
              {(property || resolvedAddr) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {primaryImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={primaryImg} alt={resolvedAddr ?? 'Listing'} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Home className="w-14 h-14 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Related Listing</h3>
                    <div className="space-y-1 text-sm">
                      {resolvedAddr && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">{resolvedAddr}</div>
                            {cityRegion && <div className="text-gray-500 text-xs">{cityRegion}</div>}
                          </div>
                        </div>
                      )}
                      {property && (
                        <div className="text-lg font-bold text-blue-600 mt-2">
                          {formatMoney(property.price, property.currency)}
                        </div>
                      )}
                    </div>
                    <button className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4" />View Listing
                    </button>
                  </div>
                </div>
              )}

              {/* Communication stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Entry Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                      {getTypeLabel(comm.type)}
                    </span>
                  </div>
                  {comm.duration && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-900">{comm.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Direction</span>
                    <span className="font-medium text-gray-900">
                      {isOutbound ? 'Outbound' : 'Inbound'}
                    </span>
                  </div>
                  {comm.outcome && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-500 shrink-0">Outcome</span>
                      <span className="font-medium text-gray-900 text-right">{comm.outcome}</span>
                    </div>
                  )}
                  {comm.followUp && (
                    <div className="flex items-start justify-between gap-2 pt-2 border-t border-gray-100">
                      <span className="text-orange-600 shrink-0 font-medium">Follow-up</span>
                      <span className="text-orange-700 text-right">{comm.followUp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />Schedule Follow-up
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4" />Send Documents
                  </button>
                  <button
                    onClick={() => { setReplySubject(`Re: ${comm.subject}`); setShowReplyBox(true); }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />Add Note
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4" />Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
