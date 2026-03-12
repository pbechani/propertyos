'use client';

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Bed, Bath, Maximize, DollarSign, CheckCircle, AlertCircle, Calendar, MapPin, FileText, Edit } from "lucide-react";
import { mockProperties, mockCases } from "../../_data/mockData";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const property = mockProperties.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/app/conveyancer/properties"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const relatedCases = mockCases.filter(
    (c) => c.propertyAddress === property.address
  );

  const ownershipHistory = [
    {
      id: "1",
      owner: property.currentOwner,
      from: property.lastTransferDate,
      to: "Present",
      transferType: "Purchase",
    },
    {
      id: "2",
      owner: "Previous Owner Name",
      from: "2010-03-15",
      to: property.lastTransferDate,
      transferType: "Purchase",
    },
  ];

  const certificates = [
    {
      id: "1",
      name: "Electrical Compliance Certificate",
      status: "Valid",
      issueDate: "2025-11-20",
      expiryDate: "2030-11-20",
    },
    {
      id: "2",
      name: "Plumbing Certificate",
      status: "Valid",
      issueDate: "2025-10-15",
      expiryDate: "2030-10-15",
    },
    {
      id: "3",
      name: "Gas Compliance Certificate",
      status: "Expired",
      issueDate: "2020-05-10",
      expiryDate: "2025-05-10",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/app/conveyancer/properties"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Properties
        </Link>

        {/* Property Hero */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Home className="w-24 h-24 text-white opacity-50" />
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.address}</h1>
                <p className="text-gray-600">{property.id}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
                    {property.type}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    property.titleStatus === "Clear" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    Title {property.titleStatus}
                  </span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Edit className="w-4 h-4" />
                Edit Property
              </button>
            </div>

            {/* Property Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Bed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="text-xl font-bold text-gray-900">{property.bedrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Bath className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="text-xl font-bold text-gray-900">{property.bathrooms}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Maximize className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="text-xl font-bold text-gray-900">{property.area} sqft</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Value</p>
                  <p className="text-xl font-bold text-gray-900">${(property.value / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </div>

            {/* Current Owner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Owner</p>
                <p className="font-medium text-gray-900">{property.currentOwner}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Mortgage Status</p>
                <p className={`font-medium ${
                  property.mortgageStatus === "None" || property.mortgageStatus === "Paid Off"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}>
                  {property.mortgageStatus}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Transfer</p>
                <p className="font-medium text-gray-900">{property.lastTransferDate}</p>
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
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Buyer: </span>
                        <span className="text-gray-900">{caseItem.buyer}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Seller: </span>
                        <span className="text-gray-900">{caseItem.seller}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No active cases for this property</p>
            )}
          </div>

          {/* Ownership History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ownership History</h2>
            <div className="space-y-4">
              {ownershipHistory.map((record, index) => (
                <div key={record.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-green-500" : "bg-gray-400"}`}></div>
                    {index < ownershipHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h3 className="font-medium text-gray-900">{record.owner}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {record.from} - {record.to}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Transfer Type: {record.transferType}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Certificates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Certificates</h2>
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{cert.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      cert.status === "Valid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {cert.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">Issued: </span>
                      {cert.issueDate}
                    </div>
                    <div>
                      <span className="text-gray-500">Expires: </span>
                      {cert.expiryDate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="font-medium text-gray-900">{property.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Title Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {property.titleStatus === "Clear" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="font-medium text-gray-900">{property.titleStatus}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mortgage Status</p>
                <p className="font-medium text-gray-900">{property.mortgageStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Property Value</p>
                <p className="text-xl font-bold text-gray-900">${property.value.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <FileText className="w-4 h-4" />
                View Title Deed
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <MapPin className="w-4 h-4" />
                Title Search
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Calendar className="w-4 h-4" />
                View History
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mt-3">{property.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
