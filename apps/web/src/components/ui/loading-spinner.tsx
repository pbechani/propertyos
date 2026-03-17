'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  /** Size preset or Tailwind size classes */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label shown below the spinner */
  label?: string;
  className?: string;
}

const SIZE_MAP: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'md', label, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', SIZE_MAP[size])} />
      {label && <p className="text-sm text-muted-foreground mt-2">{label}</p>}
    </div>
  );
}

/** Full-section centered spinner — replaces the repeated `h-48` centered Loader2 pattern. */
export function PageLoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-48">
      <LoadingSpinner size="md" label={label} />
    </div>
  );
}
