'use client';

import {
  Home,
  Heart,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  Search,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BuyerDashboard() {
  const sidebarItems = [
    { section: "MARKETPLACE", items: [] },
    {
      items: [
        { icon: Home, label: "Browse Homes", active: true, badge: null },
        { icon: Search, label: "Saved Searches", active: false, badge: null },
      ],
    },
    { section: "BUYER ACTIVITY", items: [] },
    {
      items: [
        { icon: Heart, label: "My Favorites", active: false, badge: "12" },
        { icon: Calendar, label: "Scheduled Viewings", active: false, badge: "2" },
        { icon: MessageSquare, label: "My Inquiries", active: false, badge: null },
        { icon: Bell, label: "Price Alerts", active: false, badge: null },
      ],
    },
    { section: "ACCOUNT", items: [] },
    {
      items: [{ icon: Settings, label: "Settings", active: false, badge: null }],
    },
  ];

  const properties = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1757439402115-c3c496fe81ec?w=500&h=400&fit=crop",
      price: "$1,250,000",
      address: "88 Sunset Boulevard, West Hills",
      beds: 4,
      baths: 3,
      sqm: 280,
      matchPercent: 98,
      badges: ["98% MATCH", "NEW TODAY"],
      favorite: false,
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1472157510410-64a053cbc39f?w=500&h=400&fit=crop",
      price: "$450,000",
      address: "204 Sky View, Downtown City",
      beds: 2,
      baths: 2,
      sqm: 95,
      matchPercent: 92,
      badges: ["92% MATCH"],
      favorite: true,
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1560725855-0449b6a7f993?w=500&h=400&fit=crop",
      price: "$785,000",
      address: "45 Green Oaks, Riverside Suburb",
      beds: 3,
      baths: 2,
      sqm: 185,
      matchPercent: 86,
      badges: ["86% MATCH", "HOT DEAL"],
      favorite: false,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">PropertyOS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {sidebarItems.map((section, idx) => (
            <div key={idx} className="mb-4">
              {section.section && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.section}
                </div>
              )}
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    item.active
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge
                      className={`${
                        item.active
                          ? "bg-blue-600 text-white"
                          : "bg-red-500 text-white"
                      } text-xs px-2`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">
              AT
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Alex Thompson</div>
              <div className="text-xs text-gray-500">Premium Buyer</div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              title="Open user menu"
              aria-label="Open user menu"
            >
              <svg
                className="w-1 h-4"
                fill="currentColor"
                viewBox="0 0 4 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="2" cy="2" r="2" />
                <circle cx="2" cy="8" r="2" />
                <circle cx="2" cy="14" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Buyer's Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search areas, buildings, or agents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                className="relative p-2 text-gray-600 hover:text-gray-900"
                title="View notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                List Your Property
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Banner */}
        <div className="relative h-48 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=400&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent flex items-center">
            <div className="px-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Alex!</h2>
              <p className="text-white/90 text-lg">
                We found <span className="font-semibold text-blue-300">14 new properties</span> that
                match your specific search criteria.
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Houses
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                Apartments
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                $400k - $800k
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                3+ Beds
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort:</span>
              <select
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Sort properties"
                aria-label="Sort properties"
              >
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Best Match</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <main className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card
                key={property.id}
                className="overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.address}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {property.badges.map((badge, idx) => (
                      <Badge
                        key={idx}
                        className={`${
                          badge.includes("MATCH")
                            ? "bg-blue-500"
                            : badge === "NEW TODAY"
                            ? "bg-green-500"
                            : "bg-orange-500"
                        } text-white`}
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  {/* Favorite Button */}
                  <button
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                    title="Toggle favorite"
                    aria-label="Toggle favorite"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        property.favorite ? "fill-red-500 text-red-500" : "text-gray-600"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-baseline justify-between mb-3">
                    <div className="text-2xl font-bold text-blue-600">{property.price}</div>
                  </div>
                  <p className="text-gray-600 mb-4 flex items-start gap-1">
                    <svg
                      className="w-4 h-4 mt-0.5 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm">{property.address}</span>
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      {property.beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" />
                      </svg>
                      {property.baths}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      {property.sqm}m²
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </Button>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Inquire Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}