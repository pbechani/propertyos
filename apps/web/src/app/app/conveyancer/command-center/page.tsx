'use client';

import { AlertTriangle, Clock, Shield, DollarSign, Activity, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { workflowStats, aiInsights, tasksList, activityLog } from "../_data/mockData";

export default function Page() {
  const casesByStage = [
    { stage: "Document Collection", count: 2, id: "doc-collection" },
    { stage: "Title Search", count: 1, id: "title-search" },
    { stage: "Contract Prep", count: 1, id: "contract-prep" },
    { stage: "Registration", count: 1, id: "registration" },
  ];

  const revenueData = [
    { month: "Oct", revenue: 38000 },
    { month: "Nov", revenue: 42000 },
    { month: "Dec", revenue: 39000 },
    { month: "Jan", revenue: 51000 },
    { month: "Feb", revenue: 48000 },
    { month: "Mar", revenue: 45600 },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981"];

  const statCards = [
    {
      title: "Active Cases",
      value: workflowStats.activeCases,
      icon: Activity,
      color: "blue",
      trend: "+2 this week",
    },
    {
      title: "Delayed Cases",
      value: workflowStats.delayedCases,
      icon: Clock,
      color: "red",
      trend: "Requires attention",
    },
    {
      title: "Completed (Month)",
      value: workflowStats.completedThisMonth,
      icon: CheckCircle,
      color: "green",
      trend: "+25% vs last month",
    },
    {
      title: "Revenue (Month)",
      value: `$${(workflowStats.revenue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: "purple",
      trend: "+12% growth",
    },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-l-yellow-500 bg-yellow-50";
      case "alert":
        return "border-l-red-500 bg-red-50";
      case "info":
        return "border-l-blue-500 bg-blue-50";
      case "success":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Shield className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Command Center</h1>
          <p className="text-gray-600 mt-1">Real-time legal operations intelligence</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium">March 11, 2026 - 10:30 AM</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <h3 className="text-sm text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-2">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      {/* AI Insights Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            AI Alerts &amp; Insights
          </h2>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
            {aiInsights.length} Active
          </span>
        </div>
        <div className="space-y-3">
          {aiInsights.map((insight, index) => (
            <div
              key={index}
              className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{insight.message}</h3>
                    <span className="text-xs text-gray-500">{insight.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{insight.details}</p>
                  <p className="text-sm text-purple-700 font-medium mt-2">
                    → {insight.action}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Stage */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cases by Stage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={casesByStage}
                dataKey="count"
                nameKey="stage"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {casesByStage.map((entry) => (
                  <Cell key={entry.id} fill={COLORS[casesByStage.indexOf(entry) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
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
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Tasks & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Tasks</h2>
          <div className="space-y-3">
            {tasksList.slice(0, 5).map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    task.priority === "High"
                      ? "bg-red-100 text-red-700"
                      : task.priority === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-500">{task.dueDate}</span>
                </div>
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-600">{task.caseId}</span>
                  <span className="text-sm text-gray-500">{task.assignedTo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activityLog.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === "alert" ? "bg-red-500" :
                  activity.type === "ai" ? "bg-purple-500" :
                  activity.type === "document" ? "bg-blue-500" :
                  "bg-green-500"
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
