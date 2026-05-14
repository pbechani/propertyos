'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Shield, AlertCircle, CheckCircle, FileText, Briefcase, Edit } from "lucide-react";
import { mockClients, mockCases, mockDocuments } from "../../_data/mockData";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const client = mockClients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
          <p className="text-gray-600 mb-6">The client you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/app/conveyancer/clients"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  const relatedCases = mockCases.filter(
    (c) => c.buyer === client.name || c.seller === client.name
  );

  const relatedDocuments = mockDocuments.filter(
    (doc) => doc.uploadedBy === client.name
  );

  const timeline = [
    {
      id: "1",
      date: "2026-03-11",
      action: "Document uploaded",
      details: "Uploaded ID verification document",
    },
    {
      id: "2",
      date: "2026-03-10",
      action: "KYC verification completed",
      details: "Identity verified successfully",
    },
    {
      id: "3",
      date: "2026-02-15",
      action: "Client registered",
      details: "Profile created in system",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/app/conveyancer/clients"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {client.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-gray-600">{client.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    client.type === "Buyer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {client.type}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    client.kycStatus === "Verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {client.kycStatus}
                  </span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Edit className="w-4 h-4" />
              Edit Client
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{client.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Risk Score</p>
                <p className={`font-medium ${
                  client.riskScore === "Low" ? "text-green-600" :
                  client.riskScore === "Medium" ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {client.riskScore}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Cases */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Cases</h2>
            {relatedCases.length > 0 ? (
              <div className="space-y-3">
                {relatedCases.map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    href={`/app/conveyancer/cases/${caseItem.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{caseItem.id}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        caseItem.status === "On Track" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {caseItem.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{caseItem.propertyAddress}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Stage: {caseItem.stage}</span>
                      <span>•</span>
                      <span>Progress: {caseItem.progress}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No active cases</p>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
            {relatedDocuments.length > 0 ? (
              <div className="space-y-3">
                {relatedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-500">{doc.type} • {doc.uploadDate}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      doc.status === "Verified" || doc.status === "Signed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No documents uploaded</p>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              {timeline.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{item.action}</h3>
                      <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Active Cases</span>
                  <span className="text-2xl font-bold text-gray-900">{client.activeCases}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Documents Uploaded</span>
                  <span className="text-2xl font-bold text-gray-900">{relatedDocuments.length}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="text-sm font-medium text-gray-900">{client.lastActivity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Mail className="w-4 h-4" />
                Send Email
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <FileText className="w-4 h-4" />
                Request Document
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Briefcase className="w-4 h-4" />
                Create New Case
              </button>
            </div>
          </div>

          {/* Compliance Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">KYC Status</span>
                <div className="flex items-center gap-2">
                  {client.kycStatus === "Verified" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    client.kycStatus === "Verified" ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {client.kycStatus}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AML Check</span>
                <span className="text-sm font-medium text-green-600">Passed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Risk Rating</span>
                <span className={`text-sm font-medium ${
                  client.riskScore === "Low" ? "text-green-600" :
                  client.riskScore === "Medium" ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {client.riskScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
