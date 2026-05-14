'use client';

import type { ReactNode } from 'react';
import ConstructionSubNav from '@/components/construction/ConstructionSubNav';

export default function ConstructionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <ConstructionSubNav />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    </div>
  );
}
