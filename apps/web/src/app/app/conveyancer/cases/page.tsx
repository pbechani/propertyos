'use client';

import { Search, Plus, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { mockCases } from "../_data/mockData";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCases = mockCases.filter((caseItem) => {
    const matchesSearch =
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      statusFilter === "all" || caseItem.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all conveyancing cases</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          New Case
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by case ID, buyer, seller, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Status</option>
            <option value="On Track">On Track</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((caseItem) => (
          <Link
            key={caseItem.id}
            href={`/app/conveyancer/cases/${caseItem.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{caseItem.id}</h3>
                <p className="text-sm text-gray-500 mt-1">{caseItem.propertyAddress}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                caseItem.status === "On Track" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {caseItem.status}
              </span>
            </div>

            {/* Parties */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Buyer</span>
                <span className="text-gray-900 font-medium">{caseItem.buyer}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Seller</span>
                <span className="text-gray-900 font-medium">{caseItem.seller}</span>
              </div>
            </div>

            {/* Stage & Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{caseItem.stage}</span>
                <span className="text-sm font-medium text-gray-900">{caseItem.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    caseItem.progress >= 75 ? "bg-green-600" :
                    caseItem.progress >= 50 ? "bg-blue-600" :
                    "bg-yellow-600"
                  }`}
                  style={{ width: `${caseItem.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-500">Priority</p>
                <span className={`font-medium ${
                  caseItem.priority === "High" ? "text-red-600" :
                  caseItem.priority === "Medium" ? "text-yellow-600" :
                  "text-green-600"
                }`}>
                  {caseItem.priority}
                </span>
              </div>
              <div>
                <p className="text-gray-500">Next Deadline</p>
                <p className="font-medium text-gray-900">{caseItem.nextDeadline}</p>
              </div>
            </div>

            {/* Missing Docs */}
            {caseItem.missingDocuments.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{caseItem.missingDocuments.length} missing document{caseItem.missingDocuments.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No cases found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
