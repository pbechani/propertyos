'use client';

import { Eye, Zap, Tag, DollarSign, TrendingUp, Heart, MessageSquare, Edit2, Share2, Phone, Mail, Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/router-compat";

export default function Dashboard() {
  const stats = [
    {
      icon: Eye,
      label: "TOTAL VIEWS",
      value: "24,892",
      change: "+12.5%",
      trend: "up",
      color: "blue",
    },
    {
      icon: Zap,
      label: "ACTIVE LEADS",
      value: "156",
      change: "+4.2%",
      trend: "up",
      color: "purple",
    },
    {
      icon: Tag,
      label: "CONVERSION RATE",
      value: "3.1%",
      change: "Stable",
      trend: "stable",
      color: "green",
    },
    {
      icon: DollarSign,
      label: "COMM. EARNED",
      value: "$42,500",
      change: "-2.1%",
      trend: "down",
      color: "orange",
    },
  ];

  const listings = [
    {
      id: 1,
      title: "Luxury Villa, 88 Sunset Boulevard",
      location: "West Hills, LA",
      price: "$1,250,000",
      status: "ACTIVE",
      views: 1204,
      likes: 45,
      messages: 12,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: "Modern Loft, 204 Sky View",
      location: "Downtown City",
      price: "$450,000",
      status: "PENDING",
      views: 842,
      likes: 18,
      messages: 5,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: "Family Home, 45 Green Oaks",
      location: "Riverside Suburb",
      price: "$785,000",
      status: "ACTIVE",
      views: 2510,
      likes: 112,
      messages: 34,
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
    },
  ];

  const leads = [
    {
      name: "James Smith",
      initials: "JS",
      time: "2m ago",
      interest: "Interested in Luxury Villa",
      message: "I'd like to schedule a viewing for this weekend if possible...",
      color: "blue",
    },
    {
      name: "Emily Watson",
      initials: "EW",
      time: "14m ago",
      interest: "Selling: 3 Bed Apartment",
      message: "Looking for an appraisal of my property in the downtown area.",
      color: "orange",
    },
    {
      name: "Robert Brown",
      initials: "RB",
      time: "1h ago",
      interest: "General Inquiry",
      message: "",
      color: "green",
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold mb-1">Agent Command Center</h1>
        <p className="text-sm md:text-base text-gray-600">Welcome back, Marcus. Here's your performance for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <stat.icon className={`w-5 h-5 md:w-6 md:h-6 text-${stat.color}-500`} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs md:text-sm ${
                  stat.trend === "up"
                    ? "text-green-600"
                    : stat.trend === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {stat.change}
                {stat.trend === "up" && <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />}
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-600 mb-1">{stat.label}</div>
            <div className="text-xl md:text-2xl font-semibold">{stat.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* My Active Listings */}
        <div className="lg:col-span-2">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                <h2 className="text-base md:text-lg font-semibold">My Active Listings</h2>
              </div>
              <Link to="/app/listings" className="text-blue-500 text-xs md:text-sm hover:underline">
                View All Listings
              </Link>
            </div>

            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge
                          variant={listing.status === "ACTIVE" ? "default" : "secondary"}
                          className="mb-2"
                        >
                          {listing.status}
                        </Badge>
                        <h3 className="font-semibold">{listing.title}</h3>
                        <p className="text-sm text-gray-600">{listing.location}</p>
                      </div>
                      <div className="text-xl font-semibold text-blue-600">{listing.price}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {listing.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {listing.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> {listing.messages}
                      </span>
                      <div className="ml-auto flex gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* New Leads */}
        <div>
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">New Leads</h2>
              </div>
              <Badge variant="destructive">4 NEW</Badge>
            </div>

            <div className="space-y-4">
              {leads.map((lead, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-${lead.color}-100 text-${lead.color}-600 flex items-center justify-center font-semibold text-sm`}
                    >
                      {lead.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{lead.name}</h3>
                        <span className="text-xs text-gray-500">{lead.time}</span>
                      </div>
                      <p className="text-xs text-gray-600">{lead.interest}</p>
                    </div>
                  </div>
                  {lead.message && (
                    <p className="text-sm text-gray-600 mb-3 italic">"{lead.message}"</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}