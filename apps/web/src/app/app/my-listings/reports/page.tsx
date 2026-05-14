'use client';

import { useState } from 'react';
import { ExportReportModal } from '@/components/my-listings/ExportReportModal';
import { DollarSign, Home, TrendingUp, Users, ArrowUp, ArrowDown, Calendar, Download } from 'lucide-react';

const stats = [
  {
    label: 'Total Revenue (YTD)',
    value: '$487,250',
    change: '+12.5%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    label: 'Properties Sold',
    value: '23',
    change: '+4 this quarter',
    trend: 'up' as const,
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: 'Active Listings',
    value: '12',
    change: '-2 this month',
    trend: 'down' as const,
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    label: 'New Clients',
    value: '38',
    change: '+8 this quarter',
    trend: 'up' as const,
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

const recentSales = [
  { address: '123 Maple Avenue', city: 'San Francisco, CA', price: '$1,250,000', date: 'Mar 10, 2026', commission: '$37,500', daysOnMarket: 18 },
  { address: '456 Oak Street', city: 'Oakland, CA', price: '$875,000', date: 'Mar 5, 2026', commission: '$26,250', daysOnMarket: 12 },
  { address: '789 Pine Boulevard', city: 'Berkeley, CA', price: '$1,450,000', date: 'Feb 28, 2026', commission: '$43,500', daysOnMarket: 25 },
  { address: '321 Elm Drive', city: 'San Jose, CA', price: '$950,000', date: 'Feb 20, 2026', commission: '$28,500', daysOnMarket: 15 },
];

const monthlyData = [
  { month: 'Jan', revenue: 45000, sales: 3 },
  { month: 'Feb', revenue: 62000, sales: 4 },
  { month: 'Mar', revenue: 38000, sales: 2 },
];

export default function MyListingsReportsPage() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Track your performance and revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>This Year</option>
            <option>This Quarter</option>
            <option>This Month</option>
            <option>Custom Range</option>
          </select>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.trend === 'up' ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
              <div className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
            <select className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>

          <div className="space-y-4">
            {monthlyData.map((data) => {
              const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
              const widthPercent = (data.revenue / maxRevenue) * 100;

              return (
                <div key={data.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{data.month}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(data.revenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-end px-3"
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-xs text-white font-medium">{data.sales} sales</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Average Sale Price</span>
                <span className="text-lg font-semibold text-gray-900">$1,131,250</span>
              </div>
              <div className="text-xs text-green-600">+8.5% from last quarter</div>
            </div>
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Average Days on Market</span>
                <span className="text-lg font-semibold text-gray-900">17.5 days</span>
              </div>
              <div className="text-xs text-green-600">-12% faster than average</div>
            </div>
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">List-to-Sale Ratio</span>
                <span className="text-lg font-semibold text-gray-900">98.2%</span>
              </div>
              <div className="text-xs text-green-600">Above market average</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Commission</span>
                <span className="text-lg font-semibold text-gray-900">$135,750</span>
              </div>
              <div className="text-xs text-gray-600">Year to date earnings</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sale Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Days on Market</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentSales.map((sale, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sale.address}</div>
                    <div className="text-sm text-gray-600">{sale.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{sale.price}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sale.date}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{sale.daysOnMarket} days</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-green-600">{sale.commission}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportReportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}
