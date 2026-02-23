'use client';

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  ChevronLeft, Check, X, Shield, MapPin, Bed, Bath, Car, Maximize,
  TrendingUp, CheckCircle2, Calendar, DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PropertyComparison() {
  const [selectedProperties] = useState([
    {
      id: 1,
      title: "88 Sunset Boulevard",
      location: "Camps Bay, Cape Town",
      price: 12500000,
      priceFormatted: "R 12,500,000",
      beds: 4,
      baths: 3.5,
      garage: 2,
      sqm: 340,
      yearBuilt: 2018,
      verified: true,
      riskScore: 95,
      titleDeedStatus: "CLEAR",
      ownershipHistory: 3,
      pricePerSqm: 36765,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
      features: {
        pool: true,
        garden: true,
        security: true,
        fiber: true,
        aircon: true,
        petFriendly: true,
        gym: false,
        oceanView: true,
      },
      appreciation: 22.5,
      daysOnMarket: 45,
    },
    {
      id: 2,
      title: "204 Sky View",
      location: "Sea Point, Cape Town",
      price: 4250000,
      priceFormatted: "R 4,250,000",
      beds: 2,
      baths: 2,
      garage: 1,
      sqm: 112,
      yearBuilt: 2020,
      verified: true,
      riskScore: 92,
      titleDeedStatus: "CLEAR",
      ownershipHistory: 1,
      pricePerSqm: 37946,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      features: {
        pool: false,
        garden: false,
        security: true,
        fiber: true,
        aircon: true,
        petFriendly: false,
        gym: true,
        oceanView: true,
      },
      appreciation: 8.7,
      daysOnMarket: 12,
    },
    {
      id: 3,
      title: "15 Ocean Drive",
      location: "Clifton, Cape Town",
      price: 18900000,
      priceFormatted: "R 18,900,000",
      beds: 5,
      baths: 4,
      garage: 3,
      sqm: 450,
      yearBuilt: 2019,
      verified: true,
      riskScore: 98,
      titleDeedStatus: "CLEAR",
      ownershipHistory: 2,
      pricePerSqm: 42000,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      features: {
        pool: true,
        garden: true,
        security: true,
        fiber: true,
        aircon: true,
        petFriendly: true,
        gym: true,
        oceanView: true,
      },
      appreciation: 31.2,
      daysOnMarket: 67,
    },
  ]);

  const featureList = [
    { key: "pool", label: "Swimming Pool" },
    { key: "garden", label: "Garden" },
    { key: "security", label: "Security System" },
    { key: "fiber", label: "Fiber Internet" },
    { key: "aircon", label: "Air Conditioning" },
    { key: "petFriendly", label: "Pet Friendly" },
    { key: "gym", label: "Gym" },
    { key: "oceanView", label: "Ocean View" },
  ];

  const getBestValue = (key: string) => {
    if (key === "price" || key === "pricePerSqm" || key === "daysOnMarket") {
      return Math.min(...selectedProperties.map(p => p[key as keyof typeof p] as number));
    }
    return Math.max(...selectedProperties.map(p => p[key as keyof typeof p] as number));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link to="/app/listings" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Listings</span>
            </Link>
            <h1 className="text-2xl font-bold">Property Comparison</h1>
            <p className="text-sm text-gray-600">Compare up to 3 properties side-by-side</p>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            <DollarSign className="w-4 h-4 mr-2" />
            Get Financing Quote
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Mobile View - Swipeable Cards */}
        <div className="md:hidden space-y-6">
          {selectedProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {property.location}
                  </p>
                  <div className="text-2xl font-bold text-blue-600 mt-2">{property.priceFormatted}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{property.beds}</div>
                    <div className="text-xs text-gray-600">Bedrooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{property.baths}</div>
                    <div className="text-xs text-gray-600">Bathrooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{property.garage}</div>
                    <div className="text-xs text-gray-600">Parking</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{property.sqm}</div>
                    <div className="text-xs text-gray-600">m²</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Risk Score</span>
                    <Badge className="bg-green-100 text-green-700">{property.riskScore}%</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Title Deed</span>
                    <Badge className="bg-green-100 text-green-700">{property.titleDeedStatus}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Price/m²</span>
                    <span className="font-bold">R {property.pricePerSqm.toLocaleString()}</span>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link to={`/property/${property.id}`}>View Full Details</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop View - Side by Side Table */}
        <div className="hidden md:block">
          <Card className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-4 text-left font-semibold bg-gray-50 sticky left-0 z-10">
                    Feature
                  </th>
                  {selectedProperties.map((property) => (
                    <th key={property.id} className="p-4 text-center min-w-[280px]">
                      <div className="space-y-3">
                        <img
                          src={property.image}
                          alt={property.title}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        {property.verified && (
                          <Badge className="bg-green-500 text-white">
                            <Shield className="w-3 h-3 mr-1" />
                            VERIFIED
                          </Badge>
                        )}
                        <h3 className="font-bold">{property.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 justify-center">
                          <MapPin className="w-3 h-3" />
                          {property.location}
                        </p>
                        <div className="text-2xl font-bold text-blue-600">{property.priceFormatted}</div>
                        <Button className="w-full" size="sm" asChild>
                          <Link to={`/property/${property.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Basic Info */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td colSpan={4} className="p-4 font-semibold sticky left-0 bg-gray-50">
                    Basic Information
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4 text-gray-600" />
                      Bedrooms
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.beds === getBestValue("beds") ? "bg-blue-50 font-bold" : ""}`}
                    >
                      {property.beds}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-gray-600" />
                      Bathrooms
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.baths === getBestValue("baths") ? "bg-blue-50 font-bold" : ""}`}
                    >
                      {property.baths}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-600" />
                      Parking Spaces
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.garage === getBestValue("garage") ? "bg-blue-50 font-bold" : ""}`}
                    >
                      {property.garage}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <Maximize className="w-4 h-4 text-gray-600" />
                      Floor Area (m²)
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.sqm === getBestValue("sqm") ? "bg-blue-50 font-bold" : ""}`}
                    >
                      {property.sqm} m²
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">Year Built</td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.yearBuilt === getBestValue("yearBuilt") ? "bg-blue-50 font-bold" : ""}`}
                    >
                      {property.yearBuilt}
                    </td>
                  ))}
                </tr>

                {/* Pricing */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td colSpan={4} className="p-4 font-semibold sticky left-0 bg-gray-50">
                    Pricing & Value
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      Price per m²
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.pricePerSqm === getBestValue("pricePerSqm") ? "bg-green-50 font-bold text-green-700" : ""}`}
                    >
                      R {property.pricePerSqm.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      5yr Appreciation
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.appreciation === getBestValue("appreciation") ? "bg-green-50 font-bold text-green-700" : ""}`}
                    >
                      +{property.appreciation}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      Days on Market
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.daysOnMarket === getBestValue("daysOnMarket") ? "bg-green-50 font-bold text-green-700" : ""}`}
                    >
                      {property.daysOnMarket} days
                    </td>
                  ))}
                </tr>

                {/* Verification & Trust */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td colSpan={4} className="p-4 font-semibold sticky left-0 bg-gray-50">
                    Verification & Trust
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-600" />
                      Risk Score
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td 
                      key={property.id} 
                      className={`p-4 text-center ${property.riskScore === getBestValue("riskScore") ? "bg-green-50" : ""}`}
                    >
                      <Badge className={property.riskScore >= 90 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {property.riskScore}%
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-600" />
                      Title Deed Status
                    </div>
                  </td>
                  {selectedProperties.map((property) => (
                    <td key={property.id} className="p-4 text-center">
                      <Badge className="bg-green-100 text-green-700">
                        {property.titleDeedStatus}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 sticky left-0 bg-white font-medium">Ownership Transfers</td>
                  {selectedProperties.map((property) => (
                    <td key={property.id} className="p-4 text-center">
                      {property.ownershipHistory}
                    </td>
                  ))}
                </tr>

                {/* Features & Amenities */}
                <tr className="border-b border-gray-200 bg-gray-50">
                  <td colSpan={4} className="p-4 font-semibold sticky left-0 bg-gray-50">
                    Features & Amenities
                  </td>
                </tr>
                {featureList.map((feature) => (
                  <tr key={feature.key} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4 sticky left-0 bg-white font-medium">{feature.label}</td>
                    {selectedProperties.map((property) => (
                      <td key={property.id} className="p-4 text-center">
                        {property.features[feature.key as keyof typeof property.features] ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
              <span>Best value in category</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span>Most economical option</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
