import { useState } from "react";
import { Link } from "react-router";
import {
  Bell,
  Calendar,
  Clock,
  Phone,
  FileText,
  TrendingUp,
  MapPin,
  Eye,
  MessageSquare,
  Plus,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { VerificationBadge } from "../components/ui/verification-badge";

export default function AgentDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const priorities = [
    {
      type: "APPOINTMENT",
      time: "10:40 AM",
      title: "Viewing: Sunset Villa",
      subtitle: "Lead: Sarah Johnson",
      action: "Check In",
      actionColor: "blue",
      icon: Calendar,
    },
    {
      type: "FOLLOW UP",
      time: "Due Now",
      title: "Call Michael Chen",
      subtitle: "Offer pending on Downtown Apt",
      action: "Call Now",
      actionColor: "orange",
      icon: Phone,
    },
    {
      type: "NEGOTIATION",
      time: "2:00 PM",
      title: "Contract Signing",
      subtitle: "Riverside Estate - $1.4M",
      action: "Review Docs",
      actionColor: "green",
      icon: FileText,
    },
  ];

  const leadFunnel = [
    { stage: "New Leads", count: 1248, width: "100%", color: "bg-blue-100 text-blue-900" },
    { stage: "Engaged", count: 452, width: "80%", color: "bg-blue-200 text-blue-900" },
    { stage: "Qualified", count: 89, width: "60%", color: "bg-blue-400 text-white" },
    { stage: "Closing", count: 14, width: "40%", color: "bg-blue-600 text-white" },
  ];

  const hotspots = [
    { name: "West Hills", position: { top: "45%", left: "42%" }, views: 1242 },
    { name: "Downtown", position: { top: "60%", left: "75%" }, views: 892 },
    { name: "Riverside", position: { top: "65%", left: "58%" }, views: 1580 },
  ];

  const activeListings = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1757439402115-c3c496fe81ec?w=400&h=300&fit=crop",
      price: "$1,250,000",
      address: "88 Sunset Boulevard, West Hills",
      beds: 4,
      baths: 3,
      sqft: 280,
      leads: 24,
      tours: 12,
      offers: 3,
      badge: "HIGH INTEREST",
      badgeColor: "green",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1472157510410-64a053cbc39f?w=400&h=300&fit=crop",
      price: "$450,000",
      address: "204 Sky View, Downtown City",
      beds: 2,
      baths: 2,
      sqft: 95,
      leads: 8,
      tours: 3,
      offers: 0,
      badge: "NORMAL PACE",
      badgeColor: "orange",
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">Good morning, Alex.</h1>
            <VerificationBadge status="verified" size="md" />
          </div>
          <p className="text-gray-600">
            You have <span className="text-blue-600 font-semibold">12 property tasks</span> for today.
            Let's close some deals!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">MOM GROWTH</div>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <TrendingUp className="w-5 h-5" />
              +24.5%
            </div>
          </div>
        </div>
      </div>

      {/* Today's Priorities */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            ⚡ Today's Priorities
          </h2>
          <Link to="/app/schedule" className="text-blue-500 text-sm hover:underline">
            View Schedule
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {priorities.map((priority, idx) => (
            <Card
              key={idx}
              className={`p-5 border-l-4 ${
                priority.actionColor === "blue"
                  ? "border-l-blue-500"
                  : priority.actionColor === "orange"
                  ? "border-l-orange-500"
                  : "border-l-green-500"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    priority.actionColor === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : priority.actionColor === "orange"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {priority.type}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {priority.time}
                </div>
              </div>
              <h3 className="font-semibold mb-1">{priority.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{priority.subtitle}</p>
              <Button
                className={`w-full ${
                  priority.actionColor === "blue"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : priority.actionColor === "orange"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-green-500 hover:bg-green-600"
                } text-white`}
              >
                {priority.action}
              </Button>
            </Card>
          ))}

          {/* New Task Button */}
          <Card className="p-5 flex flex-col items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold mb-1">New Task</h3>
            <p className="text-sm text-blue-100">Add your own task</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Lead Funnel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Lead Funnel
            </h3>
            <span className="text-xs text-gray-500">This Month</span>
          </div>

          <div className="space-y-3 mb-6">
            {leadFunnel.map((stage, idx) => (
              <div key={idx}>
                <div
                  className={`relative py-4 px-5 rounded-lg ${stage.color} font-semibold transition-all`}
                  style={{ width: stage.width }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{stage.stage}</span>
                    <span className="text-lg">{stage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-xs text-gray-500 mb-1">CONV. RATE</div>
              <div className="text-2xl font-bold text-blue-600">7.2%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">AVG. VALUE</div>
              <div className="text-2xl font-bold text-green-600">$845k</div>
            </div>
          </div>
        </Card>

        {/* Listing Hotspots */}
        <Card className="p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              🔥 Listing Hotspots
            </h3>
            <Badge variant="destructive" className="bg-red-500">
              ● High Activity
            </Badge>
          </div>

          <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=400&fit=crop"
              alt="Map"
              className="w-full h-full object-cover opacity-50"
            />
            {hotspots.map((spot, idx) => (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: spot.position.top, left: spot.position.left }}
              >
                <div className="relative">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      idx === 0 ? "bg-red-500" : idx === 1 ? "bg-blue-500" : "bg-red-400"
                    } animate-pulse`}
                  ></div>
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-lg text-xs font-medium whitespace-nowrap">
                    {spot.name} ({spot.views})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Active Listings</h2>
            <p className="text-sm text-gray-600">Monitor engagement and take action on your current stock</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Filter
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Listing
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {activeListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex gap-4 p-4">
                <img
                  src={listing.image}
                  alt={listing.address}
                  className="w-40 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">{listing.price}</div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3" />
                        {listing.address}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{listing.beds} 🛏</span>
                        <span>{listing.baths} 🚿</span>
                        <span>{listing.sqft}m²</span>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs ${
                        listing.badgeColor === "green"
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-orange-50 text-orange-600 border-orange-200"
                      }`}
                    >
                      ➜ {listing.badge}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 px-4 pb-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">LEADS</div>
                  <div className="text-xl font-bold">{listing.leads}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">TOURS</div>
                  <div className="text-xl font-bold">{listing.tours}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">OFFERS</div>
                  <div className="text-xl font-bold text-green-600">{listing.offers}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <Button variant="default" className="bg-blue-500 hover:bg-blue-600" size="sm">
                  Contact Leads
                </Button>
                <Button variant="outline" size="sm">
                  Boost Listing
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}