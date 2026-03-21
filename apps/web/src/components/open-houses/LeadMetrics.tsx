// @ts-nocheck
"use client"
import { TrendingUp, TrendingDown, Users, DollarSign, Home, Eye } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Metric {
  id: number;
  label: string;
  value: string;
  change: number;
  icon: any;
  data?: number[];
}

interface LeadMetricsProps {
  metrics: Metric[];
  isAdvanced: boolean;
}

export function LeadMetrics({ metrics, isAdvanced }: LeadMetricsProps) {
  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100">
        <span className="text-sm">No metrics available</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const chartData = metric.data?.map((value) => ({ value }));
        
        return (
          <div key={metric.id} className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-slate-700" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                metric.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {metric.change >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{Math.abs(metric.change)}%</span>
              </div>
            </div>
            
            <div>
              <p className="text-2xl font-semibold text-slate-900 mb-1">{metric.value}</p>
              <p className="text-sm text-slate-600">{metric.label}</p>
            </div>
            
            {isAdvanced && chartData && (
              <div className="mt-4 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={metric.change >= 0 ? '#10b981' : '#f43f5e'} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
