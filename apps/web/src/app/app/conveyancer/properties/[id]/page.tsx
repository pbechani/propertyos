'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Bed, Bath, Maximize, DollarSign, CheckCircle, AlertCircle, Calendar, MapPin, FileText, RefreshCw } from "lucide-react";
import { conveyancerApi, type ConveyancerPropertyDetail, type ConveyancerPropertyOwnership, type ConveyancerPropertyDoc } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

function formatDate(val: string | null | undefined) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | null | undefined, currency?: string | null) {
  if (!price) return "—";
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency ?? "ZAR",
    maximumFractionDigits: 0,
  }).format(num);
}

type PropertyRow = Record<string, unknown>;
type CaseRow = Record<string, unknown> & {
  id: string;
  case_reference: string;
  status: string;
  display_status: string;
  buyer_name: string;
  seller_name: string;
  agreed_price?: string;
  currency?: string;
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ConveyancerPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const token = getAccessToken();
    if (!token) { setError("Not authenticated"); setLoading(false); return; }
    conveyancerApi.getPropertyDetail(token, id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load property"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="h-64 bg-gray-200" />
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error ? "Error" : "Property Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">{error ?? "The property you&apos;re looking for doesn&apos;t exist."}</p>
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

  const property = detail.property as PropertyRow;
  const cases = detail.cases as CaseRow[];
  const ownershipHistory = detail.ownershipHistory as ConveyancerPropertyOwnership[];
  const documents = detail.documents as ConveyancerPropertyDoc[];

  const verificationStatus = property.verification_status as string | null;
  const titleType = property.title_type as string | null;
  const propAddress = (property.address ?? property.title ?? "—") as string;
  const propId = property.id as string;
  const propType = property.property_type as string | undefined;
  const propBedrooms = property.bedrooms as number | null;
  const propBathrooms = property.bathrooms as number | null;
  const propAreaSqm = property.area_sqm as string | null;
  const propPrice = property.price as string | null;
  const propCurrency = property.currency as string | null;
  const propOwner = (property.current_owner ?? "—") as string;
  const propCity = property.city as string | undefined;
  const propZoning = property.zoning as string | undefined;
  const propRegion = property.region as string | undefined;

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {propAddress}
                </h1>
                <p className="text-gray-600">{propId}</p>
                <div className="flex items-center gap-2 mt-3">
                  {propType && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">
                      {propType}
                    </span>
                  )}
                  {verificationStatus && (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      verificationStatus === "verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {verificationStatus === "verified" ? "Verified" : "Pending Verification"}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Property Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-gray-200">
              {propBedrooms != null && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Bed className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="text-xl font-bold text-gray-900">{propBedrooms}</p>
                  </div>
                </div>
              )}
              {propBathrooms != null && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Bath className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="text-xl font-bold text-gray-900">{propBathrooms}</p>
                  </div>
                </div>
              )}
              {propAreaSqm && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Maximize className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Area</p>
                    <p className="text-xl font-bold text-gray-900">{propAreaSqm} m²</p>
                  </div>
                </div>
              )}
              {propPrice && (
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(propPrice, propCurrency)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Current Owner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Owner</p>
                <p className="font-medium text-gray-900">{propOwner}</p>
              </div>
              {titleType && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Title Type</p>
                  <p className="font-medium text-gray-900">{titleType}</p>
                </div>
              )}
              {propCity && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">City</p>
                  <p className="font-medium text-gray-900">{propCity}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Cases */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Conveyancing Cases ({cases.length})
            </h2>
            {cases.length > 0 ? (
              <div className="space-y-3">
                {cases.map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    href={`/app/conveyancer/cases/${caseItem.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{caseItem.case_reference}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        caseItem.display_status === "on_track"
                          ? "bg-green-100 text-green-700"
                          : caseItem.display_status === "delayed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {caseItem.display_status === "on_track" ? "On Track"
                          : caseItem.display_status === "delayed" ? "Delayed"
                          : caseItem.display_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Buyer: </span>
                        <span className="text-gray-900">{caseItem.buyer_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Seller: </span>
                        <span className="text-gray-900">{caseItem.seller_name}</span>
                      </div>
                      {caseItem.agreed_price && (
                        <div>
                          <span className="text-gray-500">Price: </span>
                          <span className="text-gray-900">{formatPrice(caseItem.agreed_price, caseItem.currency)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No conveyancing cases for this property</p>
            )}
          </div>

          {/* Ownership History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ownership History ({ownershipHistory.length})
            </h2>
            {ownershipHistory.length > 0 ? (
              <div className="space-y-4">
                {ownershipHistory.map((record, index) => (
                  <div key={record.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-green-500" : "bg-gray-400"}`} />
                      {index < ownershipHistory.length - 1 && (
                        <div className="w-0.5 h-full min-h-[2rem] bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <h3 className="font-medium text-gray-900">{record.owner_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(record.transfer_date)}
                        {index === 0 ? " – Present" : ""}
                      </p>
                      {record.transfer_price && (
                        <p className="text-sm text-gray-500 mt-1">
                          Transfer price: {formatPrice(record.transfer_price, record.transfer_currency)}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No ownership history recorded</p>
            )}
          </div>

          {/* Compliance Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance Documents ({documents.length})
            </h2>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{doc.document_name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        doc.status === "approved" || doc.status === "valid"
                          ? "bg-green-100 text-green-700"
                          : doc.status === "expired" || doc.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-500">Type: </span>
                        {doc.document_type}
                      </div>
                      <div>
                        <span className="text-gray-500">Created: </span>
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No compliance documents found</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="space-y-3">
              {propType && (
                <div>
                  <p className="text-sm text-gray-500">Property Type</p>
                  <p className="font-medium text-gray-900">{propType}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Verification</p>
                <div className="flex items-center gap-2 mt-1">
                  {verificationStatus === "verified" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="font-medium text-gray-900 capitalize">{verificationStatus ?? "—"}</span>
                </div>
              </div>
              {titleType && (
                <div>
                  <p className="text-sm text-gray-500">Title Type</p>
                  <p className="font-medium text-gray-900">{titleType}</p>
                </div>
              )}
              {propZoning && (
                <div>
                  <p className="text-sm text-gray-500">Zoning</p>
                  <p className="font-medium text-gray-900">{propZoning}</p>
                </div>
              )}
              {propPrice && (
                <div>
                  <p className="text-sm text-gray-500">Listed Price</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(propPrice, propCurrency)}
                  </p>
                </div>
              )}
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
            <p className="text-sm text-gray-600 mt-3">{propAddress}</p>
            {propRegion && (
              <p className="text-xs text-gray-500 mt-1">{propRegion}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
