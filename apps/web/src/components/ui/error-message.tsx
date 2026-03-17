'use client';

import { cn } from '@/lib/utils';

export interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <p className={cn('text-sm text-red-600 py-8 text-center', className)}>
      {message}
    </p>
  );
}
