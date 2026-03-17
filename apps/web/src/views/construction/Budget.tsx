'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { mockProjects, mockBudgets } from '@/views/construction/data/mockData';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const cashFlowData = [
  { month: 'Oct', income: 4200, expenses: 3800 },
  { month: 'Nov', income: 5100, expenses: 4600 },
  { month: 'Dec', income: 4800, expenses: 5200 },
  { month: 'Jan', income: 6200, expenses: 5800 },
  { month: 'Feb', income: 7100, expenses: 6400 },
  { month: 'Mar', income: 6800, expenses: 7200 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function Budget() {
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const spentPercentage = (totalSpent / totalBudget) * 100;

  const categoryTotals = mockBudgets.reduce((acc, budget) => {
    const existing = acc.find(item => item.category === budget.category);
    if (existing) {
      existing.value += budget.spent;
    } else {
      acc.push({ category: budget.category, value: budget.spent });
    }
    return acc;
  }, [] as { category: string; value: number }[]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget & Financial Control</h1>
          <p className="text-gray-500 mt-1">Monitor spending and financial performance</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-3xl font-bold mt-2">${(totalBudget / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold mt-2">${(totalSpent / 1000000).toFixed(1)}M</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-orange-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{spentPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-3xl font-bold mt-2">${(totalRemaining / 1000000).toFixed(1)}M</p>
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{(100 - spentPercentage).toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variance Alerts</p>
                <p className="text-3xl font-bold mt-2">
                  {mockBudgets.filter(b => Math.abs(b.variance) > 5).length}
                </p>
                <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Requires attention</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Budget allocation across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryTotals}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryTotals.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Income vs Expenses (in thousands)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Details by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details by Category</CardTitle>
          <CardDescription>Detailed breakdown of all budget categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockBudgets.map((budget) => (
              <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{budget.category}</h4>
                    <Badge variant={budget.variance < 0 ? 'destructive' : 'default'}>
                      {budget.variance > 0 ? '+' : ''}{budget.variance.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      ${(budget.spent / 1000000).toFixed(2)}M / ${(budget.allocated / 1000000).toFixed(2)}M
                    </p>
                  </div>
                </div>

                <Progress value={(budget.spent / budget.allocated) * 100} className="mb-3" />

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Allocated</p>
                    <p className="font-medium">${(budget.allocated / 1000000).toFixed(2)}M</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Spent</p>
                    <p className="font-medium">${(budget.spent / 1000000).toFixed(2)}M</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Committed</p>
                    <p className="font-medium">${(budget.committed / 1000000).toFixed(2)}M</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-medium text-green-600">${(budget.remaining / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Budget by Project</CardTitle>
          <CardDescription>Financial overview per project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.type}</p>
                  </div>
                  <Badge variant={project.spent > project.budget ? 'destructive' : 'default'}>
                    {((project.spent / project.budget) * 100).toFixed(1)}% spent
                  </Badge>
                </div>

                <Progress value={(project.spent / project.budget) * 100} className="mb-3" />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Budget</p>
                    <p className="font-medium">${(project.budget / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Spent</p>
                    <p className="font-medium">${(project.spent / 1000000).toFixed(1)}M</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Remaining</p>
                    <p className="font-medium text-green-600">
                      ${((project.budget - project.spent) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
