'use client';

import { Clock } from "lucide-react";

type PropertyDaysOnMarketProps = {
  createdAt: string;
};

export default function PropertyDaysOnMarket({ createdAt }: PropertyDaysOnMarketProps) {
  if (!createdAt) return null;

  const listedDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - listedDate.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const label = days === 0 ? 'Listed today' : days === 1 ? '1 day on market' : `${days} days on market`;

  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
      <Clock className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}
