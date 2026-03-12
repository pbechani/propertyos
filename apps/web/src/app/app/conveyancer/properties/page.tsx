'use client';

import { Search, Plus, Home, Bed, Bath, Maximize, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { mockProperties } from "../_data/mockData";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProperties = mockProperties.filter((property) =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.currentOwner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTitleStatusIcon = (status: string) => {
    return status === "Clear" ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertCircle className="w-5 h-5 text-yellow-600" />
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">Track property records and ownership details</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          Add Property
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address, property ID, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProperties.map((property) => (
          <Link
            key={property.id}
            href={`/app/conveyancer/properties/${property.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image Placeholder */}
            <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Home className="w-16 h-16 text-white opacity-50" />
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
                  <p className="text-sm text-gray-500">{property.id}</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  {property.type}
                </span>
              </div>

              {/* Property Features */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <Bed className="w-4 h-4 text-gray-400" />
                  <span>{property.bedrooms} beds</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <Bath className="w-4 h-4 text-gray-400" />
                  <span>{property.bathrooms} baths</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <Maximize className="w-4 h-4 text-gray-400" />
                  <span>{property.area} sqft</span>
                </div>
              </div>

              {/* Owner & Status */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Current Owner</p>
                  <p className="text-sm font-medium text-gray-900">{property.currentOwner}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Property Value</p>
                  <p className="text-sm font-medium text-gray-900">
                    ${property.value.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Title & Mortgage Status */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Title Status</span>
                  <div className="flex items-center gap-2">
                    {getTitleStatusIcon(property.titleStatus)}
                    <span className="text-sm font-medium text-gray-900">
                      {property.titleStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mortgage Status</span>
                  <span className={`text-sm font-medium ${
                    property.mortgageStatus === "None" || property.mortgageStatus === "Paid Off"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}>
                    {property.mortgageStatus}
                  </span>
                </div>
              </div>

              {/* Last Transfer */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Last Transfer Date</p>
                <p className="text-sm font-medium text-gray-900">{property.lastTransferDate}</p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View History
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Title Search
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No properties found matching your search</p>
        </div>
      )}
    </div>
  );
}
