'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Target,
  Activity
} from 'lucide-react';
import { mockFinancialData, mockProjects } from '@/views/construction/data/mockData';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export function FinancialDashboard() {
  const [selectedProject, setSelectedProject] = useState('p1');
  const financial = mockFinancialData;

  // Calculate key metrics
  const budgetUsedPercentage = (financial.spentToDate / financial.totalBudget) * 100;
  
  // Prepare data for charts
  const categoryChartData = financial.categories.map(cat => ({
    name: cat.category,
    budgeted: cat.budgeted / 1000000,
    spent: cat.spent / 1000000,
    committed: cat.committed / 1000000,
    remaining: cat.remaining / 1000000
  }));

  const pieChartData = financial.categories.map(cat => ({
    name: cat.category,
    value: cat.spent,
    percentage: cat.percentage
  }));

  const cashFlowData = financial.monthlyData.map(item => ({
    month: item.month,
    cashIn: item.cashIn / 1000000,
    cashOut: item.cashOut / 1000000,
    netCashFlow: item.netCashFlow / 1000000
  }));

  const forecastData = financial.monthlyData.map(item => ({
    month: item.month,
    budgeted: item.budgeted / 1000000,
    actual: item.actual > 0 ? item.actual / 1000000 : null,
    forecast: item.forecast / 1000000
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-500 mt-1">{financial.projectName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {mockProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(financial.totalBudget / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500 mt-1">Allocated funds</p>
              </div>
              <Wallet className="w-10 h-10 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Spent to Date</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(financial.spentToDate / 1000000).toFixed(1)}M
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {budgetUsedPercentage.toFixed(1)}%
                  </Badge>
                  <span className="text-xs text-gray-500">of budget</span>
                </div>
              </div>
              <CreditCard className="w-10 h-10 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Remaining Budget</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(financial.remaining / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500 mt-1">Available funds</p>
              </div>
              <Target className="w-10 h-10 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Variance</p>
                <p className={`text-2xl font-bold ${financial.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${Math.abs(financial.variance / 1000000).toFixed(1)}M
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {financial.variance < 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-red-600">Over budget</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">Under budget</span>
                    </>
                  )}
                </div>
              </div>
              <Activity className="w-10 h-10 text-orange-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Budget Usage by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Amount ($M)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}M`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="budgeted" fill="#93C5FD" name="Budgeted" />
                <Bar dataKey="spent" fill="#3B82F6" name="Spent" />
                <Bar dataKey="committed" fill="#1D4ED8" name="Committed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Expense Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieChartData.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Cash Flow Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="colorCashIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCashOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                label={{ value: 'Amount ($M)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}M`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="cashIn" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorCashIn)"
                name="Cash In"
              />
              <Area 
                type="monotone" 
                dataKey="cashOut" 
                stroke="#EF4444" 
                fillOpacity={1} 
                fill="url(#colorCashOut)"
                name="Cash Out"
              />
              <Line 
                type="monotone" 
                dataKey="netCashFlow" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Net Cash Flow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Forecast Spending */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            Budget vs Actual vs Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis 
                label={{ value: 'Spending ($M)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => value ? `$${value.toFixed(2)}M` : 'N/A'}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="budgeted" 
                stroke="#94A3B8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Budgeted"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Actual"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#F59E0B" 
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Forecast"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">Forecast Alert</p>
                <p className="text-xs text-orange-700 mt-1">
                  Project is forecasted to exceed budget by ${Math.abs(financial.variance / 1000000).toFixed(1)}M ({Math.abs(financial.variancePercentage).toFixed(1)}%). 
                  Review spending in high-variance categories.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Budgeted
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Spent
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      % Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financial.categories.map((cat) => (
                    <tr key={cat.category} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-900">
                          ${(cat.budgeted / 1000000).toFixed(2)}M
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ${(cat.spent / 1000000).toFixed(2)}M
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge 
                          className={
                            cat.percentage > 90 
                              ? 'bg-red-100 text-red-800' 
                              : cat.percentage > 75 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {cat.percentage.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-gray-900">Total</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        ${(financial.totalBudget / 1000000).toFixed(2)}M
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        ${(financial.spentToDate / 1000000).toFixed(2)}M
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge className="bg-blue-100 text-blue-800 font-bold">
                        {budgetUsedPercentage.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financial.expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                          <p className="text-xs text-gray-500">{expense.vendor}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ${expense.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          className={
                            expense.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : expense.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {expense.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
