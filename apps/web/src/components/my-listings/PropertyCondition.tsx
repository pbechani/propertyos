'use client';

import { CheckCircle, AlertCircle, XCircle, Wrench, Plus, Calendar, Search, User, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AddPropertyConditionModal } from './AddPropertyConditionModal';
import { AssessmentDetailModal, type AssessmentDetail } from './AssessmentDetailModal';
import { RequestInspectionModal } from './RequestInspectionModal';
import { InspectionDetailModal } from './InspectionDetailModal';
import { INSPECTION_TYPE_LABELS } from './RequestInspectionModal';
import { propertiesApi } from '@/lib/api-client';

interface AssessmentRow {
  id: string;
  inspection_date: string;
  inspector_name: string | null;
  year_built: string | null;
  last_renovation: string | null;
  overall_notes: string | null;
  room_conditions: Record<string, { status: string; notes?: string; issues?: unknown[] }>;
  created_at: string;
}

export interface InspectionRequest {
  id: string;
  property_id?: string;
  requested_by?: string;
  status: string;
  inspection_types: string[];
  urgency: string;
  preferred_date: string;
  preferred_time: string;
  alternate_date: string | null;
  alternate_time: string | null;
  inspector_name: string | null;
  inspector_company: string | null;
  inspector_phone: string | null;
  inspector_email: string | null;
  access_method: string;
  notify_client: boolean;
  send_report_to: string;
  created_at: string;
}

interface Props { propertyId: string; authToken: string; }

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtScheduledDate(date: string, time?: string) {
  const d = new Date(date);
  const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (!time) return datePart;
  // Convert 24h "HH:MM" to 12h with AM/PM if needed
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${datePart} at ${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function fmtTypeLabel(t: string) {
  return INSPECTION_TYPE_LABELS[t] ?? t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function PropertyCondition({ propertyId, authToken }: Props) {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [inspectionRequests, setInspectionRequests] = useState<InspectionRequest[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await propertiesApi.listConditionAssessments(authToken, propertyId);
      setAssessments(rows as AssessmentRow[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load assessments');
    }
  }, [authToken, propertyId]);

  const loadRequests = useCallback(async () => {
    try {
      const rows = await propertiesApi.listInspectionRequests(authToken, propertyId);
      setInspectionRequests(rows as InspectionRequest[]);
    } catch {
      // non-critical
    }
  }, [authToken, propertyId]);

  useEffect(() => { load(); loadRequests(); }, [load, loadRequests]);

  // Refresh inspection request list when modal closes
  useEffect(() => {
    if (!isInspectionModalOpen) loadRequests();
  }, [isInspectionModalOpen, loadRequests]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'fair':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'needs-attention':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Property Condition</h2>
        {loadError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />{loadError}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Assessment
          </button>
          <button
            onClick={() => setIsInspectionModalOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            Request Inspection
          </button>
        </div>
      </div>

      {/* ── Inspection Requests ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Inspection Requests
          {inspectionRequests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {inspectionRequests.length}
            </span>
          )}
        </h3>

        {inspectionRequests.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No inspection requests yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Request Inspection" to schedule one</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {inspectionRequests.map((req) => (
              <div key={req.id} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                {/* Row 1: type name + status badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-base font-semibold text-gray-900">
                      {fmtTypeLabel(req.inspection_types[0] ?? 'Inspection')}
                      {req.inspection_types.length > 1 && (
                        <span className="ml-1.5 text-xs font-normal text-gray-500">
                          +{req.inspection_types.length - 1} more
                        </span>
                      )}
                    </h4>
                    <span className={`px-2.5 py-1 border rounded-full text-xs font-semibold capitalize ${STATUS_COLOR[req.status] ?? STATUS_COLOR.pending}`}>
                      {req.status.replace(/-/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Row 2: inspector */}
                {(req.inspector_name || req.inspector_company) ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{[req.inspector_name, req.inspector_company].filter(Boolean).join(' · ')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>No inspector assigned yet</span>
                  </div>
                )}

                {/* Row 3: dates two-column */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Scheduled</div>
                      <div className="text-sm font-medium text-gray-900">
                        {fmtScheduledDate(req.preferred_date, req.preferred_time || undefined)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">Requested</div>
                      <div className="text-sm font-medium text-gray-900">
                        {fmtDate(req.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 4: action buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    Reschedule
                  </button>
                  <button className="px-4 py-1.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Condition Assessments ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Condition Assessments
          {assessments.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {assessments.length}
            </span>
          )}
        </h3>

        {assessments.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No condition assessments yet</p>
            <p className="text-xs text-gray-400 mt-1">Add an assessment or request an inspection to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assessments.map((assessment) => {
              const roomEntries = Object.entries(assessment.room_conditions ?? {});
              const assessed = roomEntries.filter(([, c]) => c.status !== 'not-assessed');
              const needsAttention = assessed.filter(([, c]) => c.status === 'needs-attention').length;
              return (
                <div
                  key={assessment.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                  onClick={() => setSelectedAssessment(assessment as AssessmentDetail)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelectedAssessment(assessment as AssessmentDetail)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">
                        Assessment — {new Date(assessment.inspection_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </h3>
                      {assessment.inspector_name && (
                        <p className="text-xs text-gray-500 mt-0.5">Inspector: {assessment.inspector_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{assessed.length} items assessed</span>
                      {needsAttention > 0 && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium flex items-center gap-1">
                          <XCircle className="w-3 h-3" />{needsAttention} need{needsAttention !== 1 ? '' : 's'} attention
                        </span>
                      )}
                    </div>
                  </div>
                  {assessment.overall_notes && (
                    <p className="text-sm text-gray-600 mb-3">{assessment.overall_notes}</p>
                  )}
                  {assessed.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {assessed.map(([roomId, cond]) => (
                        <div key={roomId} className="flex items-center gap-2 py-1">
                          {getStatusIcon(cond.status)}
                          <span className="text-sm capitalize">{roomId.replace(/-/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddPropertyConditionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        propertyId={propertyId}
        authToken={authToken}
        onSaved={load}
      />
      <AssessmentDetailModal
        open={selectedAssessment !== null}
        onOpenChange={open => { if (!open) setSelectedAssessment(null); }}
        assessment={selectedAssessment}
      />
      <RequestInspectionModal
        open={isInspectionModalOpen}
        onOpenChange={setIsInspectionModalOpen}
        propertyId={propertyId}
        authToken={authToken}
      />
      {selectedRequest && (
        <InspectionDetailModal
          open={!!selectedRequest}
          onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}
          request={selectedRequest}
        />
      )}
    </div>
  );
}
