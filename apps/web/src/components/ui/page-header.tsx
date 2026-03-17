'use client';

import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Consistent page header with title, optional description, and action slot.
 * Replaces the repeated flex+justify-between+h1+p+button pattern across dashboards.
 */
export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
