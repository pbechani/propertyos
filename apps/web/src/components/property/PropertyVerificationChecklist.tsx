'use client';

import { CheckCircle2, Clock, XCircle, AlertTriangle, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'flagged';

type VerificationDocument = {
  label: string;
  status: VerificationStatus;
};

type PropertyVerificationChecklistProps = {
  overallStatus: string;
  verifiedAt?: string | null;
  propertyType: string;
};

function getDocumentsForType(propertyType: string, overallStatus: string): VerificationDocument[] {
  const isVerified = overallStatus.toLowerCase() === 'verified';
  const isPending = overallStatus.toLowerCase() === 'pending';
  const isFlagged = overallStatus.toLowerCase() === 'flagged';

  const baseStatus: VerificationStatus = isFlagged
    ? 'flagged'
    : isVerified
    ? 'verified'
    : isPending
    ? 'pending'
    : 'unverified';

  // Core documents all property types need
  const docs: VerificationDocument[] = [
    { label: 'Title Deed', status: baseStatus },
    { label: 'Rates Clearance', status: isVerified ? 'verified' : isPending ? 'pending' : 'unverified' },
    { label: 'Identity Verification', status: isVerified ? 'verified' : isPending ? 'pending' : 'unverified' },
  ];

  // Type-specific documents
  if (propertyType === 'residential') {
    docs.push(
      { label: 'Electrical Compliance (COC)', status: isVerified ? 'verified' : 'unverified' },
      { label: 'Plumbing Compliance', status: isVerified ? 'verified' : 'unverified' },
      { label: 'Gas Compliance', status: isVerified ? 'verified' : 'unverified' },
    );
  } else if (propertyType === 'commercial') {
    docs.push(
      { label: 'Zoning Certificate', status: isVerified ? 'verified' : 'unverified' },
      { label: 'Occupancy Certificate', status: isVerified ? 'verified' : 'unverified' },
    );
  } else if (propertyType === 'land') {
    docs.push(
      { label: 'Survey / SG Diagram', status: isVerified ? 'verified' : 'unverified' },
      { label: 'Zoning Certificate', status: isVerified ? 'verified' : 'unverified' },
    );
  }

  return docs;
}

const statusConfig: Record<VerificationStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  verified: { icon: CheckCircle2, color: 'text-green-500', label: 'Verified' },
  pending: { icon: Clock, color: 'text-amber-500', label: 'Pending' },
  unverified: { icon: XCircle, color: 'text-gray-400', label: 'Not submitted' },
  flagged: { icon: AlertTriangle, color: 'text-red-500', label: 'Flagged' },
};

export default function PropertyVerificationChecklist({
  overallStatus,
  verifiedAt,
  propertyType,
}: PropertyVerificationChecklistProps) {
  const documents = getDocumentsForType(propertyType, overallStatus);
  const verifiedCount = documents.filter((d) => d.status === 'verified').length;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5" style={{ color: '#1A3C28' }} />
        <h3 className="font-semibold" style={{ fontFamily: 'var(--font-fraunces)', color: '#1A3C28' }}>Verification Checklist</h3>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              overallStatus.toLowerCase() === 'flagged'
                ? 'bg-red-500'
                : verifiedCount === documents.length
                ? 'bg-[#00E87A]'
                : 'bg-[#1A3C28]'
            }`}
            style={{ width: `${(verifiedCount / documents.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {verifiedCount}/{documents.length}
        </span>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => {
          const config = statusConfig[doc.status];
          const Icon = config.icon;
          return (
            <div key={doc.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{doc.label}</span>
              <div className={`flex items-center gap-1 ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {verifiedAt && (
        <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
          Last verified {new Date(verifiedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
    </Card>
  );
}
