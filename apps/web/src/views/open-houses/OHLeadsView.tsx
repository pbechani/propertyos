// @ts-nocheck
"use client";
import { LeadManagement } from '@/components/open-houses/LeadManagement';

export function LeadsView() {
  return (
    <div className="space-y-6 px-7">
      <div>
        <h2 className="text-2xl font-semibold text-[#1A3C28]">Leads</h2>
        <p className="text-[rgba(26,60,40,0.55)]">Manage and track your leads</p>
      </div>
      <LeadManagement />
    </div>
  );
}