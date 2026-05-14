'use client';

export interface PriceHistoryEntry {
  id: string;
  old_price: string | null;
  new_price: string;
  currency: string;
  change_note: string | null;
  created_at: string;
}

interface PriceHistoryChartProps {
  entries: PriceHistoryEntry[];
  currentPrice: number;
  currency: string;
}

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

export default function PriceHistoryChart({ entries, currentPrice, currency }: PriceHistoryChartProps) {
  // Build data points: each entry's new_price + final current price
  const points: { date: string; price: number; label: string }[] = entries.map((e) => ({
    date: e.created_at,
    price: Number(e.new_price),
    label: e.change_note || 'Price change',
  }));

  // Add current price as final point if different from last entry
  if (points.length === 0 || points[points.length - 1].price !== currentPrice) {
    points.push({
      date: new Date().toISOString(),
      price: currentPrice,
      label: 'Current price',
    });
  }

  if (points.length < 2) return null;

  const prices = points.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // SVG dimensions
  const width = 400;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xStep = chartW / (points.length - 1);

  const pathPoints = points.map((p, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartH - ((p.price - minPrice) / priceRange) * chartH;
    return { x, y, ...p };
  });

  const linePath = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Gradient fill path
  const areaPath =
    linePath +
    ` L${pathPoints[pathPoints.length - 1].x},${padding.top + chartH}` +
    ` L${pathPoints[0].x},${padding.top + chartH} Z`;

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const pctChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const direction = pctChange >= 0 ? 'up' : 'down';

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Price History</h3>
        <span
          className={`text-sm font-medium ${direction === 'up' ? 'text-red-600' : 'text-green-600'}`}
        >
          {direction === 'up' ? '▲' : '▼'} {Math.abs(pctChange).toFixed(1)}%
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Price history chart"
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={direction === 'up' ? '#ef4444' : '#22c55e'} stopOpacity="0.2" />
            <stop offset="100%" stopColor={direction === 'up' ? '#ef4444' : '#22c55e'} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill="url(#priceGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={direction === 'up' ? '#ef4444' : '#22c55e'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pathPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="white"
            stroke={direction === 'up' ? '#ef4444' : '#22c55e'}
            strokeWidth="2"
          />
        ))}

        {/* X-axis dates */}
        {pathPoints
          .filter((_, i) => i === 0 || i === pathPoints.length - 1)
          .map((p, i) => (
            <text
              key={`label-${i}`}
              x={p.x}
              y={height - 4}
              textAnchor={i === 0 ? 'start' : 'end'}
              className="text-[11px] fill-gray-500"
            >
              {new Date(p.date).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
            </text>
          ))}
      </svg>

      {/* Price range labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{formatCurrency(firstPrice, currency)}</span>
        <span>{formatCurrency(lastPrice, currency)}</span>
      </div>

      {/* Price change list */}
      <div className="mt-3 space-y-1.5">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {new Date(entry.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-2">
              {entry.old_price && (
                <span className="text-gray-400 line-through">
                  {formatCurrency(Number(entry.old_price), entry.currency)}
                </span>
              )}
              <span className="font-medium text-gray-800">
                {formatCurrency(Number(entry.new_price), entry.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
