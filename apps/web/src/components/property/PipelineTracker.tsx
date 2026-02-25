export interface PipelineStage {
  id: number;
  label: string;
  status: 'completed' | 'active' | 'locked';
  documentsRequired?: number;
  documentsCompleted?: number;
}

export const PURCHASE_STAGES: PipelineStage[] = [
  { id: 1, label: 'Property Search & Viewing', status: 'completed', documentsRequired: 0, documentsCompleted: 0 },
  { id: 2, label: 'Offer Submission', status: 'completed', documentsRequired: 1, documentsCompleted: 1 },
  { id: 3, label: 'Sale Agreement', status: 'active', documentsRequired: 3, documentsCompleted: 1 },
  { id: 4, label: 'Deposit & Escrow', status: 'locked', documentsRequired: 2, documentsCompleted: 0 },
  { id: 5, label: 'Title Deed Search', status: 'locked', documentsRequired: 4, documentsCompleted: 0 },
  { id: 6, label: 'Financing Approval', status: 'locked', documentsRequired: 5, documentsCompleted: 0 },
  { id: 7, label: 'Property Inspection', status: 'locked', documentsRequired: 2, documentsCompleted: 0 },
  { id: 8, label: 'Due Diligence', status: 'locked', documentsRequired: 3, documentsCompleted: 0 },
  { id: 9, label: 'Compliance Certificates', status: 'locked', documentsRequired: 4, documentsCompleted: 0 },
  { id: 10, label: 'Transfer Docs Prep', status: 'locked', documentsRequired: 6, documentsCompleted: 0 },
  { id: 11, label: 'Deeds Office Filing', status: 'locked', documentsRequired: 3, documentsCompleted: 0 },
  { id: 12, label: 'Transfer Duty Payment', status: 'locked', documentsRequired: 2, documentsCompleted: 0 },
  { id: 13, label: 'Final Payment & Registration', status: 'locked', documentsRequired: 4, documentsCompleted: 0 },
  { id: 14, label: 'Post-Purchase', status: 'locked', documentsRequired: 1, documentsCompleted: 0 },
];

interface Props {
  stages: PipelineStage[];
  compact?: boolean;
}

export default function PipelineTracker({ stages, compact = false }: Props) {
  const activeIdx = stages.findIndex(s => s.status === 'active');

  if (compact) {
    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-0 min-w-max">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${stage.status === 'completed'
                      ? 'bg-[#22C55E] border-[#22C55E] text-white'
                      : stage.status === 'active'
                      ? 'bg-[#F5A623] border-[#F5A623] text-[#0A1628] scale-110 ring-4 ring-[#F5A623]/20'
                      : 'bg-white border-gray-300 text-gray-400'
                    }`}
                >
                  {stage.status === 'completed' ? '✓' : stage.id}
                </div>
              </div>
              {/* Connector */}
              {idx < stages.length - 1 && (
                <div
                  className={`h-0.5 w-4 ${
                    idx < activeIdx ? 'bg-[#22C55E]' : idx === activeIdx ? 'bg-[#F5A623]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-0 min-w-max">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="flex items-start">
            {/* Stage node + label */}
            <div className="flex flex-col items-center w-24">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${stage.status === 'completed'
                    ? 'bg-[#22C55E] border-[#22C55E] text-white'
                    : stage.status === 'active'
                    ? 'bg-[#F5A623] border-[#F5A623] text-[#0A1628] scale-110 ring-4 ring-[#F5A623]/20'
                    : 'bg-white border-gray-300 text-gray-400'
                  }`}
              >
                {stage.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : stage.status === 'active' ? (
                  <span>→</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p
                className={`mt-2 text-center text-[10px] leading-tight font-medium px-1
                  ${stage.status === 'completed' ? 'text-[#22C55E]' :
                   stage.status === 'active' ? 'text-[#F5A623] font-bold' :
                   'text-gray-400'}`}
              >
                {stage.label}
              </p>
              {stage.documentsRequired! > 0 && (
                <span className={`mt-1 text-[9px] px-1.5 py-0.5 rounded-full
                  ${stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                   stage.status === 'active' ? 'bg-amber-100 text-amber-700' :
                   'bg-gray-100 text-gray-400'}`}
                >
                  {stage.status === 'completed'
                    ? `${stage.documentsRequired} docs ✓`
                    : stage.status === 'active'
                    ? `${stage.documentsCompleted}/${stage.documentsRequired} docs`
                    : `${stage.documentsRequired} docs`}
                </span>
              )}
            </div>
            {/* Connector line */}
            {idx < stages.length - 1 && (
              <div
                className={`h-0.5 w-4 mt-4.5 shrink-0 ${
                  idx < activeIdx ? 'bg-[#22C55E]' : idx === activeIdx ? 'bg-[#F5A623]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
