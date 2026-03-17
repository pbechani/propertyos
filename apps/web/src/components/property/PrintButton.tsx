'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrintButtonProps {
  disabled?: boolean;
}

export default function PrintButton({ disabled = false }: PrintButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="print:hidden flex items-center gap-2"
      onClick={() => window.print()}
      disabled={disabled}
      title="Print or save as PDF"
    >
      <Printer className="w-4 h-4" />
      Print / PDF
    </Button>
  );
}
