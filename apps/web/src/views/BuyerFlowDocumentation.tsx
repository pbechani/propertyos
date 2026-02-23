'use client';

import { Link } from "@/lib/router-compat";
import { 
  Home, 
  UserPlus, 
  CheckCircle, 
  Search,
  FileText,
  Hammer,
  Package,
  Truck,
  Activity,
  Star,
  ArrowRight,
  CheckSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BuyerFlowDocumentation() {
  const flowSteps = [
    {
      phase: "Entry",
      icon: Home,
      color: "bg-blue-600",
      steps: [
        { name: "Landing Page", route: "/", screen: "PublicHomeVariation2", status: "✓" },
        { name: "Register", route: "/register", screen: "Register", status: "✓" },
        { name: "Select 'Buyer'", route: "/role-selection", screen: "RoleSelection", status: "✓" },
        { name: "KYC Upload", route: "/kyc-upload", screen: "KYCUpload", status: "✓" },
        { name: "Verification Pending → Verified", route: "/profile-dashboard", screen: "ProfileDashboard", status: "✓" },
      ],
    },
    {
      phase: "Buyer Dashboard (Home)",
      icon: CheckSquare,
      color: "bg-green-600",
      steps: [
        { name: "Buyer Dashboard", route: "/buyer-dashboard", screen: "BuyerDashboardEnhanced", status: "✓" },
      ],
      widgets: [
        "Saved properties",
        "Active purchases (stage progress)",
        "Active construction projects",
        "Escrow balance",
        "Risk alerts",
        "Notifications",
      ],
    },
    {
      phase: "Flow A: Browse & Evaluate Property",
      icon: Search,
      color: "bg-purple-600",
      steps: [
        { name: "Search Properties", route: "/app/listings", screen: "Listings", status: "✓" },
        { name: "Filter + Map View", route: "/app/listings", screen: "Listings (with filters)", status: "✓" },
        { name: "View Property Detail", route: "/app/property/1", screen: "PropertyDetailEnhanced", status: "✓" },
        { name: "View Agent Profile", route: "/agent-profile/agent-001?back=/app/property/1", screen: "AgentProfile", status: "✓" },
        { name: "Property Comparison", route: "/compare", screen: "PropertyComparison", status: "✓" },
      ],
      features: [
        "Verification badge",
        "Ownership history",
        "Risk score",
        "Save to favorites",
        "Schedule viewing",
        "Send inquiry",
      ],
    },
    {
      phase: "Flow B: Start Purchase",
      icon: FileText,
      color: "bg-orange-600",
      steps: [
        { name: "Sale Workspace (14-stage)", route: "/workspace/1", screen: "PropertySaleWorkspace", status: "✓" },
        { name: "Buyer View", route: "/buyer-workspace", screen: "BuyerSimpleView", status: "✓" },
        { name: "Escrow Dashboard", route: "/escrow", screen: "EscrowFinancialDashboard", status: "✓" },
      ],
      features: [
        "Initiate offer",
        "Assigned agent/conveyancer",
        "14-stage pipeline tracking",
        "Upload required documents",
        "Track stage progression",
        "Deposit escrow funds",
        "Approve escrow release",
        "Final completion certificate",
      ],
    },
    {
      phase: "Flow C: Construction Project",
      icon: Hammer,
      color: "bg-red-600",
      steps: [
        { name: "Construction Dashboard", route: "/construction", screen: "ConstructionProjectDashboard", status: "✓" },
        { name: "Contractor Marketplace", route: "/contractor-supplier-marketplace", screen: "ContractorSupplierMarketplace", status: "✓" },
        { name: "Inspection & Verification", route: "/inspection-verification", screen: "InspectionVerificationModule", status: "✓" },
      ],
      features: [
        "Create new project",
        "Set budget",
        "Define milestones",
        "Post RFQ to contractors",
        "Compare quotes",
        "Accept contractor",
        "Link escrow to milestones",
        "Monitor progress (photo uploads)",
        "Approve milestone payments",
        "Schedule inspections",
      ],
    },
    {
      phase: "Flow D: Use BOQ",
      icon: Package,
      color: "bg-yellow-600",
      steps: [
        { name: "BOQ Workspace", route: "/boq-workspace", screen: "IntelligentBOQWorkspace", status: "✓" },
        { name: "Supplier Catalog", route: "/contractor-supplier-marketplace", screen: "ContractorSupplierMarketplace (Suppliers)", status: "✓" },
      ],
      features: [
        "Create BOQ manually",
        "Generate from AI design",
        "Adjust materials",
        "Compare supplier prices",
        "Convert to RFQs",
        "Approve supplier",
        "Track procurement",
      ],
    },
    {
      phase: "Flow E: Logistics",
      icon: Truck,
      color: "bg-indigo-600",
      steps: [
        { name: "Logistics & Delivery", route: "/logistics-delivery-marketplace", screen: "LogisticsDeliveryMarketplace", status: "✓" },
      ],
      features: [
        "Book delivery",
        "Compare operator quotes",
        "Confirm booking",
        "Track truck live",
        "Confirm delivery",
        "Release escrow",
      ],
    },
    {
      phase: "Flow F: Post-Construction",
      icon: Activity,
      color: "bg-pink-600",
      steps: [
        { name: "Property Lifecycle", route: "/property-lifecycle", screen: "PropertyLifecycleDashboard", status: "✓" },
        { name: "Risk & Analytics", route: "/risk-analytics", screen: "RiskAnalyticsDashboard", status: "✓" },
      ],
      features: [
        "Warranty tracking",
        "Maintenance scheduling",
        "Rental management (optional)",
        "ROI dashboard",
      ],
    },
    {
      phase: "AI Touchpoints",
      icon: Star,
      color: "bg-cyan-600",
      steps: [
        { name: "AI Design Studio", route: "/ai-design-studio", screen: "AIDesignStudio", status: "✓" },
      ],
      features: [
        "Ask legal questions",
        "Upload document for review",
        "Generate house design",
        "Get budget optimization suggestions",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black">Buyer Flow Documentation</h1>
                <p className="text-sm text-gray-600">Complete buyer journey mapping</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" className="border-gray-300">
                Back to Home
              </Button>
            </Link>
          </div>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">
                  ✓ All Buyer Flow Screens Implemented
                </h3>
                <p className="text-sm text-green-800 mb-2">
                  The complete buyer journey has been implemented with all required screens,
                  features, and integrations. Every flow from entry to post-construction is
                  functional and accessible.
                </p>
                <div className="text-xs text-green-700">
                  Total Screens: {flowSteps.reduce((acc, phase) => acc + phase.steps.length, 0)} •
                  Flows: {flowSteps.length}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {flowSteps.map((phase, index) => {
          const PhaseIcon = phase.icon;
          return (
            <div key={index}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${phase.color} rounded-lg flex items-center justify-center`}>
                  <PhaseIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{phase.phase}</h2>
                  <p className="text-sm text-gray-600">
                    {phase.steps.length} screen{phase.steps.length !== 1 ? "s" : ""} •{" "}
                    {phase.features?.length || 0} feature{phase.features?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {/* Screens */}
                {phase.steps.map((step, stepIndex) => (
                  <Card key={stepIndex} className="p-5 border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold mb-1">{step.name}</div>
                          <div className="text-sm text-gray-600">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {step.route}
                            </span>
                            {" → "}
                            <span className="text-xs text-gray-500">{step.screen}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">{step.status}</Badge>
                        <Link to={step.route}>
                          <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                            View Screen
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Widgets */}
                {phase.widgets && (
                  <Card className="p-5 border-gray-200 bg-blue-50">
                    <div className="mb-3">
                      <div className="font-semibold text-sm mb-2">Dashboard Widgets:</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {phase.widgets.map((widget, widgetIndex) => (
                        <div
                          key={widgetIndex}
                          className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded"
                        >
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                          {widget}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Features */}
                {phase.features && (
                  <Card className="p-5 border-gray-200 bg-purple-50">
                    <div className="mb-3">
                      <div className="font-semibold text-sm mb-2">Key Features:</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {phase.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded"
                        >
                          <CheckCircle className="w-4 h-4 text-purple-600" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          );
        })}

        {/* Flow Visualization */}
        <Card className="p-6 border-gray-200">
          <h3 className="font-semibold text-lg mb-4">Complete Buyer Journey Flow</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  1
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">Landing</span> → Register → KYC → Verification
                </div>
              </div>

              <div className="flex items-center gap-2 ml-8">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  2
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">Buyer Dashboard</span> (Central Hub)
                </div>
              </div>

              <div className="flex items-center gap-2 ml-16">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  A
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">Browse & Evaluate</span> → Search → Detail → Save/Schedule
                </div>
              </div>

              <div className="flex items-center gap-2 ml-16">
                <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  B
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">Start Purchase</span> → 14 Stages → Escrow → Complete
                </div>
              </div>

              <div className="flex items-center gap-2 ml-16">
                <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  C
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">Construction</span> → RFQ → Contractor → Milestones → Inspections
                </div>
              </div>

              <div className="flex items-center gap-2 ml-16">
                <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  D
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">BOQ Workspace</span> → Materials → Suppliers → Procurement
                </div>
              </div>

              <div className="flex items-center gap-2 ml-16">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  E
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">Logistics</span> → Book → Track → Deliver → Confirm
                </div>
              </div>

              <div className="flex items-center gap-2 ml-16">
                <div className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  F
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">Post-Construction</span> → Warranty → Maintenance → ROI
                </div>
              </div>

              <div className="flex items-center gap-2 ml-16">
                <div className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  AI
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                  <span className="font-semibold">AI Studio</span> → Design → Legal → Optimization (Available throughout)
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Integration Points */}
        <Card className="p-6 border-gray-200 bg-gradient-to-br from-gray-900 to-gray-700 text-white">
          <h3 className="font-semibold text-lg mb-4">Integration Points</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-300 mb-2">Escrow Integration</div>
              <ul className="text-sm space-y-1">
                <li>• Purchase deposits</li>
                <li>• Milestone payments</li>
                <li>• Delivery confirmations</li>
                <li>• Final settlements</li>
              </ul>
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-2">Document Management</div>
              <ul className="text-sm space-y-1">
                <li>• Purchase agreements</li>
                <li>• Construction contracts</li>
                <li>• Inspection reports</li>
                <li>• Warranty certificates</li>
              </ul>
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-2">Notification System</div>
              <ul className="text-sm space-y-1">
                <li>• Stage completions</li>
                <li>• Payment approvals</li>
                <li>• Inspection schedules</li>
                <li>• Risk alerts</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Quick Access */}
        <Card className="p-6 border-gray-200">
          <h3 className="font-semibold mb-4">Quick Access to Key Screens</h3>
          <div className="grid grid-cols-4 gap-3">
            <Link to="/buyer-dashboard">
              <Button variant="outline" className="w-full border-gray-300">
                <Home className="w-4 h-4 mr-2" />
                Buyer Hub
              </Button>
            </Link>
            <Link to="/app/listings">
              <Button variant="outline" className="w-full border-gray-300">
                <Search className="w-4 h-4 mr-2" />
                Browse
              </Button>
            </Link>
            <Link to="/workspace/1">
              <Button variant="outline" className="w-full border-gray-300">
                <FileText className="w-4 h-4 mr-2" />
                Purchase
              </Button>
            </Link>
            <Link to="/construction">
              <Button variant="outline" className="w-full border-gray-300">
                <Hammer className="w-4 h-4 mr-2" />
                Build
              </Button>
            </Link>
            <Link to="/boq-workspace">
              <Button variant="outline" className="w-full border-gray-300">
                <Package className="w-4 h-4 mr-2" />
                BOQ
              </Button>
            </Link>
            <Link to="/logistics-delivery-marketplace">
              <Button variant="outline" className="w-full border-gray-300">
                <Truck className="w-4 h-4 mr-2" />
                Logistics
              </Button>
            </Link>
            <Link to="/property-lifecycle">
              <Button variant="outline" className="w-full border-gray-300">
                <Activity className="w-4 h-4 mr-2" />
                Lifecycle
              </Button>
            </Link>
            <Link to="/ai-design-studio">
              <Button variant="outline" className="w-full border-gray-300">
                <Star className="w-4 h-4 mr-2" />
                AI Studio
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
