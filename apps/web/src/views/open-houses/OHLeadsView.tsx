// @ts-nocheck
"use client";
import { LeadManagement } from '@/components/open-houses/LeadManagement';

export function LeadsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Leads</h2>
        <p className="text-slate-600">Manage and track your leads</p>
      </div>
      <LeadManagement />
    </div>
  );
}