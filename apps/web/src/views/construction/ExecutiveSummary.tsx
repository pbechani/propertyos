'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Crown,
  DollarSign,
  Building2,
  Users,
  AlertTriangle,
  ArrowRight,
  Target,
  Shield,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Briefcase,
  Calendar,
  Zap
} from 'lucide-react';
import { useState } from 'react';

// Portfolio KPI data
const portfolioMetrics = {
  totalProjects: 4,
  activeProjects: 3,
  totalBudget: 172000000,
  totalSpent: 67000000,
  avgProgress: 38,
  totalContractors: 36,
  openRisks: 12,
  criticalIssues: 3,
  onTimeRate: 75,
  safetyScore: 94.2,
  aiSavings: 847000,
  changeOrders: 8,
};

const revenueData = [
  { month: 'Oct', revenue: 12400000, costs: 11800000, profit: 600000 },
  { month: 'Nov', revenue: 14200000, costs: 13500000, profit: 700000 },
  { month: 'Dec', revenue: 11800000, costs: 11200000, profit: 600000 },
  { month: 'Jan', revenue: 15600000, costs: 14800000, profit: 800000 },
  { month: 'Feb', revenue: 16800000, costs: 15900000, profit: 900000 },
  { month: 'Mar', revenue: 18200000, costs: 17100000, profit: 1100000 },
];

const projectPerformance = [
  { name: 'Tower A', budget: 45, spent: 28.5, progress: 63, schedule: 'on-track', health: 'good' },
  { name: 'Riverside', budget: 32, spent: 21, progress: 58, schedule: 'delayed', health: 'at-risk' },
  { name: 'GreenTech', budget: 67, spent: 15.4, progress: 23, schedule: 'on-track', health: 'good' },
  { name: 'Lakeside', budget: 28, spent: 2.1, progress: 8, schedule: 'on-track', health: 'good' },
];

const budgetDistribution = [
  { name: 'Labor', value: 38, color: '#3b82f6' },
  { name: 'Materials', value: 28, color: '#10b981' },
  { name: 'Equipment', value: 15, color: '#f59e0b' },
  { name: 'Subcontractors', value: 12, color: '#8b5cf6' },
  { name: 'Overhead', value: 7, color: '#6b7280' },
];

const monthlyProgress = [
  { month: 'Oct', towerA: 48, riverside: 42, greentech: 8, lakeside: 2 },
  { month: 'Nov', towerA: 52, riverside: 46, greentech: 12, lakeside: 3 },
  { month: 'Dec', towerA: 55, riverside: 50, greentech: 15, lakeside: 4 },
  { month: 'Jan', towerA: 58, riverside: 53, greentech: 18, lakeside: 5 },
  { month: 'Feb', towerA: 61, riverside: 55, greentech: 21, lakeside: 6 },
  { month: 'Mar', towerA: 63, riverside: 58, greentech: 23, lakeside: 8 },
];

const safetyData = [
  { month: 'Oct', incidents: 2, nearMisses: 5, score: 95 },
  { month: 'Nov', incidents: 1, nearMisses: 3, score: 96 },
  { month: 'Dec', incidents: 3, nearMisses: 7, score: 92 },
  { month: 'Jan', incidents: 1, nearMisses: 4, score: 95 },
  { month: 'Feb', incidents: 0, nearMisses: 2, score: 98 },
  { month: 'Mar', incidents: 1, nearMisses: 3, score: 94 },
];

const aiInsightsExec = [
  { id: 1, title: 'Schedule Optimization Available', desc: 'AI found 5-day improvement opportunity on Riverside Complex by resequencing MEP tasks', impact: 'Save 5 days + $32K', priority: 'high', type: 'optimization' },
  { id: 2, title: 'Budget Risk: Riverside Complex', desc: 'Current spending trajectory projects 8% budget overrun by Q4 2026 if unchecked', impact: 'Potential $2.56M overrun', priority: 'critical', type: 'warning' },
  { id: 3, title: 'Contractor Performance Alert', desc: 'ProRoof Systems performance has declined 15% over last 30 days across all metrics', impact: 'Schedule impact: 4 days', priority: 'high', type: 'alert' },
  { id: 4, title: 'Procurement Opportunity', desc: 'Bulk ordering steel across Tower A and GreenTech could save 12% on material costs', impact: 'Estimated $420K savings', priority: 'medium', type: 'optimization' },
];

function formatCurrency(value: number, compact = false) {
  if (compact) {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function ExecutiveSummary() {
  const [period, setPeriod] = useState('q1-2026');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            Executive Summary
          </h1>
          <p className="text-gray-500 mt-1">Company-wide portfolio overview &middot; Updated March 12, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="q1-2026">Q1 2026</SelectItem>
              <SelectItem value="q4-2025">Q4 2025</SelectItem>
              <SelectItem value="fy-2026">FY 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-1" /> Export Report
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Portfolio Value', value: formatCurrency(portfolioMetrics.totalBudget, true), change: '+12%', trend: 'up', icon: Briefcase, color: 'from-blue-500 to-blue-600' },
          { label: 'Spent to Date', value: formatCurrency(portfolioMetrics.totalSpent, true), change: '39% of budget', trend: 'neutral', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
          { label: 'On-Time Delivery', value: `${portfolioMetrics.onTimeRate}%`, change: '-3% vs target', trend: 'down', icon: Target, color: 'from-purple-500 to-purple-600' },
          { label: 'Safety Score', value: `${portfolioMetrics.safetyScore}%`, change: '+1.2% MoM', trend: 'up', icon: Shield, color: 'from-amber-500 to-amber-600' },
        ].map(kpi => (
          <Card key={kpi.label} className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className="text-2xl text-gray-900 mt-1">{kpi.value}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    kpi.trend === 'up' ? 'text-emerald-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {kpi.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                    {kpi.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                    {kpi.change}
                  </div>
                </div>
                <div className={`w-10 h-10 bg-gradient-to-br ${kpi.color} rounded-xl flex items-center justify-center`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Active Projects', value: portfolioMetrics.activeProjects, icon: Building2 },
          { label: 'Total Contractors', value: portfolioMetrics.totalContractors, icon: Users },
          { label: 'Open Risks', value: portfolioMetrics.openRisks, icon: AlertTriangle },
          { label: 'Critical Issues', value: portfolioMetrics.criticalIssues, icon: AlertTriangle },
          { label: 'Change Orders', value: portfolioMetrics.changeOrders, icon: Activity },
          { label: 'AI Savings', value: formatCurrency(portfolioMetrics.aiSavings, true), icon: Sparkles },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <stat.icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-lg text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Costs */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Costs (6-Month)</CardTitle>
            <CardDescription>Monthly financial performance across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costs" name="Costs" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Progress Trends */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Project Progress Trends</CardTitle>
            <CardDescription>Completion percentage across all active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="towerA" name="Tower A" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="riverside" name="Riverside" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="greentech" name="GreenTech" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="lakeside" name="Lakeside" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Budget Distribution</CardTitle>
            <CardDescription>Spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={budgetDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                  {budgetDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Safety Trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Safety Performance</CardTitle>
            <CardDescription>Incidents, near-misses, and safety score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={safetyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" name="Safety Score" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                <Area type="monotone" dataKey="incidents" name="Incidents" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Health */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Project Health Summary</CardTitle>
            <CardDescription>Budget utilization & schedule status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectPerformance.map(proj => (
              <div key={proj.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">{proj.name}</span>
                    <Badge className={`text-xs ${
                      proj.health === 'good' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {proj.schedule === 'on-track' ? 'On Track' : 'Delayed'}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">{proj.progress}%</span>
                </div>
                <Progress value={proj.progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Spent: ${proj.spent}M / ${proj.budget}M</span>
                  <span>{Math.round((proj.spent / proj.budget) * 100)}% budget used</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Key Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Executive Insights */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> AI Executive Insights
            </CardTitle>
            <CardDescription>AI-generated recommendations for leadership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsightsExec.map(insight => (
              <div key={insight.id} className={`p-3 rounded-lg border ${
                insight.priority === 'critical' ? 'border-red-200 bg-red-50' :
                insight.priority === 'high' ? 'border-amber-200 bg-amber-50' : 'border-gray-100'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm text-gray-900">{insight.title}</h4>
                      {insight.priority === 'critical' && <Badge className="bg-red-100 text-red-700 text-xs">Critical</Badge>}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{insight.desc}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-700">{insight.impact}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm"><ArrowRight className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Upcoming Milestones */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Key Upcoming Milestones
            </CardTitle>
            <CardDescription>Critical milestones across all projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: 'Level 15 Concrete Pour', project: 'Tower A', date: 'Mar 12', status: 'today', statusColor: 'bg-blue-100 text-blue-700' },
              { title: 'Facade Installation Start', project: 'Tower A', date: 'Mar 15', status: 'on-track', statusColor: 'bg-green-100 text-green-700' },
              { title: 'Roofing Completion', project: 'Riverside', date: 'Mar 16', status: 'at-risk', statusColor: 'bg-red-100 text-red-700' },
              { title: 'Foundation Inspection', project: 'GreenTech', date: 'Mar 17', status: 'on-track', statusColor: 'bg-green-100 text-green-700' },
              { title: 'Electrical Rough-In Complete', project: 'Riverside', date: 'Mar 20', status: 'on-track', statusColor: 'bg-green-100 text-green-700' },
              { title: 'Permit Decision', project: 'Lakeside', date: 'Mar 14', status: 'pending', statusColor: 'bg-amber-100 text-amber-700' },
              { title: 'Investor Site Visit', project: 'Tower A', date: 'Mar 19', status: 'scheduled', statusColor: 'bg-purple-100 text-purple-700' },
            ].map((milestone, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="w-12 text-center">
                  <p className="text-xs text-gray-400">{milestone.date.split(' ')[0]}</p>
                  <p className="text-lg text-gray-900">{milestone.date.split(' ')[1]}</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{milestone.title}</p>
                  <p className="text-xs text-gray-500">{milestone.project}</p>
                </div>
                <Badge className={`text-xs ${milestone.statusColor}`}>{milestone.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
