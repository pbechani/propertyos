'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/lib/router-compat";
import {
  ChevronLeft, Shield, MapPin, Bed, Bath, Maximize,
  CheckCircle2, Calendar, DollarSign, Plus, X, Search, Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { propertiesApi, type ComparisonProperty, type PropertyComparison } from "@/lib/api-client";

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop";
const MAX_COMPARE = 4;

function formatMoney(price: string, currency: string) {
  const value = parseFloat(price);
  if (!Number.isFinite(value)) return price;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency || "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

function isWinner(propertyId: string, values: Array<{ propertyId: string; value: number | null }>, winner: string | null) {
  return winner === propertyId;
}

export default function PropertyComparison() {
  const searchParams = useSearchParams();

  // IDs managed in local state (adds/removes update the compare URL)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const raw = searchParams.get("ids") ?? "";
    return raw ? raw.split(",").filter(Boolean).slice(0, MAX_COMPARE) : [];
  });

  const [comparison, setComparison] = useState<PropertyComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Search-to-add state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ComparisonProperty[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch comparison whenever selectedIds changes
  useEffect(() => {
    if (selectedIds.length < 2) {
      setComparison(null);
      return;
    }
    setIsLoading(true);
    setError("");
    propertiesApi
      .compare(selectedIds)
      .then(setComparison)
      .catch(() => setError("Unable to load comparison. Please try again."))
      .finally(() => setIsLoading(false));
  }, [selectedIds]);

  // Debounced property search for the add-property widget
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await propertiesApi.search({ search: searchQuery.trim(), limit: 6 });
        // Map to ComparisonProperty shape for display
        setSearchResults(
          res.data.map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            currency: p.currency,
            area_sqm: p.area_sqm != null ? String(p.area_sqm) : null,
            floor_area_sqm: null,
            bedrooms: p.bedrooms ?? null,
            bathrooms: p.bathrooms ?? null,
            monthly_levy: null,
            verification_status: p.verification_status ?? "unverified",
            status: p.status,
            property_type: p.property_type,
            city: p.location?.city ?? null,
            created_at: p.created_at,
            media_url: p.media?.find((m) => m.is_primary)?.url ?? p.media?.[0]?.url ?? null,
          })),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchQuery]);

  const addProperty = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_COMPARE) return;
    setSelectedIds((prev) => [...prev, id]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeProperty = (id: string) => {
    setSelectedIds((prev) => prev.filter((p) => p !== id));
  };

  // Lookup helpers
  const properties = comparison?.comparison ? comparison.properties : [];
  const comp = comparison?.comparison;

  const getCellClass = (propertyId: string, winnerPropertyId: string | null, lowerIsBetter = false) => {
    if (!winnerPropertyId) return "";
    if (winnerPropertyId !== propertyId) return "";
    return lowerIsBetter ? "bg-green-50 font-bold text-green-700" : "bg-blue-50 font-bold";
  };

  const colSpan = selectedIds.length + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link to="/app/listings" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Listings</span>
              </Link>
              <h1 className="text-2xl font-bold">Property Comparison</h1>
              <p className="text-sm text-gray-600">Compare up to {MAX_COMPARE} properties side-by-side</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* Property selector strip */}
        <div className="flex flex-wrap gap-3 items-start">
          {selectedIds.map((id) => {
            const prop = properties.find((p) => p.id === id);
            return (
              <div key={id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-gray-100">
                  <img
                    src={prop?.media_url ?? DEFAULT_PROPERTY_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium max-w-40 truncate">
                  {prop?.title ?? id.slice(0, 8) + "…"}
                </span>
                <button
                  onClick={() => removeProperty(id)}
                  aria-label="Remove property from comparison"
                  className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {selectedIds.length < MAX_COMPARE && (
            <div className="relative">
              <div className="flex items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg px-3 py-2 min-w-50">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search to add property…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm outline-none flex-1 bg-transparent placeholder:text-gray-400"
                />
                {isSearching && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => addProperty(r.id)}
                      disabled={selectedIds.includes(r.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left disabled:opacity-40"
                    >
                      <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-gray-100">
                        <img src={r.media_url ?? DEFAULT_PROPERTY_IMAGE} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.title}</div>
                        <div className="text-xs text-gray-500 truncate">{r.city ?? r.property_type}</div>
                      </div>
                      <Plus className="w-4 h-4 text-blue-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* States */}
        {selectedIds.length < 2 && (
          <Card className="text-center py-16 text-gray-400">
            <Maximize className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="font-medium text-gray-500 mb-1">Add at least 2 properties to compare</p>
            <p className="text-sm">Search for properties above or navigate here from a listing page</p>
          </Card>
        )}

        {selectedIds.length >= 2 && isLoading && (
          <Card className="text-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
            <p className="text-sm">Loading comparison…</p>
          </Card>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Comparison table */}
        {!isLoading && comparison && properties.length >= 2 && (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-6">
              {properties.map((property) => {
                const pricePerSqm = comp?.pricePerSqm.values.find((v) => v.propertyId === property.id)?.value;
                const dom = comp?.daysOnMarket.values.find((v) => v.propertyId === property.id)?.value;
                return (
                  <Card key={property.id} className="overflow-hidden">
                    <img
                      src={property.media_url ?? DEFAULT_PROPERTY_IMAGE}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{property.title}</h3>
                          {property.verification_status === "verified" && (
                            <Badge className="bg-green-500 text-white text-xs">
                              <Shield className="w-3 h-3 mr-1" /> VERIFIED
                            </Badge>
                          )}
                        </div>
                        {property.city && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {property.city}
                          </p>
                        )}
                        <div className="text-2xl font-bold text-blue-600 mt-2">
                          {formatMoney(property.price, property.currency)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{property.bedrooms ?? "—"}</div>
                          <div className="text-xs text-gray-600">Bedrooms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{property.bathrooms ?? "—"}</div>
                          <div className="text-xs text-gray-600">Bathrooms</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {property.floor_area_sqm ?? property.area_sqm ?? "—"}
                          </div>
                          <div className="text-xs text-gray-600">m²</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dom ?? "—"}</div>
                          <div className="text-xs text-gray-600">Days Listed</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Verification</span>
                          <Badge className={property.verification_status === "verified" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                            {property.verification_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        {pricePerSqm != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Price/m²</span>
                            <span className="font-bold">R {pricePerSqm.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full" size="sm" asChild>
                        <Link to={`/app/property/${property.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Card className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-4 text-left font-semibold bg-gray-50 sticky left-0 z-10 min-w-44">
                        Feature
                      </th>
                      {properties.map((property) => (
                        <th key={property.id} className="p-4 text-center min-w-50">
                          <div className="space-y-3">
                            <img
                              src={property.media_url ?? DEFAULT_PROPERTY_IMAGE}
                              alt={property.title}
                              className="w-full h-36 object-cover rounded-lg"
                              onError={(e) => { e.currentTarget.src = DEFAULT_PROPERTY_IMAGE; }}
                            />
                            {property.verification_status === "verified" && (
                              <Badge className="bg-green-500 text-white text-xs">
                                <Shield className="w-3 h-3 mr-1" /> VERIFIED
                              </Badge>
                            )}
                            <h3 className="font-bold text-sm">{property.title}</h3>
                            {property.city && (
                              <p className="text-xs text-gray-600 flex items-center gap-1 justify-center">
                                <MapPin className="w-3 h-3" /> {property.city}
                              </p>
                            )}
                            <div className="text-xl font-bold text-blue-600">
                              {formatMoney(property.price, property.currency)}
                            </div>
                            <div className="flex gap-2 justify-center">
                              <Button className="flex-1" size="sm" asChild>
                                <Link to={`/app/property/${property.id}`}>View</Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeProperty(property.id)}
                                title="Remove from comparison"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Basic Info */}
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td colSpan={colSpan} className="p-4 font-semibold sticky left-0 bg-gray-50">
                        Basic Information
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-gray-600" /> Bedrooms
                        </div>
                      </td>
                      {properties.map((p) => {
                        const val = comp?.bedrooms.values.find((v) => v.propertyId === p.id)?.value;
                        const maxBeds = Math.max(...(comp?.bedrooms.values.map((v) => v.value ?? 0) ?? []));
                        return (
                          <td key={p.id} className={`p-4 text-center ${val === maxBeds && val != null ? "bg-blue-50 font-bold" : ""}`}>
                            {val ?? "—"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <Bath className="w-4 h-4 text-gray-600" /> Bathrooms
                        </div>
                      </td>
                      {properties.map((p) => (
                        <td key={p.id} className="p-4 text-center">{p.bathrooms ?? "—"}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <Maximize className="w-4 h-4 text-gray-600" /> Floor Area (m²)
                        </div>
                      </td>
                      {properties.map((p) => {
                        const val = comp?.size.values.find((v) => v.propertyId === p.id)?.value;
                        return (
                          <td key={p.id} className={`p-4 text-center ${getCellClass(p.id, comp?.size.winner ?? null, false)}`}>
                            {val != null ? `${val} m²` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">Property Type</td>
                      {properties.map((p) => (
                        <td key={p.id} className="p-4 text-center text-sm capitalize">{p.property_type.replace("_", " ")}</td>
                      ))}
                    </tr>

                    {/* Pricing */}
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td colSpan={colSpan} className="p-4 font-semibold sticky left-0 bg-gray-50">
                        Pricing & Value
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-600" /> Price per m²
                        </div>
                      </td>
                      {properties.map((p) => {
                        const val = comp?.pricePerSqm.values.find((v) => v.propertyId === p.id)?.value;
                        return (
                          <td key={p.id} className={`p-4 text-center ${getCellClass(p.id, comp?.pricePerSqm.winner ?? null, true)}`}>
                            {val != null ? `R ${val.toLocaleString()}` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">Monthly Levy</td>
                      {properties.map((p) => {
                        const val = comp?.monthlyLevy.values.find((v) => v.propertyId === p.id)?.value;
                        return (
                          <td key={p.id} className="p-4 text-center">
                            {val != null ? `R ${val.toLocaleString()}` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" /> Days on Market
                        </div>
                      </td>
                      {properties.map((p) => {
                        const val = comp?.daysOnMarket.values.find((v) => v.propertyId === p.id)?.value;
                        return (
                          <td key={p.id} className={`p-4 text-center ${getCellClass(p.id, comp?.daysOnMarket.winner ?? null, true)}`}>
                            {val != null ? `${val} days` : "—"}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Verification */}
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td colSpan={colSpan} className="p-4 font-semibold sticky left-0 bg-gray-50">
                        Verification & Trust
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-600" /> Verification Status
                        </div>
                      </td>
                      {properties.map((p) => (
                        <td key={p.id} className="p-4 text-center">
                          <Badge className={p.verification_status === "verified" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                            {p.verification_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 sticky left-0 bg-white font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-gray-600" /> Listing Status
                        </div>
                      </td>
                      {properties.map((p) => (
                        <td key={p.id} className="p-4 text-center">
                          <Badge className={p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </Card>

              <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded" />
                  <span>Best in category</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded" />
                  <span>Best value (lower cost)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";
