'use client';

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Eye, Star, MessageSquare, Users, Filter, Zap, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Analytics() {
  const [nlQuery, setNlQuery] = useState("");
  const [nlResult, setNlResult] = useState<string | null>(null);
  const [nlLoading, setNlLoading] = useState(false);

  const handleNlQuery = () => {
    if (!nlQuery.trim()) return;
    setNlLoading(true);
    setNlResult(null);
    // Simulates LangChain SQL Agent + Claude response
    setTimeout(() => {
      setNlResult(`SELECT l.id, l.title, l.price, COUNT(i.id) AS inquiries, SUM(v.count) AS views\nFROM property.listings l\nLEFT JOIN sales.inquiries i ON i.listing_id = l.id\nLEFT JOIN analytics.listing_views v ON v.listing_id = l.id\nWHERE l.status = 'active' AND l.agent_id = current_user_id()\nGROUP BY l.id ORDER BY inquiries DESC\nLIMIT 10;`);
      setNlLoading(false);
    }, 1200);
  };

  const suggestedQueries = [
    "Show listings with no inquiries in 30 days",
    "Which buyers have the highest budget?",
    "Top performing properties this month",
  ];
  const salesVelocityData = [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 45 },
    { day: "Sat", value: 20 },
    { day: "Sun", value: 25 },
  ];

  const leadSourceData = [
    { name: "Organic", value: 284, color: "#3b82f6", percentage: "65%" },
    { name: "Paid", value: 109, color: "#8b5cf6", percentage: "25%" },
    { name: "Referral", value: 44, color: "#10b981", percentage: "10%" },
  ];

  const weeklyHighlights = [
    { icon: Eye, label: "Total Page Views", value: "12,402", color: "blue" },
    { icon: MessageSquare, label: "Inquiries Received", value: "84", color: "purple" },
    { icon: Star, label: "Avg. Listing Score", value: "9.2/10", color: "yellow" },
  ];

  const listings = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=100&h=100&fit=crop",
      title: "88 Sunset B...",
      location: "West Hills",
      price: "$1.25M",
      inquiries: 42,
      views: 1240,
      trend: "+8%",
      trendDirection: "up",
      status: "Active",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100&h=100&fit=crop",
      title: "204 Sky View",
      location: "Downtown City",
      price: "$450K",
      inquiries: 18,
      views: 630,
      trend: "—",
      trendDirection: "neutral",
      status: "Pending",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=100&h=100&fit=crop",
      title: "45 Green Oa...",
      location: "Riverside Suburb",
      price: "$785K",
      inquiries: 31,
      views: 925,
      trend: "-3%",
      trendDirection: "down",
      status: "Inactive",
    },
  ];

  const recentLeads = [
    {
      initials: "JS",
      name: "Jane Smith",
      interest: "Interested in: 88 Sunset Blvd",
      time: "Added 12m ago",
      status: "New",
      color: "blue",
    },
    {
      initials: "RT",
      name: "Robert Taylor",
      interest: "Buying Budget: $900k+",
      time: "Added 3h ago",
      status: "Negotiating",
      color: "orange",
    },
    {
      initials: "MK",
      name: "Mariah Kane",
      interest: "Viewing: Sky View #204",
      time: "Added 1d ago",
      status: "Contacted",
      color: "green",
    },
  ];

  const getLeadSourceDotClass = (source: string) => {
    switch (source) {
      case "Organic":
        return "bg-blue-500";
      case "Paid":
        return "bg-purple-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Data-Driven Agent Hub</h1>
          <p className="text-gray-600 mb-2">Performance insights for Monday, May 14th</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Claude (claude-opus-4-6) · NL-to-SQL
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              <Search className="w-3 h-3 mr-1" />
              LangChain SQL Agent
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">7D</Button>
          <Button variant="outline" size="sm">1M</Button>
          <Button variant="outline" size="sm">3M</Button>
        </div>
      </div>

      {/* NL Query Interface */}
      <Card className="p-5 mb-6 border-orange-200 bg-orange-50">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-orange-600" />
          <span className="font-semibold text-sm">Ask in plain English</span>
          <Badge className="bg-orange-600 text-white text-xs ml-auto">LangChain + Claude</Badge>
        </div>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNlQuery()}
            placeholder="e.g. Show listings with no inquiries in the last 30 days"
            className="flex-1 px-3 py-2 text-sm border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <Button
            onClick={handleNlQuery}
            disabled={nlLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            {nlLoading ? "Thinking..." : "Run"}
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {suggestedQueries.map((q) => (
            <button
              key={q}
              onClick={() => setNlQuery(q)}
              className="text-xs px-2 py-1 bg-white border border-orange-200 rounded-full hover:bg-orange-100 text-orange-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        {nlResult && (
          <div className="bg-white border border-orange-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Generated SQL · analytics.* schema</div>
            <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">{nlResult}</pre>
          </div>
        )}
      </Card>

      {/* Top Row - Charts */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Sales Velocity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Sales Velocity</h3>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <span>+12.5%</span>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesVelocityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Lead Source Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Lead Source Breakdown</h3>
            <button
              className="text-gray-400 hover:text-gray-600"
              title="Filter lead source breakdown"
              aria-label="Filter lead source breakdown"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-37.5 h-37.5">
              <PieChart width={150} height={150}>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leadSourceData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#3b82f6" : "#e5e7eb"}
                    />
                  ))}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">284</div>
                </div>
              </div>
            </div>
            <div className="ml-6 space-y-2">
              {leadSourceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getLeadSourceDotClass(item.name)}`}></div>
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm text-gray-500">({item.percentage})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Weekly Highlights */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Highlights</h3>
          <div className="space-y-4">
            {weeklyHighlights.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${item.color}-50`}>
                  <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">{item.label}</div>
                  <div className="font-semibold text-lg">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Listing Performance */}
        <div className="col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Listing Performance</h3>
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  placeholder="Filter listings..."
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-600 border-b border-gray-200">
                    <th className="pb-3 font-medium">PROPERTY</th>
                    <th className="pb-3 font-medium">PRICE</th>
                    <th className="pb-3 font-medium">INQUIRIES</th>
                    <th className="pb-3 font-medium">VIEWS</th>
                    <th className="pb-3 font-medium">TREND</th>
                    <th className="pb-3 font-medium">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className="border-b border-gray-100">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={listing.image}
                            alt={listing.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-sm">{listing.title}</div>
                            <div className="text-xs text-gray-500">{listing.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-semibold">{listing.price}</td>
                      <td className="py-4">{listing.inquiries}</td>
                      <td className="py-4">{listing.views}</td>
                      <td className="py-4">
                        <span
                          className={`text-sm ${
                            listing.trendDirection === "up"
                              ? "text-green-600"
                              : listing.trendDirection === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {listing.trend}
                        </span>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            listing.status === "Active"
                              ? "default"
                              : listing.status === "Pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {listing.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-center">
              <button className="text-blue-500 text-sm hover:underline">View All Listings</button>
            </div>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Recent Leads</h3>
            <button
              className="text-gray-400 hover:text-gray-600"
              title="Filter recent leads"
              aria-label="Filter recent leads"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentLeads.map((lead, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                <div
                  className={`w-10 h-10 rounded-full bg-${lead.color}-100 text-${lead.color}-600 flex items-center justify-center font-semibold text-sm shrink-0`}
                >
                  {lead.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">{lead.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{lead.interest}</p>
                  <p className="text-xs text-gray-500">{lead.time}</p>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            <Users className="w-4 h-4 mr-2" />
            Manage All Leads
          </Button>
        </Card>
      </div>
    </div>
  );
}