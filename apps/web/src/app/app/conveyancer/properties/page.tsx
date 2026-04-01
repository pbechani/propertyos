'use client';

import { Search, Home, Bed, Bath, Maximize, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { conveyancerApi, type ConveyancerProperty } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

const DISPLAY_STATUS: Record<string, { label: string; cls: string }> = {
  on_track:   { label: "On Track",   cls: "bg-green-100 text-green-700" },
  delayed:    { label: "Delayed",    cls: "bg-red-100 text-red-700" },
  closed:     { label: "Closed",     cls: "bg-gray-100 text-gray-700" },
  cancelled:  { label: "Cancelled",  cls: "bg-gray-100 text-gray-500" },
};

function formatPrice(price: string | null, currency: string | null) {
  if (!price) return "—";
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency ?? "ZAR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState<ConveyancerProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const result = await conveyancerApi.getProperties(token, { search: search || undefined, limit: 100 });
      setProperties(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => load(searchTerm), searchTerm ? 400 : 0);
    return () => clearTimeout(debounce);
  }, [searchTerm, load]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">
            Track property records and ownership details
            {!loading && ` — ${total} propert${total === 1 ? "y" : "ies"}`}
          </p>
        </div>
        <button
          onClick={() => load(searchTerm)}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address, case reference, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Properties Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {properties.map((property) => {
            const ds = DISPLAY_STATUS[property.display_status] ?? { label: property.display_status, cls: "bg-gray-100 text-gray-700" };
            return (
              <Link
                key={property.id}
                href={`/app/conveyancer/properties/${property.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Home className="w-16 h-16 text-white opacity-50" />
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
                      <p className="text-sm text-gray-500">{property.case_reference}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {property.property_type ?? "Property"}
                    </span>
                  </div>

                  {/* Property Features */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                    {property.bedrooms != null && (
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Bed className="w-4 h-4 text-gray-400" />
                        <span>{property.bedrooms} beds</span>
                      </div>
                    )}
                    {property.bathrooms != null && (
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Bath className="w-4 h-4 text-gray-400" />
                        <span>{property.bathrooms} baths</span>
                      </div>
                    )}
                    {property.area_sqm && (
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Maximize className="w-4 h-4 text-gray-400" />
                        <span>{property.area_sqm} m²</span>
                      </div>
                    )}
                  </div>

                  {/* Owner & Value */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Current Owner</p>
                      <p className="text-sm font-medium text-gray-900">{property.current_owner}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Asking Price</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(property.asking_price, property.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Verification & Case Status */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Verification</span>
                      <div className="flex items-center gap-2">
                        {property.verification_status === "verified" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {property.verification_status ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Case Status</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ds.cls}`}>
                        {ds.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No properties found{searchTerm ? " matching your search" : ""}</p>
        </div>
      )}
    </div>
  );
}
