/**
 * Shared status → Tailwind class mappings.
 * Extracted from duplicate getStatusColor / getPriorityColor / statusBadgeClass
 * functions found in ConveyancerView, EscrowFinancialDashboard, SalesDashboard,
 * PropertySaleWorkspace, AuthenticationFlow, BuyerSimpleView, etc.
 */

const STATUS_COLORS: Record<string, string> = {
  // General
  completed: 'bg-green-100 text-green-700',
  active: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  disputed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-600',
  failed: 'bg-red-100 text-red-700',
  // Financial
  released: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  partial: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-purple-100 text-purple-700',
  // Stage
  'not-started': 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-800',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const PRIORITY_TEXT_COLORS: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-orange-500',
  low: 'text-green-500',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
  info: 'bg-blue-100 text-blue-700',
};

/**
 * Return Tailwind badge classes for a given status string.
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Return Tailwind badge classes for a priority level.
 */
export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Return a text-only colour class for priority (used for inline text, not badges).
 */
export function getPriorityTextColor(priority: string): string {
  return PRIORITY_TEXT_COLORS[priority] ?? 'text-gray-500';
}

/**
 * Return Tailwind badge classes for severity levels.
 */
export function getSeverityColor(severity: string): string {
  return SEVERITY_COLORS[severity] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Return risk colour based on numeric score.
 */
export function getRiskColor(score: number): string {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-500';
  return 'text-green-600';
}

/**
 * Return risk label based on numeric score.
 */
export function getRiskLabel(score: number): string {
  if (score >= 80) return 'High Risk';
  if (score >= 60) return 'Medium Risk';
  return 'Low Risk';
}
