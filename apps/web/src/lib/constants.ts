/**
 * Shared constants used across property/sales views.
 * Extracted from duplicate definitions in SalesDashboard, PropertySaleWorkspace, etc.
 */

export const STAGE_NAMES: Record<number, string> = {
  1: 'Property Search & Viewing',
  2: 'Offer Submission',
  3: 'Offer Accepted / Negotiation',
  4: 'Sale Agreement (OTP)',
  5: 'Deposit & Escrow',
  6: 'Title Deed Search & Verification',
  7: 'Mortgage / Financing Approval',
  8: 'Property Inspection & Due Diligence',
  9: 'Compliance Certificates',
  10: 'Transfer Documentation',
  11: 'Deeds Office Submission',
  12: 'Transfer Duty Payment',
  13: 'Capital Gains / Income Tax Clearance',
  14: 'Deeds Office Registration',
  15: 'Final Payment & Handover',
};

export const TEMPERATURE_CONFIG: Record<string, { label: string; color: string }> = {
  hot: { label: 'Hot', color: 'bg-red-100 text-red-700 border-red-200' },
  warm: { label: 'Warm', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  cold: { label: 'Cold', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  nurture: { label: 'Nurture', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export const LEAD_TYPE_LABELS: Record<string, string> = {
  buyer: 'Buyers',
  seller: 'Sellers',
  investor: 'Investors',
  renter: 'Renters',
};

export const LEAD_TYPE_COLORS: Record<string, string> = {
  buyer: 'bg-blue-500',
  seller: 'bg-green-500',
  investor: 'bg-purple-500',
  renter: 'bg-orange-500',
};
