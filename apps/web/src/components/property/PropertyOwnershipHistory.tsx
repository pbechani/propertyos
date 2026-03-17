'use client';

import { History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/formatters';

export type OwnershipTransfer = {
  id: string;
  owner_name: string | null;
  transfer_date: string | null;
  transfer_price: string | null;
  transfer_currency: string | null;
  title_deed_url: string | null;
  notes: string | null;
};

interface PropertyOwnershipHistoryProps {
  transfers: OwnershipTransfer[];
}

export default function PropertyOwnershipHistory({ transfers }: PropertyOwnershipHistoryProps) {
  if (transfers.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Ownership History</h2>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {transfers.map((transfer, index) => {
            const date = transfer.transfer_date
              ? new Date(transfer.transfer_date).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Date unknown';

            const price = transfer.transfer_price
              ? formatMoney(transfer.transfer_price, transfer.transfer_currency || 'ZAR')
              : null;

            return (
              <div key={transfer.id} className="relative pl-9">
                {/* Timeline dot */}
                <div
                  className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                    index === 0
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}
                />

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {transfer.owner_name || 'Unknown Owner'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{date}</p>
                    </div>
                    {price && (
                      <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">
                        {price}
                      </span>
                    )}
                  </div>

                  {transfer.notes && (
                    <p className="text-sm text-gray-600 mt-2">{transfer.notes}</p>
                  )}

                  {transfer.title_deed_url && (
                    <a
                      href={transfer.title_deed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      View Title Deed →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
