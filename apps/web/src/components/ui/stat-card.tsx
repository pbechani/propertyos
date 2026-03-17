'use client';

import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional change / subtitle text */
  change?: string;
  icon?: LucideIcon;
  /** Text colour for the value */
  valueColor?: string;
  /** Icon + bg colour pair */
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  valueColor,
  iconColor,
  iconBg,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-600 mb-1">{label}</div>
          <div className={cn('text-2xl font-bold', valueColor)}>{value}</div>
          {change && <div className="text-xs text-muted-foreground mt-1">{change}</div>}
        </div>
        {Icon && (
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        )}
      </div>
    </Card>
  );
}
