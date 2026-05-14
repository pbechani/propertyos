'use client';

import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Upload, 
  FileText, 
  Clock, 
  Eye,
  Hammer,
  Building2,
  Camera,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function Safety() {
  const [activeTab, setActiveTab] = useState<"property" | "contractor">("property");

  const getTrendBorderClass = (statusColor: string) => {
    switch (statusColor) {
      case "red":
        return "border-red-500";
      case "orange":
        return "border-orange-500";
      default:
        return "border-green-500";
    }
  };

  const recentPropertyReports = [
    {
      id: "#RF-9921",
      title: "Luxury Villa Sunset Blvd",
      url: "propertyos.com/list...",
      reason: "Suspicious Price",
      status: "In Review",
      statusColor: "yellow",
      date: "21 hours ago",
    },
    {
      id: "#RF-9845",
      title: "Downtown Modern Apt",
      url: "propertyos.com/list...",
      reason: "Fake Agent Profile",
      status: "Resolved",
      statusColor: "green",
      date: "May 14, 2024",
    },
    {
      id: "#RF-9712",
      title: "Family Home Riverside",
      url: "propertyos.com/list...",
      reason: "Phishing Link",
      status: "Action Needed",
      statusColor: "red",
      date: "May 10, 2024",
    },
  ];

  const recentContractorReports = [
    {
      id: "#CR-8834",
      contractor: "BuildTech Construction Ltd",
      location: "Nairobi, Kenya",
      reason: "Substandard Materials Used",
      status: "Investigation",
      statusColor: "yellow",
      date: "3 days ago",
      amount: "$45,000",
    },
    {
      id: "#CR-8721",
      contractor: "Premier Builders Co",
      location: "Lagos, Nigeria",
      reason: "Abandoned Project",
      status: "Verified Fraud",
      statusColor: "red",
      date: "May 18, 2024",
      amount: "$120,000",
    },
    {
      id: "#CR-8654",
      contractor: "Reliable Construction Group",
      location: "Cape Town, SA",
      reason: "Budget Overruns & Hidden Costs",
      status: "Resolved - Refund Issued",
      statusColor: "green",
      date: "May 12, 2024",
      amount: "$32,000",
    },
  ];

  const propertyFraudTrends = [
    {
      icon: "💳",
      title: "DEPOSIT SCAMS",
      description:
        "Fake agents requesting 'holding deposits' before property viewings in Western Cape area.",
      status: "HIGH ALERT",
      statusColor: "red",
    },
    {
      icon: "🎭",
      title: "IDENTITY SPOOFING",
      description: "Impersonation of established agencies using slightly altered email domains.",
      status: "MODERATE",
      statusColor: "orange",
    },
    {
      icon: "🏠",
      title: "DUPLICATED LISTINGS",
      description: "Cloned property photos used for fake rental listings at impossible prices.",
      status: "SCREENING",
      statusColor: "green",
    },
  ];

  const contractorFraudTrends = [
    {
      icon: "🔨",
      title: "MATERIAL SUBSTITUTION",
      description:
        "Contractors using lower-grade materials than specified in BOQ, particularly cement and steel.",
      status: "HIGH ALERT",
      statusColor: "red",
    },
    {
      icon: "💰",
      title: "PAYMENT ADVANCE FRAUD",
      description: "Requesting large upfront payments (>50%) and disappearing after initial work.",
      status: "HIGH ALERT",
      statusColor: "red",
    },
    {
      icon: "📋",
      title: "FAKE CERTIFICATIONS",
      description: "Unlicensed contractors using forged trade certificates and insurance documents.",
      status: "MODERATE",
      statusColor: "orange",
    },
  ];

  const verificationCases = [
    {
      id: "#FR-0423",
      title: "Case - Luxury Estate",
      description:
        "User report: Unusual payment request via unescored blockchain. Evidence being reviewed.",
      status: "VERIFIED",
      statusColor: "green",
    },
    {
      id: "#FR-0134",
      title: "Case - Suburb Apartment",
      description:
        "Payment in suspicious hasty residence offer listed by agent with fake registry.",
      status: "UNDER REVIEW",
      statusColor: "yellow",
    },
  ];

  const contractorVerificationCases = [
    {
      id: "#CR-0891",
      title: "Case - Foundation Work Fraud",
      description:
        "Contractor used 50% less cement than specified. Structural engineer report confirms substandard work.",
      status: "VERIFIED - BLACKLISTED",
      statusColor: "red",
    },
    {
      id: "#CR-0823",
      title: "Case - Abandoned Roofing Project",
      description:
        "Contractor took 70% payment advance and disappeared. Criminal investigation underway.",
      status: "LEGAL ACTION",
      statusColor: "red",
    },
  ];

  const propertyStats = [
    { label: "Reports Filed", value: "24", color: "blue" },
    { label: "Scams Removed", value: "18", color: "green" },
    { label: "Community Points", value: "1,250", color: "purple" },
  ];

  const contractorStats = [
    { label: "Contractors Reported", value: "142", color: "orange" },
    { label: "Verified Frauds", value: "67", color: "red" },
    { label: "Funds Recovered", value: "$2.4M", color: "green" },
  ];

  const stats = activeTab === "property" ? propertyStats : contractorStats;
  const fraudTrends = activeTab === "property" ? propertyFraudTrends : contractorFraudTrends;
  const cases = activeTab === "property" ? verificationCases : contractorVerificationCases;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-linear-to-br from-blue-600 to-blue-800 text-white px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-blue-500/30 text-white border-white/20">
              ACTIVE SAFETY MONITORING ENABLED
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Protecting our community from{" "}
            <span className="text-blue-200">fraud & exploitation.</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-3xl">
            Together, we can keep the marketplace safe. Report suspicious property listings, 
            fraudulent contractors, or shady construction work to protect fellow investors and builders.
          </p>

          {/* Tab Selector */}
          <div className="flex gap-4 mt-8 mb-6">
            <button
              onClick={() => setActiveTab("property")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "property"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-blue-700/50 text-white hover:bg-blue-700"
              }`}
            >
              <Building2 className="w-5 h-5" />
              Property Fraud
            </button>
            <button
              onClick={() => setActiveTab("contractor")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "contractor"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-blue-700/50 text-white hover:bg-blue-700"
              }`}
            >
              <Hammer className="w-5 h-5" />
              Contractor Fraud
            </button>
          </div>

          <div className="flex gap-4">
            <Button className="bg-white text-blue-600 hover:bg-blue-50">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report {activeTab === "property" ? "Listing" : "Contractor"}
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              <FileText className="w-4 h-4 mr-2" />
              Upload Evidence
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              <Eye className="w-4 h-4 mr-2" />
              Track Status
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Your Impact */}
        <div className="mb-8">
          <Card className="p-6 bg-linear-to-br from-gray-50 to-white">
            <h2 className="text-lg font-semibold mb-4">Your Impact</h2>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className={`w-2 h-12 bg-${stat.color}-500 rounded-full`}></div>
                  <div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-900 flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Vigilance Tip:</strong>{" "}
                  {activeTab === "property"
                    ? "Always verify listing descriptions against known addresses. Rental scams often use stolen images from luxury sales listings."
                    : "Never pay more than 20% upfront. Request milestone-based payments tied to verified progress photos and third-party inspections."}
                </span>
              </p>
            </div>
          </Card>
        </div>

        {/* Submit New Fraud Report */}
        <div className="mb-8">
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                {activeTab === "property" ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <Hammer className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  Submit New {activeTab === "property" ? "Property" : "Contractor"} Fraud Report
                </h2>
                <p className="text-gray-600 text-sm">
                  {activeTab === "property"
                    ? "Help us identify and remove suspicious listings to protect the community"
                    : "Report contractors engaged in fraudulent practices, substandard work, or financial exploitation"}
                </p>
              </div>
            </div>

            {activeTab === "property" ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://propertyos.com/listing/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Report
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Reason for report"
                    aria-label="Reason for report"
                  >
                    <option>Select a reason</option>
                    <option>Suspicious Price</option>
                    <option>Fake Agent Profile</option>
                    <option>Phishing Link</option>
                    <option>Duplicate Listing</option>
                    <option>Non-existent Property</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    placeholder="Explain why this listing is suspicious..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Upload (Screenshots, Chats)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Drag & drop evidence files here</p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contractor Name / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Construction Ltd"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Fraud
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    title="Type of fraud"
                    aria-label="Type of fraud"
                  >
                    <option>Select fraud type</option>
                    <option>Abandoned Project</option>
                    <option>Substandard Materials Used</option>
                    <option>Budget Overruns / Hidden Costs</option>
                    <option>Delayed Timeline (&gt;3 months)</option>
                    <option>Fake Certifications</option>
                    <option>Poor Workmanship</option>
                    <option>Payment Fraud / Advance Scam</option>
                    <option>Unlicensed Operation</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Financial Impact (USD)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $45,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description of Fraud
                  </label>
                  <textarea
                    placeholder="Describe what happened, timeline, and how you were defrauded..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Upload (Photos, Contracts, Payment Records, Messages)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Upload construction photos, signed contracts, payment receipts, chat logs
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC up to 25MB</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-900">
                      <strong>Important:</strong> If this involves an active construction project, 
                      our team can arrange an independent structural inspection to verify your claims. 
                      Verified fraud cases may result in contractor blacklisting and legal action.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                By submitting, you agree to our community safety guidelines
              </p>
              <Button className={activeTab === "property" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"}>
                <Shield className="w-4 h-4 mr-2" />
                Submit Report for Review
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Recent Reports Tracking */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Recent Reports Tracking</h3>
            <div className="flex items-center gap-2 mb-4 text-sm">
              <button className="px-3 py-1 bg-gray-100 rounded-full">ALL</button>
              <button className="px-3 py-1 hover:bg-gray-50 rounded-full">PENDING</button>
              <button className="px-3 py-1 hover:bg-gray-50 rounded-full">RESOLVED</button>
            </div>

            <div className="space-y-3">
              {activeTab === "property" ? (
                recentPropertyReports.map((report) => (
                  <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs text-gray-500">{report.id}</span>
                        <h4 className="font-semibold text-sm">{report.title}</h4>
                        <a href="#" className="text-xs text-blue-500 hover:underline">
                          {report.url}
                        </a>
                      </div>
                      <Badge
                        variant={
                          report.statusColor === "green"
                            ? "default"
                            : report.statusColor === "yellow"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>Reason: {report.reason}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.date}
                      </span>
                    </div>
                    <button className="text-xs text-blue-500 mt-2 hover:underline">
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                recentContractorReports.map((report) => (
                  <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs text-gray-500">{report.id}</span>
                        <h4 className="font-semibold text-sm">{report.contractor}</h4>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {report.location}
                        </p>
                      </div>
                      <Badge
                        variant={
                          report.statusColor === "green"
                            ? "default"
                            : report.statusColor === "yellow"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>Amount: {report.amount}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.date}
                      </span>
                    </div>
                    <div className="text-xs text-orange-600 mt-2 font-medium">
                      {report.reason}
                    </div>
                    <button className="text-xs text-blue-500 mt-2 hover:underline">
                      View Full Case
                    </button>
                  </div>
                ))
              )}
            </div>

            <button className="w-full mt-4 text-sm text-blue-500 hover:underline">
              VIEW FULL HISTORY LOG
            </button>
          </Card>

          {/* Active Verification */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-lg">Active Verification</h3>
            </div>
            <div className="space-y-4">
              {cases.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 rounded-lg bg-linear-to-br from-white to-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">{item.id}</span>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                    </div>
                    <Badge
                      variant={
                        item.statusColor === "green"
                          ? "default"
                          : item.statusColor === "red"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              ))}

              <button className="text-xs text-blue-500 hover:underline">
                View All Public Case Files
              </button>
            </div>
          </Card>
        </div>

        {/* Live Marketplace Transparency */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">
            {activeTab === "property" ? "Live Marketplace Transparency" : "Construction Fraud Trends"}
          </h3>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              {activeTab === "property"
                ? "Real-time statistics of community vigilance"
                : "Active fraud patterns in construction sector"}
            </p>
            <div className="flex gap-8">
              {activeTab === "property" ? (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">1,284</div>
                    <div className="text-xs text-gray-600">ACTIVE WATCHERS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">42</div>
                    <div className="text-xs text-gray-600">LISTINGS REMOVED TODAY</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">156</div>
                    <div className="text-xs text-gray-600">BLACKLISTED CONTRACTORS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">$2.4M</div>
                    <div className="text-xs text-gray-600">FUNDS RECOVERED</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {fraudTrends.map((trend, idx) => (
              <div
                key={idx}
                className={`p-4 border-l-4 bg-linear-to-r from-gray-50 to-white rounded-lg ${getTrendBorderClass(trend.statusColor)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{trend.icon}</span>
                  <Badge
                    variant={
                      trend.statusColor === "red"
                        ? "destructive"
                        : trend.statusColor === "orange"
                        ? "secondary"
                        : "default"
                    }
                    className="text-xs"
                  >
                    {trend.status}
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm mb-1">{trend.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{trend.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Contractor-Specific: Blacklist Preview */}
        {activeTab === "contractor" && (
          <Card className="p-6 mt-8 bg-linear-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Verified Blacklisted Contractors</h3>
                <p className="text-sm text-gray-700">
                  These contractors have been verified as fraudulent through our investigation process. 
                  Do not engage with these entities.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "Swift Build Solutions",
                  location: "Lagos, Nigeria",
                  reason: "Abandoned 8 projects after taking 80% payment",
                  verified: "Jan 2024",
                  severity: "CRITICAL",
                },
                {
                  name: "Prime Construction Ghana",
                  location: "Accra, Ghana",
                  reason: "Used substandard materials, building collapsed",
                  verified: "Dec 2023",
                  severity: "CRITICAL",
                },
                {
                  name: "Metro Builders SA",
                  location: "Johannesburg, SA",
                  reason: "Unlicensed operation, fake certifications",
                  verified: "Feb 2024",
                  severity: "HIGH",
                },
                {
                  name: "Eastern Construction Co",
                  location: "Nairobi, Kenya",
                  reason: "Budget fraud - charged 3x market rates",
                  verified: "Nov 2023",
                  severity: "HIGH",
                },
              ].map((contractor, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white border-2 border-red-300 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-red-900">{contractor.name}</h4>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {contractor.location}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {contractor.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-700 mt-2 mb-2">{contractor.reason}</p>
                  <p className="text-xs text-gray-500">Verified: {contractor.verified}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 text-sm text-red-600 font-semibold hover:underline">
              VIEW COMPLETE BLACKLIST (156 CONTRACTORS) →
            </button>
          </Card>
        )}

        {/* Bottom CTA */}
        <div className="mt-8 bg-linear-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">
            Safety starts with <span className="text-blue-200">Vigilance.</span>
          </h3>
          <p className="mb-6 text-blue-100 max-w-2xl mx-auto">
            Our dedicated Trust & Safety team reviews every report within 24 hours. 
            {activeTab === "property"
              ? " By reporting suspicious activity, you're protecting thousands of potential home-seekers from financial fraud."
              : " By reporting fraudulent contractors, you're helping diaspora investors and local builders avoid devastating financial losses."}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>
                {activeTab === "property" ? "Escrow Verification" : "Contractor Vetting"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>24/7 Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>AI-driven fraud detection</span>
            </div>
            {activeTab === "contractor" && (
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <span>On-site Inspections</span>
              </div>
            )}
          </div>
          <Button className="mt-6 bg-white text-blue-600 hover:bg-blue-50">
            Start Formal Report
          </Button>
        </div>
      </div>
    </div>
  );
}