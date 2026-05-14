'use client';

import { Card } from "@/components/ui/card";

type PropertyMonthlyCostsProps = {
  monthlyLevy: number | null;
  monthlyRates: number | null;
  monthlyUtilities: number | null;
  currency: string;
};

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PropertyMonthlyCosts({
  monthlyLevy,
  monthlyRates,
  monthlyUtilities,
  currency,
}: PropertyMonthlyCostsProps) {
  const hasAny =
    (monthlyLevy != null && monthlyLevy > 0) ||
    (monthlyRates != null && monthlyRates > 0) ||
    (monthlyUtilities != null && monthlyUtilities > 0);

  if (!hasAny) return null;

  const items: { label: string; value: number }[] = [];
  if (monthlyLevy != null && monthlyLevy > 0) items.push({ label: 'Levy', value: monthlyLevy });
  if (monthlyRates != null && monthlyRates > 0) items.push({ label: 'Rates & Taxes', value: monthlyRates });
  if (monthlyUtilities != null && monthlyUtilities > 0) items.push({ label: 'Utilities', value: monthlyUtilities });

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-3">Monthly Costs</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium">{formatAmount(item.value, currency)}</span>
          </div>
        ))}
        {items.length > 1 && (
          <>
            <div className="border-t border-gray-200 my-2" />
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Total Monthly</span>
              <span className="text-blue-600">{formatAmount(total, currency)}</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
