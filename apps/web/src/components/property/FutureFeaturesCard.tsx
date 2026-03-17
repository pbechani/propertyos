'use client';

import { Card } from '@/components/ui/card';

interface FutureFeaturesCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function FutureFeaturesCard({ title, description, icon }: FutureFeaturesCardProps) {
  return (
    <Card className="p-5 border-dashed border-gray-300 bg-gray-50/50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
          {icon}
        </div>
        <div>
          <h4 className="font-medium text-gray-700 text-sm">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          <span className="inline-block mt-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            Coming Soon
          </span>
        </div>
      </div>
    </Card>
  );
}
