import { useState } from "react";
import { Link } from "react-router";
import {
  Home,
  Heart,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  Search,
  Building2,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  Hammer,
  Truck,
  Shield,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Eye,
  Star,
  Users,
  Package,
  Wallet,
  Activity,
  ArrowUpRight,
  BarChart3,
  Target,
  Plus,
  Filter,
  Download,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { ThemeToggle } from "../components/ThemeToggle";

export default function BuyerDashboardEnhanced() {
  const [activeTab, setActiveTab] = useState("overview");

  // Active purchases with stage progress
  const activePurchases = [
    {
      id: "P001",
      property: "88 Sunset Boulevard, West Hills",
      image: "https://images.unsplash.com/photo-1757439402115-c3c496fe81ec?w=300&h=200&fit=crop",
      price: "$1,250,000",
      stage: 7,
      totalStages: 14,
      stageName: "Property Inspection",
      status: "in-progress",
      nextAction: "Review inspection report",
      dueDate: "2026-02-25",
      agent: "Sarah Johnson",
    },
    {
      id: "P002",
      property: "204 Sky View, Downtown City",
      image: "https://images.unsplash.com/photo-1472157510410-64a053cbc39f?w=300&h=200&fit=crop",
      price: "$450,000",
      stage: 3,
      totalStages: 14,
      stageName: "Offer Accepted",
      status: "action-required",
      nextAction: "Upload purchase agreement",
      dueDate: "2026-02-23",
      agent: "Michael Chen",
    },
  ];

  // Active construction projects
  const constructionProjects = [
    {
      id: "C001",
      name: "Green Valley Residence",
      location: "45 Green Oaks, Riverside",
      image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&h=200&fit=crop",
      budget: "$850,000",
      spent: "$425,000",
      progress: 50,
      milestonesComplete: 5,
      totalMilestones: 10,
      status: "on-track",
      contractor: "BuildRight Constructions",
      nextInspection: "2026-03-01",
    },
  ];

  // Saved properties
  const savedProperties = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1560725055-8a9be9f8b74f?w=300&h=200&fit=crop",
      price: "$785,000",
      address: "12 Maple Street, Northside",
      beds: 3,
      baths: 2,
      sqm: 185,
      verified: true,
      riskScore: 92,
      priceChange: "+2.5%",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&h=200&fit=crop",
      price: "$920,000",
      address: "78 Ocean Drive, Beachfront",
      beds: 4,
      baths: 3,
      sqm: 220,
      verified: true,
      riskScore: 88,
      priceChange: "-1.2%",
    },
  ];

  // Risk alerts
  const riskAlerts = [
    {
      id: "R001",
      type: "critical",
      title: "Property Inspection Deadline",
      description: "Inspection for 88 Sunset Boulevard expires in 3 days",
      action: "Schedule inspection",
      date: "2026-02-25",
    },
    {
      id: "R002",
      type: "warning",
      title: "Escrow Payment Due",
      description: "Second milestone payment for Green Valley project due soon",
      action: "Review & approve",
      date: "2026-02-27",
    },
  ];

  // Notifications
  const notifications = [
    {
      id: 1,
      type: "purchase",
      title: "Stage completed: Offer Accepted",
      description: "204 Sky View - Your offer has been accepted by the seller",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      type: "construction",
      title: "Milestone payment approved",
      description: "Foundation work payment released to contractor",
      time: "5 hours ago",
      unread: true,
    },
    {
      id: 3,
      type: "property",
      title: "New matching property",
      description: "3 new properties match your saved search criteria",
      time: "1 day ago",
      unread: false,
    },
  ];

  // Scheduled viewings
  const scheduledViewings = [
    {
      id: "V001",
      property: "156 Park Avenue, Central District",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&h=200&fit=crop",
      date: "2026-02-24",
      time: "10:00 AM",
      agent: "Emma Wilson",
      type: "In-Person",
    },
    {
      id: "V002",
      property: "92 Riverside Lane, Waterfront",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=200&fit=crop",
      date: "2026-02-26",
      time: "2:30 PM",
      agent: "David Lee",
      type: "Virtual Tour",
    },
  ];

  const getStageProgress = (stage: number, total: number) => {
    return Math.round((stage / total) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "action-required":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "on-track":
        return "bg-green-100 text-green-800 border-green-200";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">Buyer Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, John Buyer</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" className="border-gray-300 dark:border-gray-700">
                <Bell className="w-4 h-4 mr-2" />
                <Badge className="bg-red-600 text-white ml-1">
                  {notifications.filter((n) => n.unread).length}
                </Badge>
              </Button>
              <Button variant="outline" className="border-gray-300 dark:border-gray-700">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Link to="/app/listings">
                <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Properties
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-5 h-5 text-gray-600" />
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-black">{savedProperties.length}</div>
              <div className="text-xs text-gray-600">Saved Properties</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <Badge className="bg-orange-100 text-orange-800">
                  {activePurchases.filter((p) => p.status === "action-required").length}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-black">{activePurchases.length}</div>
              <div className="text-xs text-gray-600">Active Purchases</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Hammer className="w-5 h-5 text-gray-600" />
                <Badge className="bg-green-100 text-green-800">On Track</Badge>
              </div>
              <div className="text-2xl font-bold text-black">{constructionProjects.length}</div>
              <div className="text-xs text-gray-600">Construction Projects</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-gray-600" />
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-black">$125,000</div>
              <div className="text-xs text-gray-600">Escrow Balance</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
                <Badge className="bg-red-100 text-red-800">
                  {riskAlerts.filter((a) => a.type === "critical").length}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-black">{riskAlerts.length}</div>
              <div className="text-xs text-gray-600">Risk Alerts</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="purchases">Active Purchases</TabsTrigger>
            <TabsTrigger value="construction">Construction</TabsTrigger>
            <TabsTrigger value="saved">Saved Properties</TabsTrigger>
            <TabsTrigger value="viewings">Viewings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Risk Alerts */}
            {riskAlerts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Risk Alerts & Actions Required</h2>
                <div className="space-y-3">
                  {riskAlerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className={`p-4 border-2 ${
                        alert.type === "critical"
                          ? "border-red-200 bg-red-50"
                          : "border-yellow-200 bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              alert.type === "critical" ? "bg-red-600" : "bg-yellow-600"
                            }`}
                          >
                            <AlertTriangle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{alert.title}</h3>
                              <Badge
                                className={
                                  alert.type === "critical"
                                    ? "bg-red-600 text-white"
                                    : "bg-yellow-600 text-white"
                                }
                              >
                                {alert.type.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                            <div className="text-xs text-gray-600">
                              Due: {new Date(alert.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                          {alert.action}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Active Purchases Summary */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Active Purchases</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("purchases")}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {activePurchases.slice(0, 2).map((purchase) => (
                    <Card key={purchase.id} className="p-4 border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={purchase.image}
                          alt={purchase.property}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1">{purchase.property}</div>
                          <div className="text-xs text-gray-600 mb-2">{purchase.price}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(purchase.status)}>
                              Stage {purchase.stage}/{purchase.totalStages}
                            </Badge>
                          </div>
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{purchase.stageName}</span>
                              <span>{getStageProgress(purchase.stage, purchase.totalStages)}%</span>
                            </div>
                            <Progress
                              value={getStageProgress(purchase.stage, purchase.totalStages)}
                              className="h-1.5"
                            />
                          </div>
                          <Link to={`/workspace/${purchase.id}`}>
                            <Button size="sm" variant="outline" className="w-full border-gray-300">
                              View Workspace
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Construction Projects Summary */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Construction Projects</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("construction")}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {constructionProjects.map((project) => (
                    <Card key={project.id} className="p-4 border-gray-200">
                      <div className="flex gap-3">
                        <img
                          src={project.image}
                          alt={project.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1">{project.name}</div>
                          <div className="text-xs text-gray-600 mb-2">{project.location}</div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div>
                              <div className="text-gray-600">Spent</div>
                              <div className="font-semibold">{project.spent}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Budget</div>
                              <div className="font-semibold">{project.budget}</div>
                            </div>
                          </div>
                          <Link to="/construction">
                            <Button size="sm" variant="outline" className="w-full border-gray-300">
                              View Project
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Link to="/construction">
                    <Button variant="outline" className="w-full border-gray-300">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Project
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
              <Card className="p-4 border-gray-200">
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={notification.id}>
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.type === "purchase"
                              ? "bg-blue-100"
                              : notification.type === "construction"
                              ? "bg-orange-100"
                              : "bg-green-100"
                          }`}
                        >
                          {notification.type === "purchase" ? (
                            <FileText className="w-4 h-4 text-blue-600" />
                          ) : notification.type === "construction" ? (
                            <Hammer className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Home className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-sm mb-1">
                                {notification.title}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                {notification.description}
                              </div>
                              <div className="text-xs text-gray-500">{notification.time}</div>
                            </div>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Active Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">All Active Purchases</h2>
              <Link to="/app/listings">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Purchase
                </Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {activePurchases.map((purchase) => (
                <Card key={purchase.id} className="p-6 border-gray-200">
                  <div className="flex gap-6">
                    <img
                      src={purchase.image}
                      alt={purchase.property}
                      className="w-48 h-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{purchase.property}</h3>
                          <div className="text-gray-600">{purchase.price}</div>
                        </div>
                        <Badge className={getStatusColor(purchase.status)}>
                          {purchase.status.replace("-", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Current Stage</div>
                          <div className="font-semibold text-sm">{purchase.stageName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Progress</div>
                          <div className="font-semibold text-sm">
                            {purchase.stage}/{purchase.totalStages} Stages
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Next Action</div>
                          <div className="font-semibold text-sm">{purchase.nextAction}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Agent</div>
                          <div className="font-semibold text-sm">{purchase.agent}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Stage Progress</span>
                          <span>{getStageProgress(purchase.stage, purchase.totalStages)}%</span>
                        </div>
                        <Progress
                          value={getStageProgress(purchase.stage, purchase.totalStages)}
                          className="h-2"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Link to={`/workspace/${purchase.id}`}>
                          <Button className="bg-black text-white hover:bg-gray-800">
                            <Eye className="w-4 h-4 mr-2" />
                            View Workspace
                          </Button>
                        </Link>
                        <Link to="/escrow">
                          <Button variant="outline" className="border-gray-300">
                            <Wallet className="w-4 h-4 mr-2" />
                            Escrow Details
                          </Button>
                        </Link>
                        <Button variant="outline" className="border-gray-300">
                          <FileText className="w-4 h-4 mr-2" />
                          Documents
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Construction Tab */}
          <TabsContent value="construction" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Construction Projects</h2>
              <Link to="/construction">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {constructionProjects.map((project) => (
                <Card key={project.id} className="p-6 border-gray-200">
                  <div className="flex gap-6">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-48 h-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                          <div className="text-gray-600">{project.location}</div>
                        </div>
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Budget</div>
                          <div className="font-semibold text-sm">{project.budget}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Spent</div>
                          <div className="font-semibold text-sm">{project.spent}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Milestones</div>
                          <div className="font-semibold text-sm">
                            {project.milestonesComplete}/{project.totalMilestones}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Contractor</div>
                          <div className="font-semibold text-sm">{project.contractor}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Overall Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      <div className="flex gap-2">
                        <Link to="/construction">
                          <Button className="bg-black text-white hover:bg-gray-800">
                            <Eye className="w-4 h-4 mr-2" />
                            View Project
                          </Button>
                        </Link>
                        <Link to="/boq-workspace">
                          <Button variant="outline" className="border-gray-300">
                            <FileText className="w-4 h-4 mr-2" />
                            BOQ
                          </Button>
                        </Link>
                        <Link to="/inspection-verification">
                          <Button variant="outline" className="border-gray-300">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Inspections
                          </Button>
                        </Link>
                        <Link to="/logistics-delivery-marketplace">
                          <Button variant="outline" className="border-gray-300">
                            <Truck className="w-4 h-4 mr-2" />
                            Logistics
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Saved Properties Tab */}
          <TabsContent value="saved" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Saved Properties ({savedProperties.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Link to="/app/listings">
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Search className="w-4 h-4 mr-2" />
                    Browse More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {savedProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden border-gray-200">
                  <div className="relative">
                    <img
                      src={property.image}
                      alt={property.address}
                      className="w-full h-48 object-cover"
                    />
                    <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </button>
                    {property.verified && (
                      <Badge className="absolute top-3 left-3 bg-green-600 text-white">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xl font-bold text-black mb-1">{property.price}</div>
                        <div className="text-sm text-gray-600">{property.address}</div>
                      </div>
                      <Badge
                        className={
                          property.priceChange.startsWith("+")
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {property.priceChange}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-4 h-4" />
                        {property.beds}
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {property.baths}
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        {property.sqm}m²
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 mb-1">Risk Score</div>
                        <Progress value={property.riskScore} className="h-1.5" />
                      </div>
                      <div className="text-sm font-semibold">{property.riskScore}/100</div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/app/property/${property.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-gray-300">
                          View Details
                        </Button>
                      </Link>
                      <Button className="flex-1 bg-black text-white hover:bg-gray-800">
                        Make Offer
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Viewings Tab */}
          <TabsContent value="viewings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Scheduled Viewings ({scheduledViewings.length})
              </h2>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar View
              </Button>
            </div>
            <div className="space-y-3">
              {scheduledViewings.map((viewing) => (
                <Card key={viewing.id} className="p-5 border-gray-200">
                  <div className="flex gap-4">
                    <img
                      src={viewing.image}
                      alt={viewing.property}
                      className="w-32 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold mb-1">{viewing.property}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(viewing.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {viewing.time}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">{viewing.type}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Users className="w-4 h-4" />
                        <span>Agent: {viewing.agent}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-gray-300">
                          Reschedule
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-300">
                          Cancel
                        </Button>
                        <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                          Get Directions
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-6 p-6 border-gray-200 bg-gradient-to-r from-gray-900 to-gray-700 text-white">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-6 gap-3">
            <Link to="/app/listings">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Search className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Browse</div>
              </button>
            </Link>
            <Link to="/contractor-supplier-marketplace">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Contractors</div>
              </button>
            </Link>
            <Link to="/boq-workspace">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">BOQ</div>
              </button>
            </Link>
            <Link to="/ai-design-studio">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Star className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">AI Studio</div>
              </button>
            </Link>
            <Link to="/property-lifecycle">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Activity className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Lifecycle</div>
              </button>
            </Link>
            <Link to="/risk-analytics">
              <button className="w-full p-4 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                <div className="text-xs">Analytics</div>
              </button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}