'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Home,
  Star,
  Flag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  Tag,
  ThumbsDown,
  MoreVertical,
  Edit,
  Archive,
  Bed,
  Bath,
  Square,
  Info,
  Timer,
  CreditCard,
  UserCheck,
  MessageCircle,
  Video,
  Copy,
  ExternalLink,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  ClipboardList,
  Printer,
  Share2,
  Users,
} from 'lucide-react';
import { type PropertyInquiryRecord, type PropertyListing, viewingsApi, leadsApi } from '@/lib/api-client';
import { formatMoney } from '@/lib/formatters';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseEmbeddedContact(message: string | null): {
  name: string | null;
  email: string | null;
  phone: string | null;
  preferredContact: string | null;
  source: string | null;
  priority: string | null;
  subject: string | null;
  cleanMessage: string | null;
} | null {
  if (!message) return null;

  // Old single-line format: "General inquiry Name: X Email: y@z.com Phone: 123"
  const singleLine = message.match(
    /^(General inquiry\s+)?Name:\s*(.+?)\s+Email:\s*(\S+@\S+)\s+Phone:\s*(\S+)$/i,
  );
  if (singleLine) {
    return {
      name:             singleLine[2].trim() || null,
      email:            singleLine[3].trim() || null,
      phone:            singleLine[4].trim() || null,
      preferredContact: null,
      source:           null,
      priority:         null,
      subject:          null,
      cleanMessage:     null,
    };
  }

  // New multi-line format (from AddEnquiryModal) — starts with "Name: "
  if (!message.startsWith('Name: ')) return null;

  const nameMatch     = message.match(/^Name:\s*(.+)$/m);
  const emailMatch    = message.match(/^Email:\s*(.+)$/m);
  const phoneMatch    = message.match(/^Phone:\s*(.+)$/m);
  const sourceMatch   = message.match(/^Source:\s*(.+)$/m);
  const priorityMatch = message.match(/^Priority:\s*(.+)$/m);
  const subjectMatch  = message.match(/^Subject:\s*(.+)$/m);

  const blankIdx = message.indexOf('\n\n');
  let cleanMessage: string | null = null;
  if (blankIdx !== -1) {
    let body = message.slice(blankIdx + 2).trim();
    const notesIdx = body.indexOf('\n\n[Internal Notes]');
    if (notesIdx !== -1) body = body.slice(0, notesIdx).trim();
    cleanMessage = body || null;
  }

  return {
    name:             nameMatch?.[1]?.trim()     || null,
    email:            emailMatch?.[1]?.trim()    || null,
    phone:            phoneMatch?.[1]?.trim()    || null,
    preferredContact: null,
    source:           sourceMatch?.[1]?.trim()   || null,
    priority:         priorityMatch?.[1]?.trim() || null,
    subject:          subjectMatch?.[1]?.trim()  || null,
    cleanMessage,
  };
}

function getStatusConfig(status: string): { label: string; color: string; Icon: React.ElementType } {
  switch (status) {
    case 'new':       return { label: 'New Enquiry', color: 'bg-blue-100 text-blue-700',   Icon: AlertCircle };
    case 'responded': return { label: 'Responded',   color: 'bg-green-100 text-green-700', Icon: CheckCircle2 };
    case 'closed':    return { label: 'Closed',      color: 'bg-gray-100 text-gray-700',   Icon: ThumbsDown };
    default:          return { label: status,        color: 'bg-gray-100 text-gray-700',   Icon: Info };
  }
}

function getPriorityConfig(priority: string | null): { label: string; color: string } {
  switch (priority) {
    case 'urgent': return { label: 'Urgent Priority', color: 'bg-red-100 text-red-700' };
    case 'high':   return { label: 'High Priority',   color: 'bg-orange-100 text-orange-700' };
    case 'medium': return { label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-700' };
    case 'low':    return { label: 'Low Priority',    color: 'bg-gray-100 text-gray-700' };
    default:       return { label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-700' };
  }
}

function getActivityIcon(type: string): React.ElementType {
  switch (type) {
    case 'email':   return Mail;
    case 'call':    return Phone;
    case 'sms':     return MessageSquare;
    case 'note':    return FileText;
    case 'meeting': return Video;
    default:        return MessageCircle;
  }
}

function formatTimestamp(timestamp: string) {
  const date  = new Date(timestamp);
  const now   = new Date();
  const diffH = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffH < 1)  return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)} hours ago`;
  if (diffH < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── props ─────────────────────────────────────────────────────────────────────

interface EnquiryDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enquiry: PropertyInquiryRecord;
  property?: PropertyListing | null;
  propertyAddress?: string;
  onStatusChanged?: (id: string, status: string) => void;
  propertyId?: string;
  authToken?: string;
}

// ── component ─────────────────────────────────────────────────────────────────

export function EnquiryDetailModal({
  open,
  onOpenChange,
  enquiry,
  property,
  propertyAddress,
  onStatusChanged,
  propertyId,
  authToken,
}: EnquiryDetailModalProps) {
  const [localStatus, setLocalStatus] = useState(enquiry.status);
  const [qualScore,   setQualScore]   = useState(70);
  const [showQualEdit, setShowQualEdit] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSavingViewing,   setIsSavingViewing]   = useState(false);
  const [isConvertingLead,  setIsConvertingLead]  = useState(false);

  // Action modal visibility
  const [showResponseModal,    setShowResponseModal]    = useState(false);
  const [showScheduleViewing,  setShowScheduleViewing]  = useState(false);
  const [showConvertToLead,    setShowConvertToLead]    = useState(false);
  const [showConvertToClient,  setShowConvertToClient]  = useState(false);
  const [showDuplicateEnquiry, setShowDuplicateEnquiry] = useState(false);
  const [showExportDetails,    setShowExportDetails]    = useState(false);
  const [showNotInterested,    setShowNotInterested]    = useState(false);
  const [showArchive,          setShowArchive]          = useState(false);

  // Sub-form state
  const [responseMessage, setResponseMessage] = useState('');
  const [viewingForm, setViewingForm] = useState({
    date: '', time: '14:00', duration: '30', type: 'in-person',
    notes: '', sendConfirmation: true, addToCalendar: true,
    sendReminder: true, reminderTime: '1-hour',
    buyerName: '', buyerEmail: '', buyerPhone: '',
  });
  const [leadForm, setLeadForm] = useState({
    status: 'new', priority: 'high', budget: '', timeline: '30-60 days',
    notes: '', createFollowUp: true, followUpDate: '',
  });
  const [clientForm, setClientForm] = useState({
    clientType: 'buyer', status: 'active', budget: '', preApproved: false,
    lender: '', notes: '', createWelcomeEmail: true,
    scheduleConsultation: false, consultationDate: '',
  });
  const [duplicateForm, setDuplicateForm] = useState({
    includeActivities: false, includeTags: true, includeQualification: true,
    newStatus: 'new', assignTo: 'Me', notes: '',
  });
  const [exportForm, setExportForm] = useState({
    format: 'pdf', includeContact: true, includeProperty: true,
    includeMessage: true, includeQualification: true, includeActivities: true, includeTags: true,
  });
  const [notInterestedForm, setNotInterestedForm] = useState({
    reason: '', otherReason: '', followUpLater: false, followUpDate: '', notes: '',
  });
  const [archiveForm, setArchiveForm] = useState({
    reason: '', notes: '', deleteAfter: 'never',
  });

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const updateStatus = (status: string) => {
    setLocalStatus(status);
    onStatusChanged?.(enquiry.id, status);
  };

  // Derive contact info
  const embedded       = parseEmbeddedContact(enquiry.message ?? null);
  const displayName    = enquiry.requester_name  ?? embedded?.name    ?? 'Anonymous';
  const displayEmail   = enquiry.requester_email ?? embedded?.email   ?? null;
  const displayPhone   = enquiry.requester_phone ?? embedded?.phone   ?? null;
  const source         = embedded?.source   ?? null;
  const priority       = embedded?.priority ?? null;
  const subject        = embedded?.subject  ?? null;
  const displayMessage = embedded?.cleanMessage ?? (enquiry.message ?? null);

  const statusConf  = getStatusConfig(localStatus);
  const priorityConf = getPriorityConfig(priority);
  const StatusIcon   = statusConf.Icon;

  // Synthetic activity timeline from available data
  const activities = [
    { id: 'a1', type: 'email',   content: 'Enquiry received',           timestamp: enquiry.created_at, user: 'System' },
    ...(enquiry.responded_at ? [{ id: 'a2', type: 'email', content: 'Response sent to enquirer', timestamp: enquiry.responded_at, user: 'Agent' }] : []),
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-describedby={undefined}
        >
          <div className="min-h-screen bg-gray-50">

            {/* ── sticky header ── */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
              <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </Dialog.Close>
                  <div>
                    <Dialog.Title className="text-2xl font-semibold text-gray-900">Enquiry Details</Dialog.Title>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Submitted {formatTimestamp(enquiry.created_at)}{source ? ` · via ${source}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowArchive(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                    <Archive className="w-4 h-4" />Archive
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-1">
                    <X className="w-5 h-5 text-gray-500" />
                  </Dialog.Close>
                </div>
              </div>
            </div>

            {/* ── page body ── */}
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="grid grid-cols-3 gap-6">

                {/* ── main column (2/3) ── */}
                <div className="col-span-2 space-y-6">

                  {/* Status / priority / actions bar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-4 py-2 rounded-lg ${statusConf.color} flex items-center gap-2 font-medium text-sm`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConf.label}
                        </span>
                        <span className={`px-4 py-2 rounded-lg ${priorityConf.color} flex items-center gap-2 font-medium text-sm`}>
                          <Flag className="w-4 h-4" />
                          {priorityConf.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="text-lg font-semibold text-gray-900">{qualScore}</span>
                          <span className="text-sm text-gray-500">/100</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          setViewingForm(f => ({
                            ...f,
                            buyerName: displayName !== 'Anonymous' ? displayName : '',
                            buyerEmail: displayEmail ?? '',
                            buyerPhone: displayPhone ?? '',
                          }));
                          setShowScheduleViewing(true);
                        }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />Schedule Viewing
                        </button>
                        <button onClick={() => setShowResponseModal(true)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                          <Send className="w-4 h-4" />Send Response
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Property card */}
                  {(() => {
                    const primaryImg = property?.media?.find(m => m.is_primary)?.url ?? property?.media?.[0]?.url ?? null;
                    const resolvedAddress = property?.location?.address_line1 ?? propertyAddress ?? 'This property';
                    const cityRegion = [property?.location?.city, property?.location?.region].filter(Boolean).join(', ');
                    return (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {primaryImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={primaryImg} alt={resolvedAddress} className="w-full h-48 object-cover" />
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <Home className="w-20 h-20 text-white opacity-50" />
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0 mr-4">
                              <h3 className="text-xl font-semibold text-gray-900 mb-0.5 truncate">{resolvedAddress}</h3>
                              {cityRegion && <p className="text-sm text-gray-500 mb-1">{cityRegion}</p>}
                              {property ? (
                                <div className="text-lg font-bold text-blue-600">
                                  {formatMoney(property.price, property.currency)}
                                </div>
                              ) : (
                                <div className="text-lg font-bold text-blue-600 capitalize">{enquiry.inquiry_type} enquiry</div>
                              )}
                            </div>
                            <button className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                              <ExternalLink className="w-4 h-4" />View Listing
                            </button>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            {property?.bedrooms != null && (
                              <div className="flex items-center gap-2"><Bed className="w-4 h-4" /><span>{property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}</span></div>
                            )}
                            {property?.bathrooms != null && (
                              <div className="flex items-center gap-2"><Bath className="w-4 h-4" /><span>{property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}</span></div>
                            )}
                            {property?.area_sqm != null && (
                              <div className="flex items-center gap-2"><Square className="w-4 h-4" /><span>{Number(property.area_sqm).toLocaleString()} m²</span></div>
                            )}
                            {!property && (
                              <>
                                <div className="flex items-center gap-2"><Bed className="w-4 h-4" /><span>Beds</span></div>
                                <div className="flex items-center gap-2"><Bath className="w-4 h-4" /><span>Baths</span></div>
                                <div className="flex items-center gap-2"><Square className="w-4 h-4" /><span>Size</span></div>
                              </>
                            )}
                          </div>
                          {property && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                                {property.property_type.replace(/_/g, ' ')}
                              </span>
                              {property.listing_type && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium capitalize">
                                  {property.listing_type.replace(/_/g, ' ')}
                                </span>
                              )}
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium capitalize">
                                {property.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Original enquiry */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Enquiry</h3>
                    {subject && (
                      <p className="text-sm font-medium text-gray-700 mb-3">Subject: <span className="text-gray-900">{subject}</span></p>
                    )}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                        {displayMessage ?? '(No message body)'}
                      </p>
                    </div>
                  </div>

                  {/* Agent response (if any) */}
                  {enquiry.response && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Response</h3>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <p className="text-blue-800 whitespace-pre-wrap leading-relaxed text-sm">{enquiry.response}</p>
                      </div>
                      {enquiry.responded_at && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />Sent {formatFullDate(enquiry.responded_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Interest Details */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Interest Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Calendar className="w-4 h-4" />Enquiry Type</div>
                        <div className="text-gray-900 font-medium capitalize">{enquiry.inquiry_type}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Timer className="w-4 h-4" />Status</div>
                        <div className="text-gray-900 font-medium capitalize">{localStatus}</div>
                      </div>
                      {source && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Info className="w-4 h-4" />Source</div>
                          <div className="text-gray-900 font-medium capitalize">{source}</div>
                        </div>
                      )}
                      {priority && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><CreditCard className="w-4 h-4" />Priority</div>
                          <div className="text-gray-900 font-medium capitalize">{priority}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                      <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" />Add Note
                      </button>
                    </div>
                    <div className="space-y-4">
                      {activities.map((activity, index) => {
                        const ActivityIcon = getActivityIcon(activity.type);
                        return (
                          <div key={activity.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                <ActivityIcon className="w-5 h-5" />
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900">{activity.content}</p>
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatTimestamp(activity.timestamp)}</span>
                              </div>
                              <p className="text-xs text-gray-500">by {activity.user}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── sidebar (1/3) ── */}
                <div className="space-y-6">

                  {/* Contact card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                        {displayName !== 'Anonymous' ? getInitials(displayName) : <User className="w-7 h-7" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{displayName}</h4>
                        <p className="text-sm text-gray-500">Prospective Buyer</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      {displayEmail && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <a href={`mailto:${displayEmail}`} className="text-blue-600 hover:underline truncate">{displayEmail}</a>
                        </div>
                      )}
                      {displayPhone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <a href={`tel:${displayPhone}`} className="text-blue-600 hover:underline">{displayPhone}</a>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {displayPhone && (
                        <a href={`tel:${displayPhone}`}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                          <Phone className="w-4 h-4" />Call Contact
                        </a>
                      )}
                      {displayEmail && (
                        <a href={`mailto:${displayEmail}`}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                          <Mail className="w-4 h-4" />Send Email
                        </a>
                      )}
                      {displayPhone && (
                        <a href={`sms:${displayPhone}`}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                          <MessageSquare className="w-4 h-4" />Send SMS
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Qualification */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Qualification</h3>
                      <button onClick={() => setShowQualEdit(!showQualEdit)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Lead Score</span>
                        <span className="text-2xl font-bold text-gray-900">{qualScore}/100</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 via-green-400 to-green-600 rounded-full transition-all"
                          style={{ width: `${qualScore}%` }}
                        />
                      </div>
                    </div>
                    {showQualEdit && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adjust Score</label>
                        <input type="range" min={0} max={100} value={qualScore}
                          onChange={e => setQualScore(Number(e.target.value))}
                          className="w-full" />
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {priority && (
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1 capitalize">
                          <Tag className="w-3 h-3" />{priority} priority
                        </span>
                      )}
                      <button className="px-3 py-1.5 border border-dashed border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3" />Add Tag
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => setShowConvertToLead(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <UserCheck className="w-4 h-4" />Convert to Lead
                      </button>
                      <button onClick={() => setShowConvertToClient(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4" />Convert to Client
                      </button>
                      <button onClick={() => setShowDuplicateEnquiry(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <Copy className="w-4 h-4" />Duplicate Enquiry
                      </button>
                      <button onClick={() => setShowExportDetails(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />Export Details
                      </button>
                      <button onClick={() => setShowNotInterested(true)}
                        className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm">
                        <XCircle className="w-4 h-4" />Mark as Not Interested
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
                    <div className="space-y-3 text-sm">
                      {source && (
                        <div><div className="text-gray-500 mb-0.5">Source</div>
                          <div className="font-medium text-gray-900 capitalize">{source}</div></div>
                      )}
                      <div><div className="text-gray-500 mb-0.5">Enquiry Type</div>
                        <div className="font-medium text-gray-900 capitalize">{enquiry.inquiry_type}</div></div>
                      <div><div className="text-gray-500 mb-0.5">Submitted</div>
                        <div className="font-medium text-gray-900">{formatFullDate(enquiry.created_at)}</div></div>
                      {enquiry.responded_at && (
                        <div><div className="text-gray-500 mb-0.5">First Response</div>
                          <div className="font-medium text-gray-900">{formatFullDate(enquiry.responded_at)}</div></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Success Toast ── */}
          {actionSuccess && (
            <div className="fixed top-6 right-6 z-[70]">
              <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{actionSuccess}</span>
                <button onClick={() => setActionSuccess(null)} className="ml-2 hover:opacity-80">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Schedule Viewing Modal ── */}
          {showScheduleViewing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Schedule Property Viewing</h2>
                      <p className="text-sm text-gray-500">Set up a viewing for {displayName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowScheduleViewing(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <Home className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{propertyAddress ?? 'This property'}</span>
                  </div>

                  {/* ── Buyer Contact — editable so agent can correct stale/wrong prefill ── */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Buyer Contact</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                      <input
                        type="text"
                        value={viewingForm.buyerName}
                        onChange={e => setViewingForm(f => ({...f, buyerName: e.target.value}))}
                        placeholder="Buyer's full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={viewingForm.buyerEmail}
                          onChange={e => setViewingForm(f => ({...f, buyerEmail: e.target.value}))}
                          placeholder="buyer@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={viewingForm.buyerPhone}
                          onChange={e => setViewingForm(f => ({...f, buyerPhone: e.target.value}))}
                          placeholder="+27 82 123 4567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                      <input type="date" value={viewingForm.date}
                        onChange={e => setViewingForm(f => ({...f, date: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                      <input type="time" value={viewingForm.time}
                        onChange={e => setViewingForm(f => ({...f, time: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                      <select value={viewingForm.duration} onChange={e => setViewingForm(f => ({...f, duration: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Viewing Type</label>
                      <select value={viewingForm.type} onChange={e => setViewingForm(f => ({...f, type: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                        <option value="in-person">In-Person</option>
                        <option value="virtual">Virtual Tour</option>
                        <option value="open-house">Open House</option>
                        <option value="private">Private Showing</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea value={viewingForm.notes} onChange={e => setViewingForm(f => ({...f, notes: e.target.value}))}
                      rows={3} placeholder="Any special instructions..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm" />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={viewingForm.sendConfirmation}
                        onChange={e => setViewingForm(f => ({...f, sendConfirmation: e.target.checked}))}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Send confirmation email to {viewingForm.buyerName || displayName}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={viewingForm.addToCalendar}
                        onChange={e => setViewingForm(f => ({...f, addToCalendar: e.target.checked}))}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Add to calendar</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={viewingForm.sendReminder}
                        onChange={e => setViewingForm(f => ({...f, sendReminder: e.target.checked}))}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Send reminder</span>
                    </label>
                    {viewingForm.sendReminder && (
                      <select value={viewingForm.reminderTime} onChange={e => setViewingForm(f => ({...f, reminderTime: e.target.value}))}
                        className="ml-7 px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                        <option value="15-min">15 min before</option>
                        <option value="30-min">30 min before</option>
                        <option value="1-hour">1 hour before</option>
                        <option value="1-day">1 day before</option>
                      </select>
                    )}
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowScheduleViewing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button
                    disabled={!viewingForm.date || !viewingForm.buyerName || isSavingViewing}
                    onClick={async () => {
                      if (!propertyId || !authToken || !viewingForm.date) return;
                      setIsSavingViewing(true);
                      try {
                        const scheduledAt = new Date(`${viewingForm.date}T${viewingForm.time}:00`).toISOString();
                        const viewingType = viewingForm.type === 'virtual' ? 'virtual' : 'physical';
                        await viewingsApi.bookForBuyer(authToken, propertyId, {
                          viewingType,
                          scheduledAt,
                          durationMinutes: Number(viewingForm.duration),
                          buyerContactName: viewingForm.buyerName,
                          ...(viewingForm.buyerEmail ? { buyerContactEmail: viewingForm.buyerEmail } : {}),
                          ...(viewingForm.buyerPhone ? { buyerContactPhone: viewingForm.buyerPhone } : {}),
                          notes: viewingForm.notes || undefined,
                          sendConfirmation: viewingForm.sendConfirmation,
                          addCalendarInvite: viewingForm.addToCalendar,
                          sendReminder: viewingForm.sendReminder,
                          reminderMinutesBefore: viewingForm.sendReminder
                            ? ({ '15-min': 15, '30-min': 30, '1-hour': 60, '1-day': 1440 } as Record<string, number>)[viewingForm.reminderTime] ?? 60
                            : undefined,
                        });
                        setShowScheduleViewing(false);
                        showSuccess('Viewing scheduled successfully!');
                      } catch {
                        showSuccess('Failed to schedule viewing — please try again.');
                      } finally {
                        setIsSavingViewing(false);
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSavingViewing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {isSavingViewing ? 'Scheduling…' : 'Schedule Viewing'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Send Response Modal ── */}
          {showResponseModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Send Response</h2>
                  <button onClick={() => setShowResponseModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                    <input readOnly value={displayEmail ?? displayName}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input type="text" defaultValue={`Re: Your enquiry about ${propertyAddress ?? 'this property'}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea value={responseMessage} onChange={e => setResponseMessage(e.target.value)}
                      rows={10} placeholder="Type your response here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm" />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowResponseModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={() => {
                    updateStatus('responded');
                    setShowResponseModal(false);
                    showSuccess('Response sent successfully!');
                  }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                    <Send className="w-4 h-4" />Send Response
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Convert to Lead Modal ── */}
          {showConvertToLead && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Convert to Lead</h2>
                      <p className="text-sm text-gray-500">Create a new lead from this enquiry</p>
                    </div>
                  </div>
                  <button onClick={() => setShowConvertToLead(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
                      {displayName !== 'Anonymous' ? getInitials(displayName) : '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{displayName}</div>
                      <div className="text-sm text-purple-700">{displayEmail ?? displayPhone ?? 'No contact info'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lead Status</label>
                      <select value={leadForm.status} onChange={e => setLeadForm(f => ({...f, status: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                        <option value="new">New</option><option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option><option value="nurturing">Nurturing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select value={leadForm.priority} onChange={e => setLeadForm(f => ({...f, priority: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                        <option value="low">Low</option><option value="medium">Medium</option>
                        <option value="high">High</option><option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                      <input type="text" value={leadForm.budget} onChange={e => setLeadForm(f => ({...f, budget: e.target.value}))}
                        placeholder="e.g. $450k–$500k"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                      <input type="text" value={leadForm.timeline} onChange={e => setLeadForm(f => ({...f, timeline: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea value={leadForm.notes} onChange={e => setLeadForm(f => ({...f, notes: e.target.value}))}
                      rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none text-sm" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={leadForm.createFollowUp}
                      onChange={e => setLeadForm(f => ({...f, createFollowUp: e.target.checked}))}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Create follow-up task</span>
                  </label>
                  {leadForm.createFollowUp && (
                    <div className="ml-7">
                      <input type="date" value={leadForm.followUpDate}
                        onChange={e => setLeadForm(f => ({...f, followUpDate: e.target.value}))}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-900"><strong>Note:</strong> A new lead record will be created. The original enquiry remains unchanged.</p>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowConvertToLead(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button
                    disabled={isConvertingLead}
                    onClick={async () => {
                      if (!authToken) return;
                      setIsConvertingLead(true);
                      try {
                        const stageMap: Record<string, string> = {
                          new: 'new', contacted: 'contacted', qualified: 'qualified', nurturing: 'active',
                        };
                        const tempMap: Record<string, string> = {
                          low: 'cold', medium: 'warm', high: 'hot', urgent: 'hot',
                        };
                        const noteParts = [
                          `Converted from property enquiry (${enquiry.inquiry_type}).`,
                          propertyAddress ? `Property: ${propertyAddress}` : null,
                          leadForm.notes.trim() || null,
                        ].filter(Boolean);
                        await leadsApi.create(authToken, {
                          name: displayName !== 'Anonymous' ? displayName : (viewingForm.buyerName || 'Unknown'),
                          email: displayEmail ?? undefined,
                          phone: displayPhone ?? undefined,
                          address: propertyAddress ?? undefined,
                          source: 'portal_enquiry',
                          type: 'buyer',
                          timeline: leadForm.timeline || undefined,
                          preferences: leadForm.budget || undefined,
                          temperature: tempMap[leadForm.priority] ?? 'warm',
                          stage: stageMap[leadForm.status] ?? 'new',
                          notes: noteParts.join('\n') || undefined,
                          nextFollowUp: leadForm.createFollowUp && leadForm.followUpDate ? leadForm.followUpDate : undefined,
                        });
                        setShowConvertToLead(false);
                        showSuccess('Enquiry converted to lead successfully!');
                      } catch {
                        showSuccess('Failed to convert to lead — please try again.');
                      } finally {
                        setIsConvertingLead(false);
                      }
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isConvertingLead
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <UserCheck className="w-4 h-4" />}
                    {isConvertingLead ? 'Converting…' : 'Convert to Lead'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Convert to Client Modal ── */}
          {showConvertToClient && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Convert to Client</h2>
                      <p className="text-sm text-gray-500">Create a new client from this enquiry</p>
                    </div>
                  </div>
                  <button onClick={() => setShowConvertToClient(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-sm">
                      {displayName !== 'Anonymous' ? getInitials(displayName) : '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{displayName}</div>
                      <div className="text-sm text-emerald-700">{displayEmail ?? displayPhone ?? 'No contact info'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Type</label>
                      <select value={clientForm.clientType} onChange={e => setClientForm(f => ({...f, clientType: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                        <option value="buyer">Buyer</option><option value="seller">Seller</option>
                        <option value="both">Buyer &amp; Seller</option><option value="investor">Investor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select value={clientForm.status} onChange={e => setClientForm(f => ({...f, status: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                        <option value="active">Active</option><option value="prospect">Prospect</option><option value="vip">VIP</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                      <input type="text" value={clientForm.budget} onChange={e => setClientForm(f => ({...f, budget: e.target.value}))}
                        placeholder="e.g. $450k–$500k"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lender</label>
                      <input type="text" value={clientForm.lender} onChange={e => setClientForm(f => ({...f, lender: e.target.value}))}
                        placeholder="(if applicable)"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={clientForm.preApproved}
                      onChange={e => setClientForm(f => ({...f, preApproved: e.target.checked}))}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Pre-approved for financing</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea value={clientForm.notes} onChange={e => setClientForm(f => ({...f, notes: e.target.value}))}
                      rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none text-sm" />
                  </div>
                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    <p className="text-sm font-medium text-gray-700 pt-2">Onboarding Actions</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={clientForm.createWelcomeEmail}
                        onChange={e => setClientForm(f => ({...f, createWelcomeEmail: e.target.checked}))}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Send welcome email</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={clientForm.scheduleConsultation}
                        onChange={e => setClientForm(f => ({...f, scheduleConsultation: e.target.checked}))}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Schedule initial consultation</span>
                    </label>
                    {clientForm.scheduleConsultation && (
                      <div className="ml-7">
                        <input type="date" value={clientForm.consultationDate}
                          onChange={e => setClientForm(f => ({...f, consultationDate: e.target.value}))}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowConvertToClient(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={() => { setShowConvertToClient(false); showSuccess('Enquiry converted to client successfully!'); }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4" />Convert to Client
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Duplicate Enquiry Modal ── */}
          {showDuplicateEnquiry && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Copy className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Duplicate Enquiry</h2>
                      <p className="text-sm text-gray-500">Create a copy of this enquiry</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDuplicateEnquiry(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                    <div className="text-gray-500 mb-1">Original Enquiry</div>
                    <div className="font-medium text-gray-900">{displayName} — {propertyAddress ?? 'This property'}</div>
                    <div className="text-gray-500 mt-1">Score: {qualScore}/100 · Status: {localStatus}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Include in Duplicate</label>
                    <div className="space-y-3">
                      {([
                        { key: 'includeTags',          label: 'Tags' },
                        { key: 'includeQualification', label: 'Qualification data' },
                        { key: 'includeActivities',    label: 'Activity history' },
                      ] as const).map(item => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox"
                            checked={(duplicateForm as Record<string, unknown>)[item.key] as boolean}
                            onChange={e => setDuplicateForm(f => ({...f, [item.key]: e.target.checked}))}
                            className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                      <select value={duplicateForm.newStatus} onChange={e => setDuplicateForm(f => ({...f, newStatus: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                        <option value="new">New</option><option value="contacted">Contacted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                      <input type="text" value={duplicateForm.assignTo}
                        onChange={e => setDuplicateForm(f => ({...f, assignTo: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea value={duplicateForm.notes} onChange={e => setDuplicateForm(f => ({...f, notes: e.target.value}))}
                      rows={2} placeholder="Reason for duplication..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none text-sm" />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowDuplicateEnquiry(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={() => { setShowDuplicateEnquiry(false); showSuccess('Enquiry duplicated successfully!'); }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm">
                    <Copy className="w-4 h-4" />Duplicate Enquiry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Export Details Modal ── */}
          {showExportDetails && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Download className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Export Enquiry Details</h2>
                      <p className="text-sm text-gray-500">Download or share enquiry information</p>
                    </div>
                  </div>
                  <button onClick={() => setShowExportDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'pdf',   label: 'PDF',   Icon: FileText },
                        { value: 'csv',   label: 'CSV',   Icon: ClipboardList },
                        { value: 'print', label: 'Print', Icon: Printer },
                      ] as const).map(fmt => (
                        <button key={fmt.value} type="button"
                          onClick={() => setExportForm(f => ({...f, format: fmt.value}))}
                          className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                            exportForm.format === fmt.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <fmt.Icon className={`w-6 h-6 ${exportForm.format === fmt.value ? 'text-teal-600' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{fmt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Include Sections</label>
                    <div className="space-y-2">
                      {([
                        { key: 'includeContact',       label: 'Contact Information' },
                        { key: 'includeProperty',      label: 'Property Details' },
                        { key: 'includeMessage',       label: 'Original Message' },
                        { key: 'includeQualification', label: 'Qualification Score' },
                        { key: 'includeActivities',    label: 'Activity Timeline' },
                        { key: 'includeTags',          label: 'Tags' },
                      ] as const).map(s => (
                        <label key={s.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox"
                            checked={(exportForm as Record<string, unknown>)[s.key] as boolean}
                            onChange={e => setExportForm(f => ({...f, [s.key]: e.target.checked}))}
                            className="w-4 h-4 text-teal-600 rounded" />
                          <span className="text-sm text-gray-700">{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm">
                      <Share2 className="w-4 h-4" />Share via Email
                    </button>
                    <button className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm">
                      <Copy className="w-4 h-4" />Copy Link
                    </button>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowExportDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={() => { setShowExportDetails(false); showSuccess(`Exported as ${exportForm.format.toUpperCase()} successfully!`); }}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" />Export
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Not Interested Modal ── */}
          {showNotInterested && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <ThumbsDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Mark as Not Interested</h2>
                      <p className="text-sm text-gray-500">Close this enquiry as not interested</p>
                    </div>
                  </div>
                  <button onClick={() => setShowNotInterested(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-900">This will change the enquiry status to &quot;Closed&quot;. You can reopen it later if needed.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Reason *</label>
                    <div className="space-y-2">
                      {([
                        { value: 'price',           label: 'Price too high' },
                        { value: 'location',        label: 'Location not suitable' },
                        { value: 'found-elsewhere', label: 'Found property elsewhere' },
                        { value: 'not-ready',       label: 'Not ready to buy/rent' },
                        { value: 'no-response',     label: 'No response after follow-up' },
                        { value: 'financing',       label: 'Financing issues' },
                        { value: 'other',           label: 'Other' },
                      ]).map(r => (
                        <label key={r.value} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          notInterestedForm.reason === r.value ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <input type="radio" name="ni-reason" value={r.value}
                            checked={notInterestedForm.reason === r.value}
                            onChange={e => setNotInterestedForm(f => ({...f, reason: e.target.value}))}
                            className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-gray-700">{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {notInterestedForm.reason === 'other' && (
                    <input type="text" value={notInterestedForm.otherReason}
                      onChange={e => setNotInterestedForm(f => ({...f, otherReason: e.target.value}))}
                      placeholder="Please specify..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea value={notInterestedForm.notes} onChange={e => setNotInterestedForm(f => ({...f, notes: e.target.value}))}
                      rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none text-sm" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notInterestedForm.followUpLater}
                      onChange={e => setNotInterestedForm(f => ({...f, followUpLater: e.target.checked}))}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Schedule a follow-up check later</span>
                  </label>
                  {notInterestedForm.followUpLater && (
                    <div className="ml-7">
                      <input type="date" value={notInterestedForm.followUpDate}
                        onChange={e => setNotInterestedForm(f => ({...f, followUpDate: e.target.value}))}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowNotInterested(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button disabled={!notInterestedForm.reason}
                    onClick={() => { updateStatus('closed'); setShowNotInterested(false); showSuccess('Enquiry marked as not interested.'); }}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <ThumbsDown className="w-4 h-4" />Mark Not Interested
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Archive Modal ── */}
          {showArchive && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Archive className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Archive Enquiry</h2>
                      <p className="text-sm text-gray-500">Move this enquiry to archive</p>
                    </div>
                  </div>
                  <button onClick={() => setShowArchive(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-900">Archived enquiries are moved out of your active view but can be restored at any time. All data is preserved.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Contact:</span><span className="ml-2 font-medium">{displayName}</span></div>
                      <div><span className="text-gray-500">Property:</span><span className="ml-2 font-medium">{propertyAddress ?? '—'}</span></div>
                      <div><span className="text-gray-500">Status:</span><span className="ml-2 font-medium capitalize">{localStatus}</span></div>
                      <div><span className="text-gray-500">Score:</span><span className="ml-2 font-medium">{qualScore}/100</span></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <select value={archiveForm.reason} onChange={e => setArchiveForm(f => ({...f, reason: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                      <option value="">Select a reason...</option>
                      <option value="resolved">Enquiry Resolved</option>
                      <option value="converted">Converted to Lead/Client</option>
                      <option value="duplicate">Duplicate Enquiry</option>
                      <option value="no-response">No Response</option>
                      <option value="spam">Spam / Irrelevant</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea value={archiveForm.notes} onChange={e => setArchiveForm(f => ({...f, notes: e.target.value}))}
                      rows={3} placeholder="Any notes about archiving..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auto-delete</label>
                    <select value={archiveForm.deleteAfter} onChange={e => setArchiveForm(f => ({...f, deleteAfter: e.target.value}))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm">
                      <option value="never">Never (keep forever)</option>
                      <option value="30">After 30 days</option>
                      <option value="90">After 90 days</option>
                      <option value="180">After 6 months</option>
                      <option value="365">After 1 year</option>
                    </select>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => setShowArchive(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                  <button onClick={() => {
                    updateStatus('closed');
                    setShowArchive(false);
                    showSuccess('Enquiry archived successfully.');
                    setTimeout(() => onOpenChange(false), 1500);
                  }} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 text-sm">
                    <Archive className="w-4 h-4" />Archive Enquiry
                  </button>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
