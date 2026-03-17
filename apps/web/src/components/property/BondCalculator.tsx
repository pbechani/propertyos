'use client';

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BondCalculatorProps {
  /** Raw numeric property price */
  price: number;
  /** Currency code, e.g. 'ZAR' */
  currency: string;
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BondCalculator({ price, currency }: BondCalculatorProps) {
  const [deposit, setDeposit] = useState(0);
  const [annualRate, setAnnualRate] = useState(11.75);
  const [termYears, setTermYears] = useState(20);

  const { monthly, totalRepayment, totalInterest } = useMemo(() => {
    const principal = price - deposit;
    if (principal <= 0 || annualRate <= 0 || termYears <= 0) {
      return { monthly: 0, totalRepayment: 0, totalInterest: 0 };
    }

    const r = annualRate / 100 / 12;
    const n = termYears * 12;
    const payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = payment * n;

    return {
      monthly: Math.round(payment),
      totalRepayment: Math.round(total),
      totalInterest: Math.round(total - principal),
    };
  }, [price, deposit, annualRate, termYears]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold">Bond Calculator</h3>
      </div>

      <div className="space-y-4">
        {/* Deposit */}
        <div>
          <label htmlFor="bc-deposit" className="block text-sm text-gray-600 mb-1">
            Deposit
          </label>
          <input
            id="bc-deposit"
            type="number"
            min={0}
            max={price}
            step={10000}
            value={deposit}
            onChange={(e) => setDeposit(Math.max(0, Number(e.target.value)))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Interest rate */}
        <div>
          <label htmlFor="bc-rate" className="block text-sm text-gray-600 mb-1">
            Interest Rate (% p.a.)
          </label>
          <input
            id="bc-rate"
            type="number"
            min={0.1}
            max={30}
            step={0.25}
            value={annualRate}
            onChange={(e) => setAnnualRate(Math.max(0.1, Number(e.target.value)))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Term */}
        <div>
          <label htmlFor="bc-term" className="block text-sm text-gray-600 mb-1">
            Loan Term (years)
          </label>
          <input
            id="bc-term"
            type="number"
            min={1}
            max={30}
            step={1}
            value={termYears}
            onChange={(e) => setTermYears(Math.max(1, Math.min(30, Number(e.target.value))))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Results */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Monthly Payment</span>
            <span className="text-lg font-bold text-blue-700">
              {formatCurrency(monthly, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Repayment</span>
            <span className="text-gray-700 font-medium">
              {formatCurrency(totalRepayment, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Interest</span>
            <span className="text-gray-700 font-medium">
              {formatCurrency(totalInterest, currency)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
