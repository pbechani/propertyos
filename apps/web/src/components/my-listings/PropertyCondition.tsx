'use client';

import { CheckCircle, AlertCircle, XCircle, Wrench, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AddPropertyConditionModal } from './AddPropertyConditionModal';
import { AssessmentDetailModal, type AssessmentDetail } from './AssessmentDetailModal';
import { RequestInspectionModal } from './RequestInspectionModal';
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

interface Props { propertyId: string; authToken: string; }

export function PropertyCondition({ propertyId, authToken }: Props) {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetail | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await propertiesApi.listConditionAssessments(authToken, propertyId);
      setAssessments(rows as AssessmentRow[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load assessments');
    }
  }, [authToken, propertyId]);

  useEffect(() => { load(); }, [load]);

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
    <div className="space-y-4">
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
    </div>
  );
}
