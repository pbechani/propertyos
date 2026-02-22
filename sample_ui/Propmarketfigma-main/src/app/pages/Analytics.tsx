import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Eye, Star, MessageSquare, Users, Filter } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export default function Analytics() {
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

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Data-Driven Agent Hub</h1>
          <p className="text-gray-600">Performance insights for Monday, May 14th</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            7D
          </Button>
          <Button variant="outline" size="sm">
            1M
          </Button>
          <Button variant="outline" size="sm">
            3M
          </Button>
        </div>
      </div>

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
            <button className="text-gray-400 hover:text-gray-600">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-[150px] h-[150px]">
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
                  {leadSourceData.map((entry, index) => (
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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
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
            <button className="text-gray-400 hover:text-gray-600">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentLeads.map((lead, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                <div
                  className={`w-10 h-10 rounded-full bg-${lead.color}-100 text-${lead.color}-600 flex items-center justify-center font-semibold text-sm flex-shrink-0`}
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