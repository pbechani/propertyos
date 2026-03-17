'use client';

import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  /** Main label shown above the value */
  label: string;
  /** The prominent metric value */
  value: string | number;
  /** Optional sub-label below the value */
  sublabel?: string;
  /** Primary icon rendered in the icon container */
  icon: LucideIcon;
  /** Optional secondary icon rendered top-right (e.g. trend arrow) */
  trailingIcon?: LucideIcon;
  /**
   * Gradient preset or custom Tailwind gradient classes.
   * Presets: 'blue' | 'red' | 'green' | 'purple' | 'amber' | 'indigo' | 'teal'
   */
  gradient?: 'blue' | 'red' | 'green' | 'purple' | 'amber' | 'indigo' | 'teal' | (string & {});
  /** Extra className for the outer Card */
  className?: string;
}

const GRADIENT_MAP: Record<string, string> = {
  blue: 'from-blue-600 to-blue-700',
  red: 'from-red-500 to-red-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  amber: 'from-amber-500 to-amber-600',
  indigo: 'from-indigo-500 to-indigo-600',
  teal: 'from-teal-500 to-teal-600',
};

export function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trailingIcon: TrailingIcon,
  gradient = 'blue',
  className,
}: KpiCardProps) {
  const gradientClasses = GRADIENT_MAP[gradient] ?? gradient;

  return (
    <Card
      className={cn(
        'p-5 bg-linear-to-br text-white border-0 rounded-2xl',
        gradientClasses,
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        {TrailingIcon && <TrailingIcon className="h-4 w-4 text-white/60" />}
      </div>
      <p className="text-xs opacity-90 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-xs opacity-75 mt-1">{sublabel}</p>}
    </Card>
  );
}
