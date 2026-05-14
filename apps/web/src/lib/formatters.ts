/**
 * Shared formatting utilities used across dashboard views.
 * Extracted from duplicated implementations in:
 *   - AgentDashboardEnhanced, PropertyComparison, MyDashboard (formatMoney)
 *   - BuyerSimpleView (formatCurrency)
 *   - LeadAnalytics, LeadDashboard (formatRevenue / pipeline value)
 *   - ProfileDashboard, BuyerDashboardEnhanced (formatRelativeTime)
 */

/**
 * Format a numeric price as a locale-aware currency string.
 * Accepts string or number for the amount.
 */
export function formatMoney(
  price: string | number,
  currency = 'ZAR',
): string {
  const value = typeof price === 'string' ? Number(price) : price;
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
    maximumFractionDigits: 0,
  }).format(safeValue);
}

/**
 * Compact currency display — R1.2M / R450K / R1,234.
 */
export function formatCompactCurrency(value: number, prefix = 'R'): string {
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(0)}K`;
  return `${prefix}${value.toLocaleString()}`;
}

/**
 * Relative time label: "just now", "3m ago", "2h ago", "5d ago".
 */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const parsedTime = Date.parse(iso);
  if (Number.isNaN(parsedTime)) return '—';

  const diff = Math.max(0, Date.now() - parsedTime);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
