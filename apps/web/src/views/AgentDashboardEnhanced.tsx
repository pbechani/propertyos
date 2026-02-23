'use client';

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  TrendingUp, Eye,
  MessageSquare, Plus, X, Upload,
  Home, DollarSign, Users
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AgentDashboardEnhanced() {
  const [showAddListing, setShowAddListing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"overview" | "analytics" | "listings">("overview");

  // Analytics Data
  const viewsData = [
    { month: "Jan", views: 1200, inquiries: 180 },
    { month: "Feb", views: 1900, inquiries: 220 },
    { month: "Mar", views: 2400, inquiries: 290 },
    { month: "Apr", views: 2100, inquiries: 250 },
    { month: "May", views: 2800, inquiries: 340 },
    { month: "Jun", views: 3200, inquiries: 420 },
  ];

  const listingPerformance = [
    { name: "Sunset Blvd", views: 850, inquiries: 42 },
    { name: "Sky View", views: 620, inquiries: 28 },
    { name: "Ocean Drive", views: 920, inquiries: 58 },
    { name: "Green Oaks", views: 540, inquiries: 22 },
    { name: "Harbor Rd", views: 760, inquiries: 35 },
  ];

  const activeListings = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
      price: "R 12,500,000",
      address: "88 Sunset Boulevard, Camps Bay",
      beds: 4,
      baths: 3,
      sqm: 340,
      views: 850,
      inquiries: 42,
      offers: 3,
      status: "active",
      daysOnMarket: 45,
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      price: "R 4,250,000",
      address: "204 Sky View, Sea Point",
      beds: 2,
      baths: 2,
      sqm: 112,
      views: 620,
      inquiries: 28,
      offers: 1,
      status: "active",
      daysOnMarket: 12,
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
      price: "R 18,900,000",
      address: "15 Ocean Drive, Clifton",
      beds: 5,
      baths: 4,
      sqm: 450,
      views: 920,
      inquiries: 58,
      offers: 5,
      status: "active",
      daysOnMarket: 67,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Agent Dashboard</h1>
            <p className="text-gray-600">Welcome back, Alex Johnson</p>
          </div>
          <Button 
            onClick={() => setShowAddListing(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Listing
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto">
          <button
            onClick={() => setSelectedTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "overview"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab("analytics")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "analytics"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setSelectedTab("listings")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedTab === "listings"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            My Listings
          </button>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Listings</div>
                    <div className="text-3xl font-bold">23</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      +3 this month
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Views</div>
                    <div className="text-3xl font-bold">12.4K</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      +18% vs last month
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Inquiries</div>
                    <div className="text-3xl font-bold">342</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      +24% vs last month
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Value</div>
                    <div className="text-3xl font-bold">R 245M</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3" />
                      +12% portfolio growth
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Chart Preview */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4">Performance Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#93c5fd" name="Views" />
                  <Area type="monotone" dataKey="inquiries" stroke="#10b981" fill="#6ee7b7" name="Inquiries" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { icon: Eye, text: "New inquiry on Sunset Boulevard", time: "2 hours ago", color: "blue" },
                  { icon: Users, text: "Viewing scheduled for Ocean Drive", time: "4 hours ago", color: "green" },
                  { icon: MessageSquare, text: "3 new messages from potential buyers", time: "5 hours ago", color: "purple" },
                  { icon: TrendingUp, text: "Sky View listing reached 500 views", time: "1 day ago", color: "orange" },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className={`w-10 h-10 bg-${activity.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <activity.icon className={`w-5 h-5 text-${activity.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{activity.text}</div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Analytics Tab */}
        {selectedTab === "analytics" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Views & Inquiries Over Time */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Views & Inquiries Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Page Views" />
                    <Line type="monotone" dataKey="inquiries" stroke="#10b981" strokeWidth={2} name="Inquiries" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Listing Performance */}
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Top Performing Listings</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={listingPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#3b82f6" name="Views" />
                    <Bar dataKey="inquiries" fill="#10b981" name="Inquiries" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Conversion Metrics */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Conversion Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">2.8%</div>
                  <div className="text-sm text-gray-600">View to Inquiry</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">18.5%</div>
                  <div className="text-sm text-gray-600">Inquiry to Viewing</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">32.1%</div>
                  <div className="text-sm text-gray-600">Viewing to Offer</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600 mb-1">65.3%</div>
                  <div className="text-sm text-gray-600">Offer to Close</div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Listings Tab */}
        {selectedTab === "listings" && (
          <div className="space-y-6">
            <Card className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Property</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Performance</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeListings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={listing.image} 
                            alt={listing.address}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{listing.address}</div>
                            <div className="text-xs text-gray-500">{listing.daysOnMarket} days on market</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600">{listing.price}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {listing.beds} bed • {listing.baths} bath • {listing.sqm} m²
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3 text-gray-400" />
                            <span>{listing.views} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3 h-3 text-gray-400" />
                            <span>{listing.inquiries} inquiries</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span>{listing.offers} offers</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/property/${listing.id}`}>View</Link>
                          </Button>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>

      {/* Add Listing Modal */}
      {showAddListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-xl">Add New Listing</h3>
              <button 
                onClick={() => setShowAddListing(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Property Images */}
              <div>
                <label className="block text-sm font-medium mb-2">Property Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Click to upload or drag and drop</div>
                  <div className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Property Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Modern Villa in Camps Bay"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (R)</label>
                  <input
                    type="text"
                    placeholder="12,500,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  placeholder="Full property address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bedrooms</label>
                  <input
                    type="number"
                    placeholder="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bathrooms</label>
                  <input
                    type="number"
                    placeholder="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Parking</label>
                  <input
                    type="number"
                    placeholder="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Size (m²)</label>
                  <input
                    type="number"
                    placeholder="340"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Property Type</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>House</option>
                  <option>Apartment</option>
                  <option>Townhouse</option>
                  <option>Land</option>
                  <option>Commercial</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the property features, location highlights, and unique selling points..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium mb-2">Features & Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {["Pool", "Garden", "Security", "Fiber", "Air Con", "Pet Friendly", "Gym", "Ocean View"].map((feature) => (
                    <label key={feature} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
              <Button 
                onClick={() => setShowAddListing(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                Create Listing
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
