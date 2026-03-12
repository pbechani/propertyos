'use client';

import { Search, Plus, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { mockFinancials, workflowStats } from "../_data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFinancials = mockFinancials.filter((item) =>
    item.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const monthlyData = [
    { month: "Oct", revenue: 38000, expenses: 12000, id: "oct-2025" },
    { month: "Nov", revenue: 42000, expenses: 13500, id: "nov-2025" },
    { month: "Dec", revenue: 39000, expenses: 11800, id: "dec-2025" },
    { month: "Jan", revenue: 51000, expenses: 15200, id: "jan-2026" },
    { month: "Feb", revenue: 48000, expenses: 14300, id: "feb-2026" },
    { month: "Mar", revenue: 45600, expenses: 13900, id: "mar-2026" },
  ];

  const totalRevenue = workflowStats.revenue;
  const escrowBalance = workflowStats.escrowBalance;
  const pendingInvoices = filteredFinancials.filter((f) => f.status === "Pending").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
      case "Received":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "Overdue":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600 mt-1">Track revenue, invoices, and trust accounts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Monthly Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-2">+12% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Escrow Balance</h3>
          <p className="text-3xl font-bold text-gray-900">${escrowBalance.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Across {workflowStats.activeCases} active cases</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-sm text-gray-600 mb-1">Pending Invoices</h3>
          <p className="text-3xl font-bold text-gray-900">{pendingInvoices}</p>
          <p className="text-xs text-yellow-600 mt-2">Follow up required</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue vs Expenses</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by case ID, client, or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFinancials.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{item.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{item.caseId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{item.client}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      ${item.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`text-sm font-medium ${
                        item.status === "Paid" || item.status === "Received"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {"dueDate" in item ? (item as any).dueDate : "date" in item ? (item as any).date : "-"}
                    </span>
                    {"paidDate" in item && (item as any).paidDate && (
                      <p className="text-xs text-gray-500">Paid: {(item as any).paidDate}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFinancials.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-600">No financial records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
