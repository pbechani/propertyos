// @ts-nocheck
"use client"
import { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Brain,
  Zap,
  Target,
  Users,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Mail,
  Phone,
  Eye,
  MapPin,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Activity,
  Flame,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// Prediction data
const predictionData = [
  { month: 'Jan', actual: 45, predicted: null },
  { month: 'Feb', actual: 52, predicted: null },
  { month: 'Mar', actual: 48, predicted: null },
  { month: 'Apr', actual: 61, predicted: null },
  { month: 'May', actual: 55, predicted: null },
  { month: 'Jun', actual: 67, predicted: null },
  { month: 'Jul', actual: 72, predicted: null },
  { month: 'Aug', actual: 68, predicted: 68 },
  { month: 'Sep', actual: null, predicted: 74 },
  { month: 'Oct', actual: null, predicted: 79 },
  { month: 'Nov', actual: null, predicted: 83 },
  { month: 'Dec', actual: null, predicted: 88 },
];

const conversionPredictionData = [
  { month: 'Jan', actual: 12, predicted: null },
  { month: 'Feb', actual: 18, predicted: null },
  { month: 'Mar', actual: 15, predicted: null },
  { month: 'Apr', actual: 22, predicted: null },
  { month: 'May', actual: 19, predicted: null },
  { month: 'Jun', actual: 28, predicted: null },
  { month: 'Jul', actual: 31, predicted: null },
  { month: 'Aug', actual: 26, predicted: 26 },
  { month: 'Sep', actual: null, predicted: 32 },
  { month: 'Oct', actual: null, predicted: 36 },
  { month: 'Nov', actual: null, predicted: 39 },
  { month: 'Dec', actual: null, predicted: 42 },
];

const performanceScoreData = [
  { metric: 'Lead Response Time', score: 92, trend: 'up', change: 8 },
  { metric: 'Email Open Rate', score: 68, trend: 'up', change: 12 },
  { metric: 'Conversion Rate', score: 45, trend: 'down', change: -3 },
  { metric: 'Client Satisfaction', score: 88, trend: 'up', change: 5 },
  { metric: 'Follow-up Consistency', score: 76, trend: 'up', change: 15 },
];

interface HeatmapData {
  day: string;
  hours: { hour: number; value: number }[];
}

const activityHeatmapData: HeatmapData[] = [
  {
    day: 'Mon',
    hours: [2, 3, 4, 5, 8, 12, 15, 18, 22, 25, 28, 32, 38, 35, 30, 25, 20, 15, 10, 8, 6, 4, 3, 2].map(
      (v, i) => ({ hour: i, value: v })
    ),
  },
  {
    day: 'Tue',
    hours: [1, 2, 3, 4, 9, 14, 18, 21, 25, 30, 35, 40, 42, 38, 32, 28, 22, 16, 12, 9, 7, 5, 3, 2].map(
      (v, i) => ({ hour: i, value: v })
    ),
  },
  {
    day: 'Wed',
    hours: [2, 3, 5, 6, 10, 16, 20, 24, 28, 34, 38, 45, 48, 42, 36, 30, 24, 18, 14, 10, 8, 6, 4, 3].map(
      (v, i) => ({ hour: i, value: v })
    ),
  },
  {
    day: 'Thu',
    hours: [1, 3, 4, 5, 8, 13, 17, 22, 26, 32, 36, 42, 45, 40, 34, 28, 22, 17, 13, 9, 7, 5, 3, 2].map(
      (v, i) => ({ hour: i, value: v })
    ),
  },
  {
    day: 'Fri',
    hours: [2, 4, 5, 7, 11, 15, 19, 23, 27, 31, 34, 38, 40, 36, 31, 26, 21, 16, 12, 9, 7, 5, 4, 3].map(
      (v, i) => ({ hour: i, value: v })
    ),
  },
  {
    day: 'Sat',
    hours: [5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 7, 6].map(
      (v, i) => ({ hour: i, value: v })
    ),
  },
  {
    day: 'Sun',
    hours: [8, 9, 10, 11, 13, 15, 17, 19, 21, 23, 24, 25, 26, 25, 23, 21, 19, 17, 15, 13, 11, 10, 9, 8].map(
      (v, i) => ({ hour: i, value: v })
    ),
  },
];

const aiInsights = [
  {
    id: 1,
    type: 'opportunity',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'Peak Activity Window Detected',
    description:
      'Your leads are most active on Wednesdays between 2-4 PM. Consider scheduling follow-ups during this time for 35% higher response rates.',
    impact: 'High Impact',
    impactColor: 'text-amber-700 bg-amber-100',
  },
  {
    id: 2,
    type: 'prediction',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'Conversion Rate Improving',
    description:
      'AI predicts your conversion rate will increase by 18% next quarter based on recent workflow optimizations and lead quality improvements.',
    impact: 'Positive Trend',
    impactColor: 'text-emerald-700 bg-emerald-100',
  },
  {
    id: 3,
    type: 'warning',
    icon: AlertCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    title: 'Follow-up Gap Detected',
    description:
      '23 qualified leads haven\'t been contacted in 5+ days. AI suggests immediate action to prevent lead cooling.',
    impact: 'Needs Attention',
    impactColor: 'text-rose-700 bg-rose-100',
  },
  {
    id: 4,
    type: 'success',
    icon: CheckCircle2,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'Email Campaign Performing Well',
    description:
      'Your "Spring Listings" campaign is outperforming industry average by 24%. AI recommends duplicating this strategy.',
    impact: 'Success',
    impactColor: 'text-blue-700 bg-blue-100',
  },
];

const recommendations = [
  {
    title: 'Optimize Follow-up Timing',
    description: 'Send follow-up emails on Wednesdays at 2 PM for best results',
    metric: '+35% response rate',
    color: 'emerald',
  },
  {
    title: 'Re-engage Cold Leads',
    description: 'Launch re-engagement campaign for 89 inactive leads',
    metric: '~12 potential conversions',
    color: 'blue',
  },
  {
    title: 'Increase Weekend Coverage',
    description: 'Weekend inquiries show 2x conversion rate',
    metric: '+$180K potential revenue',
    color: 'purple',
  },
];

export function AdvancedAnalytics() {
  const [selectedInsight, setSelectedInsight] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header with AI Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-slate-900">AI-Powered Analytics</h2>
              <span className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI BETA
              </span>
            </div>
            <p className="text-slate-600">Machine learning insights and predictions</p>
          </div>
        </div>
        <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-white transition-colors">
          Configure AI
        </button>
      </div>

      {/* AI Score Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold opacity-90">AI Performance Score</span>
              </div>
              <h3 className="text-6xl font-bold mb-2">78</h3>
              <p className="text-white/80 text-sm">
                Your business is performing better than 73% of similar agents
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">+12 pts</span>
              </div>
              <p className="text-xs text-white/70">vs last month</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Lead Quality', score: 85 },
              { label: 'Response Time', score: 92 },
              { label: 'Engagement', score: 68 },
              { label: 'Conversion', score: 72 },
            ].map((metric) => (
              <div key={metric.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold">{metric.score}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {aiInsights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <button
              key={insight.id}
              onClick={() => setSelectedInsight(index)}
              className={`p-5 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                selectedInsight === index
                  ? `${insight.border} ${insight.bg} shadow-md`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 ${insight.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${insight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${insight.impactColor}`}
                    >
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{insight.description}</p>
                  <button
                    className={`text-sm font-medium ${insight.color} flex items-center gap-1 hover:gap-2 transition-all`}
                  >
                    Take Action
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Predictions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Prediction Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900">Lead Generation Forecast</h3>
              </div>
              <p className="text-sm text-slate-600">AI-predicted leads for next 4 months</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">+18%</p>
              <p className="text-xs text-slate-600">predicted growth</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={predictionData}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <ReferenceLine
                x="Aug"
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{ value: 'Today', position: 'top', fill: '#64748b', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#actualGradient)"
                name="Actual"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#predictedGradient)"
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-slate-600">Actual Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-slate-600">AI Prediction</span>
            </div>
          </div>
        </div>

        {/* Conversion Prediction Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">Conversion Forecast</h3>
              </div>
              <p className="text-sm text-slate-600">Predicted closed deals by month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">+23%</p>
              <p className="text-xs text-slate-600">vs last quarter</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={conversionPredictionData}>
              <defs>
                <linearGradient id="convActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <ReferenceLine
                x="Aug"
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{ value: 'Today', position: 'top', fill: '#64748b', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#convActual)"
                name="Actual"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#convPredicted)"
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-600">Actual Conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-600">Predicted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-slate-900">Lead Activity Heatmap</h3>
            </div>
            <p className="text-sm text-slate-600">Best times to engage with leads</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Low</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor: getHeatmapColor(i * 10),
                  }}
                />
              ))}
            </div>
            <span className="text-slate-600">High</span>
          </div>
        </div>
        <ActivityHeatmap data={activityHeatmapData} />
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">AI Recommendation</h4>
              <p className="text-sm text-blue-800">
                Peak activity occurs on <strong>Wednesdays at 2-4 PM</strong>. Schedule important
                follow-ups during this window for maximum engagement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics with AI Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Performance Metrics</h3>
            </div>
            <p className="text-sm text-slate-600">AI-scored performance indicators</p>
          </div>
        </div>
        <div className="space-y-4">
          {performanceScoreData.map((metric) => {
            const scoreColor =
              metric.score >= 80
                ? 'text-emerald-600'
                : metric.score >= 60
                  ? 'text-amber-600'
                  : 'text-rose-600';
            const barColor =
              metric.score >= 80
                ? 'bg-emerald-500'
                : metric.score >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500';
            const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight;
            const trendColor = metric.trend === 'up' ? 'text-emerald-600' : 'text-rose-600';

            return (
              <div key={metric.metric} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">{metric.metric}</h4>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      <TrendIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{Math.abs(metric.change)}%</span>
                    </div>
                    <span className={`text-2xl font-bold ${scoreColor}`}>{metric.score}</span>
                  </div>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">AI Recommendations</h3>
            </div>
            <p className="text-sm text-slate-600">Actionable insights to boost performance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => {
            const colorClasses = {
              emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
              blue: 'bg-blue-50 border-blue-200 text-blue-700',
              purple: 'bg-purple-50 border-purple-200 text-purple-700',
            };
            return (
              <div
                key={index}
                className={`p-5 rounded-xl border-2 ${
                  colorClasses[rec.color as keyof typeof colorClasses]
                }`}
              >
                <h4 className="font-semibold mb-2">{rec.title}</h4>
                <p className="text-sm mb-3 opacity-80">{rec.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-70">Expected:</span>
                  <span className="font-bold">{rec.metric}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ActivityHeatmap({ data }: { data: HeatmapData[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-2 min-w-max">
        {/* Hour labels */}
        <div className="flex gap-2 ml-12">
          {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
            <div key={hour} className="w-8 text-xs text-slate-600 text-center">
              {hour.toString().padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Heatmap rows */}
        {data.map((dayData) => (
          <div key={dayData.day} className="flex items-center gap-2">
            <div className="w-10 text-sm font-medium text-slate-700">{dayData.day}</div>
            <div className="flex gap-0.5">
              {dayData.hours.map((hourData) => (
                <div
                  key={hourData.hour}
                  className="w-2 h-8 rounded-sm transition-all hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: getHeatmapColor(hourData.value),
                  }}
                  title={`${dayData.day} ${hourData.hour}:00 - ${hourData.value} activities`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getHeatmapColor(value: number): string {
  if (value >= 40) return '#8b5cf6'; // purple-600
  if (value >= 30) return '#a78bfa'; // purple-400
  if (value >= 20) return '#c4b5fd'; // purple-300
  if (value >= 10) return '#ddd6fe'; // purple-200
  return '#f3f4f6'; // slate-100
}
