'use client';

import { Download, TrendingUp, Calendar, FileText, DollarSign, Users, Briefcase, Clock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Page() {
  const caseCompletionData = [
    { month: "Oct", completed: 6, delayed: 2, id: "oct-data" },
    { month: "Nov", completed: 7, delayed: 3, id: "nov-data" },
    { month: "Dec", completed: 5, delayed: 1, id: "dec-data" },
    { month: "Jan", completed: 9, delayed: 2, id: "jan-data" },
    { month: "Feb", completed: 8, delayed: 1, id: "feb-data" },
    { month: "Mar", completed: 8, delayed: 2, id: "mar-data" },
  ];

  const revenueData = [
    { month: "Oct", revenue: 38000, id: "oct-rev" },
    { month: "Nov", revenue: 42000, id: "nov-rev" },
    { month: "Dec", revenue: 39000, id: "dec-rev" },
    { month: "Jan", revenue: 51000, id: "jan-rev" },
    { month: "Feb", revenue: 48000, id: "feb-rev" },
    { month: "Mar", revenue: 45600, id: "mar-rev" },
  ];

  const casesByType = [
    { type: "Residential Sale", count: 45, id: "res-sale" },
    { type: "Commercial", count: 8, id: "commercial" },
    { type: "Refinancing", count: 12, id: "refinance" },
    { type: "Transfer", count: 15, id: "transfer" },
  ];

  const staffPerformance = [
    { name: "Sarah Williams", casesCompleted: 12, avgDays: 28, revenue: 54000 },
    { name: "Michael Chen", casesCompleted: 10, avgDays: 32, revenue: 47000 },
    { name: "Jessica Brown", casesCompleted: 8, avgDays: 30, revenue: 38000 },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive business intelligence and insights</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Total Cases (YTD)</h3>
          <p className="text-3xl font-bold text-gray-900">127</p>
          <p className="text-xs text-green-600 mt-2">+18% from last year</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Revenue (YTD)</h3>
          <p className="text-3xl font-bold text-gray-900">$523K</p>
          <p className="text-xs text-green-600 mt-2">+24% from last year</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Avg Completion Time</h3>
          <p className="text-3xl font-bold text-gray-900">29 days</p>
          <p className="text-xs text-gray-500 mt-2">Industry avg: 35 days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Active Clients</h3>
          <p className="text-3xl font-bold text-gray-900">89</p>
          <p className="text-xs text-gray-500 mt-2">Across all cases</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Completion Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Case Completion Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caseCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="delayed" fill="#ef4444" name="Delayed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Type */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cases by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={casesByType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {casesByType.map((entry) => (
                  <Cell key={entry.id} fill={COLORS[casesByType.indexOf(entry) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Performance</h2>
          <div className="space-y-4">
            {staffPerformance.map((staff, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{staff.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    Top Performer
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Cases</p>
                    <p className="font-medium text-gray-900">{staff.casesCompleted}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Days</p>
                    <p className="font-medium text-gray-900">{staff.avgDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-medium text-gray-900">${(staff.revenue / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Monthly Performance</h3>
                <p className="text-sm text-gray-600 mt-1">Complete monthly overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last generated: Mar 1, 2026</span>
            </div>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Financial Summary</h3>
                <p className="text-sm text-gray-600 mt-1">Revenue and expenses</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last generated: Mar 5, 2026</span>
            </div>
          </button>

          <button className="border border-gray-200 rounded-lg p-4 text-left hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Client Report</h3>
                <p className="text-sm text-gray-600 mt-1">Client activity overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Last generated: Mar 8, 2026</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
