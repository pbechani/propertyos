'use client';

import {
  ArrowLeft,
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  Home,
  Wrench,
  Edit,
  MoreVertical,
  Share2,
  Printer,
  Building2,
  MessageSquare,
  Shield,
  Zap,
  Droplet,
  Wind,
  TreePine,
  CheckCircle,
  Package,
  PlusCircle,
  Info,
  MapPin,
} from 'lucide-react';
import type { InspectionRequest } from './PropertyCondition';
import { INSPECTION_TYPE_LABELS } from './RequestInspectionModal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InspectionRequest;
  propertyAddress?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:    { label: 'Pending',     color: 'bg-amber-100 text-amber-700',  icon: Clock },
  scheduled:  { label: 'Scheduled',   color: 'bg-blue-100 text-blue-700',    icon: Calendar },
  'in-progress': { label: 'In Progress', color: 'bg-purple-100 text-purple-700', icon: Clock },
  completed:  { label: 'Completed',   color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',   color: 'bg-gray-100 text-gray-700',    icon: XCircle },
};

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  rush:     { label: 'Rush',     color: 'bg-red-100 text-red-700 border-red-200' },
  priority: { label: 'Priority', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  standard: { label: 'Standard', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

function fmtTypeLabel(t: string) {
  return INSPECTION_TYPE_LABELS[t] ?? t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDateTime(date: string, time?: string) {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return time ? `${dateStr} @ ${time}` : dateStr;
}

const getCategoryIcon = (category: string): React.ComponentType<{ className?: string }> => {
  switch (category.toLowerCase()) {
    case 'roof':        return Home;
    case 'plumbing':    return Droplet;
    case 'electrical':  return Zap;
    case 'hvac':        return Wind;
    case 'foundation':  return Building2;
    case 'safety':      return Shield;
    case 'exterior':    return TreePine;
    default:            return Wrench;
  }
};

export function InspectionDetailModal({ open, onOpenChange, request, propertyAddress }: Props) {

  if (!open) return null;

  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const urgencyCfg = URGENCY_CONFIG[request.urgency] ?? URGENCY_CONFIG.standard;

  const inspectorInitials =
    request.inspector_name
      ? request.inspector_name
          .split(' ')
          .map((n) => n[0])
          .join('')
      : '?';

  const hasInspector = !!(request.inspector_name || request.inspector_company);
  const isCompleted = request.status === 'completed';
  const isCancelled = request.status === 'cancelled';

  const title =
    request.inspection_types.length > 0
      ? fmtTypeLabel(request.inspection_types[0]) +
        (request.inspection_types.length > 1
          ? ` +${request.inspection_types.length - 1} more`
          : '')
      : 'Inspection Request';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col overflow-hidden">
      <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
        {/* Sticky Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                  {propertyAddress && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {propertyAddress}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-7xl mx-auto px-6 py-6 w-full">
          <div className="grid grid-cols-3 gap-6">
            {/* ── Main Content ── */}
            <div className="col-span-2 space-y-6">
              {/* Status Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div
                      className={`px-4 py-2 rounded-lg ${statusCfg.color} flex items-center gap-2 font-medium`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {statusCfg.label}
                    </div>
                    <span
                      className={`px-3 py-1.5 border rounded-lg text-sm font-medium capitalize ${urgencyCfg.color}`}
                    >
                      {urgencyCfg.label} Priority
                    </span>
                  </div>
                  {isCompleted && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4" />
                      View Report
                    </button>
                  )}
                </div>
              </div>

              {/* Inspection Types */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Types</h3>
                <div className="flex flex-wrap gap-2">
                  {request.inspection_types.map((t) => {
                    const CategoryIcon = getCategoryIcon(t);
                    return (
                      <div
                        key={t}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
                          <CategoryIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-blue-800">{fmtTypeLabel(t)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Results placeholder / completed state */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Results</h3>
                {isCompleted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Inspection completed</p>
                      <p className="text-sm text-green-800 mt-1">
                        The inspection report has been submitted. Download the full report to review findings.
                      </p>
                    </div>
                  </div>
                ) : isCancelled ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">This inspection was cancelled. No results are available.</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Awaiting inspection</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Results and detailed findings will appear here once the inspection is completed.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Access & Notification Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Access Method</div>
                      <div className="font-medium text-gray-900 capitalize">
                        {request.access_method.replace(/-/g, ' ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Report Sent To</div>
                      <div className="font-medium text-gray-900">{request.send_report_to || '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Notify Client</div>
                      <div className="flex items-center gap-1.5">
                        {request.notify_client ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">
                          {request.notify_client ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Submitted</div>
                      <div className="font-medium text-gray-900">
                        {new Date(request.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Alternate date */}
                  {request.alternate_date && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-500 mb-1">Alternate Date</div>
                      <div className="font-medium text-gray-900">
                        {fmtDateTime(request.alternate_date, request.alternate_time ?? undefined)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-6">
              {/* Schedule */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm text-gray-500">Preferred Date</div>
                      <div className="font-medium text-gray-900">
                        {fmtDateTime(request.preferred_date, request.preferred_time)}
                      </div>
                    </div>
                  </div>
                  {request.alternate_date && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-500">Alternate Date</div>
                        <div className="font-medium text-gray-900">
                          {fmtDateTime(request.alternate_date, request.alternate_time ?? undefined)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspector</h3>
                {hasInspector ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {inspectorInitials}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {request.inspector_name ?? '—'}
                        </div>
                        {request.inspector_company && (
                          <div className="text-sm text-gray-500">{request.inspector_company}</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {request.inspector_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a
                            href={`tel:${request.inspector_phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {request.inspector_phone}
                          </a>
                        </div>
                      )}
                      {request.inspector_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${request.inspector_email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {request.inspector_email}
                          </a>
                        </div>
                      )}
                    </div>

                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4" />
                      Contact Inspector
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 flex items-start gap-2">
                    <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    No inspector assigned yet. One will be assigned once the request is reviewed.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-2">
                  {(request.status === 'pending' || request.status === 'scheduled') && (
                    <>
                      <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <Edit className="w-4 h-4" />
                        Reschedule Request
                      </button>
                      <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm">
                        <XCircle className="w-4 h-4" />
                        Cancel Request
                      </button>
                    </>
                  )}
                  {isCompleted && (
                    <>
                      <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <PlusCircle className="w-4 h-4" />
                        Schedule Follow-up
                      </button>
                      <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4" />
                        Request Re-inspection
                      </button>
                    </>
                  )}
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    Add Note
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
