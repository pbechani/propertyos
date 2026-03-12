'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle, Clock, Calendar, DollarSign, FileText, Users, MessageSquare, TrendingUp, Phone, Mail, Plus, Edit, Download } from "lucide-react";
import { useState } from "react";
import { getCaseDetail } from "../../_data/caseDetailData";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const caseData = getCaseDetail(id || "");

  if (!caseData) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Not Found</h2>
          <p className="text-gray-600 mb-6">The case you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/app/conveyancer/cases"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "tasks", label: "Tasks", icon: CheckCircle },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "communications", label: "Communications", icon: MessageSquare },
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-700";
      case "Delayed":
        return "bg-red-100 text-red-700";
      case "Completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "In Progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-8">
          <Link
            href="/app/conveyancer/cases"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{caseData.id}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  caseData.priority === "High" ? "bg-red-100 text-red-700" :
                  caseData.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {caseData.priority} Priority
                </span>
              </div>
              <p className="text-lg text-gray-600 mb-4">{caseData.propertyAddress}</p>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {caseData.createdDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{caseData.daysActive} days active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Assigned to: {caseData.assignedTo}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Edit className="w-4 h-4" />
                Edit Case
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{caseData.stage}</span>
              <span className="text-sm text-gray-600">{caseData.progress}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  caseData.progress >= 75 ? "bg-green-600" :
                  caseData.progress >= 50 ? "bg-blue-600" :
                  "bg-yellow-600"
                }`}
                style={{ width: `${caseData.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Insights */}
              {caseData.aiInsights.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h2>
                  <div className="space-y-3">
                    {caseData.aiInsights.map((insight: any, index: number) => (
                      <div
                        key={index}
                        className={`border-l-4 p-4 rounded-r-lg ${
                          insight.type === "warning" ? "border-l-yellow-500 bg-yellow-50" :
                          insight.type === "alert" ? "border-l-red-500 bg-red-50" :
                          "border-l-blue-500 bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className={`w-5 h-5 mt-0.5 ${
                            insight.type === "warning" ? "text-yellow-600" :
                            insight.type === "alert" ? "text-red-600" :
                            "text-blue-600"
                          }`} />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{insight.message}</h3>
                            <p className="text-sm text-gray-700 mt-1">{insight.details}</p>
                            <p className="text-sm text-purple-700 font-medium mt-2">
                              → {insight.recommendation}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">{insight.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Milestones</h2>
                <div className="space-y-4">
                  {caseData.milestones.map((milestone: any, index: number) => (
                    <div key={milestone.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        {getMilestoneIcon(milestone.status)}
                        {index < caseData.milestones.length - 1 && (
                          <div className={`w-0.5 h-12 mt-2 ${
                            milestone.status === "Completed" ? "bg-green-600" : "bg-gray-300"
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium ${
                            milestone.status === "Completed" ? "text-gray-900" :
                            milestone.status === "In Progress" ? "text-blue-900" :
                            "text-gray-600"
                          }`}>
                            {milestone.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            milestone.status === "Completed" ? "bg-green-100 text-green-700" :
                            milestone.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          {milestone.completedDate ? (
                            <span>Completed: {milestone.completedDate}</span>
                          ) : (
                            <span>Due: {milestone.dueDate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Case Notes</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Add Note
                  </button>
                </div>
                <div className="space-y-4">
                  {caseData.notes.map((note: any) => (
                    <div key={note.id} className="border-l-4 border-l-purple-500 bg-purple-50 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{note.author}</span>
                        <span className="text-xs text-gray-500">{note.date}</span>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-200 text-purple-800 rounded">
                        {note.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Parties Involved */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Parties Involved</h2>

                {/* Buyer */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Buyer</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      caseData.buyer.kycStatus === "Verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {caseData.buyer.kycStatus}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{caseData.buyer.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{caseData.buyer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{caseData.buyer.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Seller */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Seller</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      caseData.seller.kycStatus === "Verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {caseData.seller.kycStatus}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{caseData.seller.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{caseData.seller.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{caseData.seller.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Agent */}
                <div>
                  <span className="text-sm text-gray-500">Real Estate Agent</span>
                  <h3 className="font-medium text-gray-900 mb-1 mt-2">{caseData.agent.name}</h3>
                  <p className="text-sm text-gray-600">{caseData.agent.agency}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{caseData.agent.phone}</span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Purchase Price</span>
                    <span className="font-medium text-gray-900">${caseData.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Deposit (10%)</span>
                    <span className="font-medium text-green-600">${caseData.deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Transfer Duty</span>
                    <span className="font-medium text-gray-900">${caseData.transferDuty.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Legal Fees</span>
                    <span className="font-medium text-gray-900">${caseData.legalFees.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-medium text-gray-900">Total Costs</span>
                    <span className="font-bold text-gray-900">
                      ${(caseData.transferDuty + caseData.legalFees).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <FileText className="w-4 h-4" />
                    Generate Document
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                    Export Case Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Case Tasks</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
            <div className="space-y-4">
              {caseData.tasks.map((task: any) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          task.priority === "High" ? "bg-red-100 text-red-700" :
                          task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          task.status === "Completed" ? "bg-green-100 text-green-700" :
                          task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Assigned to: {task.assignedTo}</span>
                        <span>•</span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Case Documents</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Upload Document
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caseData.documents.map((doc: any) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                      <p className="text-sm text-gray-500">{doc.size}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        {doc.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        doc.status === "Signed" || doc.status === "Verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Uploaded: {doc.uploadDate}</p>
                    <p>By: {doc.uploadedBy}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 mb-3">
                    <CheckCircle className="w-4 h-4" />
                    <span>{doc.aiAnalysis}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      View
                    </button>
                    <button className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Financial Transactions</h2>
            <div className="space-y-4">
              {caseData.financials.map((item: any) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{item.type}</h3>
                    <span className={`px-3 py-1 text-sm font-medium rounded ${
                      item.status === "Received" || item.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    ${item.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <p className="text-sm text-gray-500">
                    {item.date ? `Date: ${item.date}` : `Due: ${item.dueDate}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "communications" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>
            <div className="space-y-3">
              {caseData.communications.map((comm: any) => (
                <div key={comm.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        comm.type === "email" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {comm.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{comm.date}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{comm.subject}</h3>
                  <p className="text-sm text-gray-600 mb-2">{comm.preview}</p>
                  <div className="text-xs text-gray-500">
                    <span>From: {comm.from}</span>
                    <span className="mx-2">→</span>
                    <span>To: {comm.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Case Timeline</h2>
            <div className="space-y-4">
              {caseData.timeline.map((event: any) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      event.type === "alert" ? "bg-red-500" :
                      event.type === "document" ? "bg-blue-500" :
                      event.type === "communication" ? "bg-green-500" :
                      event.type === "task" ? "bg-yellow-500" :
                      "bg-purple-500"
                    }`}></div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{event.action}</h3>
                      <span className="text-sm text-gray-500">{event.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{event.details}</p>
                    <p className="text-xs text-gray-500">{event.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
