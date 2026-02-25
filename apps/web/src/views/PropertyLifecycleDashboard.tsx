'use client';

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Bell,
  Shield,
  Wrench,
  Home,
  Download,
  Plus,
  ChevronRight,
  Settings,
  Edit,
  Eye,
  RefreshCw,
  Package,
  Zap,
  Droplet,
  Wind,
  WashingMachine,
  Target,
  Award,
  CircleDollarSign,
  Wallet,
  Receipt,
  Building2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type definitions
interface Warranty {
  id: string;
  item: string;
  category: string;
  provider: string;
  startDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  coverageAmount: number;
  documentUrl: string;
  status: "active" | "expiring-soon" | "expired";
}

interface MaintenanceTask {
  id: string;
  title: string;
  category: string;
  frequency: string;
  lastCompleted: string;
  nextDue: string;
  priority: "high" | "medium" | "low";
  estimatedCost: number;
  status: "upcoming" | "due" | "overdue" | "completed";
}

interface RentalIncome {
  month: string;
  rent: number;
  utilities: number;
  maintenance: number;
  taxes: number;
  insurance: number;
  net: number;
}

interface Alert {
  id: string;
  type: "warranty" | "maintenance" | "payment" | "inspection";
  title: string;
  description: string;
  dueDate: string;
  priority: "critical" | "high" | "medium" | "low";
  actionRequired: boolean;
}

// Mock data
const warranties: Warranty[] = [
  {
    id: "W001",
    item: "HVAC System",
    category: "Appliances",
    provider: "CoolAir Solutions",
    startDate: "2023-03-15",
    expiryDate: "2026-03-15",
    daysUntilExpiry: 387,
    coverageAmount: 5000,
    documentUrl: "#",
    status: "active",
  },
  {
    id: "W002",
    item: "Roof Waterproofing",
    category: "Structure",
    provider: "ProRoof Inc.",
    startDate: "2022-06-01",
    expiryDate: "2027-06-01",
    daysUntilExpiry: 829,
    coverageAmount: 15000,
    documentUrl: "#",
    status: "active",
  },
  {
    id: "W003",
    item: "Kitchen Appliances Package",
    category: "Appliances",
    provider: "HomeTech Warranty",
    startDate: "2024-01-10",
    expiryDate: "2026-01-10",
    daysUntilExpiry: 323,
    coverageAmount: 3500,
    documentUrl: "#",
    status: "active",
  },
  {
    id: "W004",
    item: "Water Heater",
    category: "Plumbing",
    provider: "AquaHeat Services",
    startDate: "2023-08-20",
    expiryDate: "2026-02-22",
    daysUntilExpiry: 0,
    coverageAmount: 1200,
    documentUrl: "#",
    status: "expiring-soon",
  },
  {
    id: "W005",
    item: "Electrical Panel",
    category: "Electrical",
    provider: "PowerSafe Warranty",
    startDate: "2021-11-15",
    expiryDate: "2025-11-15",
    daysUntilExpiry: -99,
    coverageAmount: 2500,
    documentUrl: "#",
    status: "expired",
  },
];

const maintenanceTasks: MaintenanceTask[] = [
  {
    id: "M001",
    title: "HVAC Filter Replacement",
    category: "HVAC",
    frequency: "Quarterly",
    lastCompleted: "2025-11-15",
    nextDue: "2026-02-15",
    priority: "high",
    estimatedCost: 45,
    status: "overdue",
  },
  {
    id: "M002",
    title: "Gutter Cleaning",
    category: "Exterior",
    frequency: "Bi-annually",
    lastCompleted: "2025-09-01",
    nextDue: "2026-03-01",
    priority: "medium",
    estimatedCost: 150,
    status: "upcoming",
  },
  {
    id: "M003",
    title: "Smoke Detector Battery Check",
    category: "Safety",
    frequency: "Annually",
    lastCompleted: "2025-02-22",
    nextDue: "2026-02-22",
    priority: "high",
    estimatedCost: 20,
    status: "due",
  },
  {
    id: "M004",
    title: "Pool Maintenance Service",
    category: "Outdoor",
    frequency: "Monthly",
    lastCompleted: "2026-01-22",
    nextDue: "2026-02-22",
    priority: "medium",
    estimatedCost: 120,
    status: "due",
  },
  {
    id: "M005",
    title: "Window Seal Inspection",
    category: "Windows",
    frequency: "Annually",
    lastCompleted: "2025-04-10",
    nextDue: "2026-04-10",
    priority: "low",
    estimatedCost: 80,
    status: "upcoming",
  },
  {
    id: "M006",
    title: "Pest Control Treatment",
    category: "General",
    frequency: "Quarterly",
    lastCompleted: "2025-12-01",
    nextDue: "2026-03-01",
    priority: "medium",
    estimatedCost: 95,
    status: "upcoming",
  },
];

const rentalIncomeData: RentalIncome[] = [
  { month: "Aug", rent: 3500, utilities: 200, maintenance: 150, taxes: 300, insurance: 150, net: 2700 },
  { month: "Sep", rent: 3500, utilities: 180, maintenance: 350, taxes: 300, insurance: 150, net: 2520 },
  { month: "Oct", rent: 3500, utilities: 220, maintenance: 100, taxes: 300, insurance: 150, net: 2730 },
  { month: "Nov", rent: 3500, utilities: 250, maintenance: 200, taxes: 300, insurance: 150, net: 2600 },
  { month: "Dec", rent: 3500, utilities: 280, maintenance: 450, taxes: 300, insurance: 150, net: 2320 },
  { month: "Jan", rent: 3500, utilities: 300, maintenance: 120, taxes: 300, insurance: 150, net: 2630 },
];

const alerts: Alert[] = [
  {
    id: "A001",
    type: "warranty",
    title: "Water Heater Warranty Expiring Today",
    description: "Your water heater warranty expires today. Consider renewing or scheduling an inspection.",
    dueDate: "2026-02-22",
    priority: "critical",
    actionRequired: true,
  },
  {
    id: "A002",
    type: "maintenance",
    title: "HVAC Filter Replacement Overdue",
    description: "HVAC filter replacement was due on Feb 15. Schedule maintenance to maintain efficiency.",
    dueDate: "2026-02-15",
    priority: "high",
    actionRequired: true,
  },
  {
    id: "A003",
    type: "maintenance",
    title: "Smoke Detector Check Due Today",
    description: "Annual smoke detector battery check and testing is due today.",
    dueDate: "2026-02-22",
    priority: "high",
    actionRequired: true,
  },
  {
    id: "A004",
    type: "payment",
    title: "Property Tax Payment Due",
    description: "Next property tax installment is due in 5 days.",
    dueDate: "2026-02-27",
    priority: "medium",
    actionRequired: true,
  },
];

const roiData = [
  { year: "2021", value: 285000, expenses: 12000, income: 0 },
  { year: "2022", value: 295000, expenses: 15000, income: 42000 },
  { year: "2023", value: 310000, expenses: 14500, income: 42000 },
  { year: "2024", value: 325000, expenses: 16000, income: 42000 },
  { year: "2025", value: 342000, expenses: 15800, income: 42000 },
  { year: "2026", value: 355000, expenses: 8000, income: 21000 },
];

const expenseBreakdown = [
  { name: "Maintenance", value: 4200, color: "#3b82f6" },
  { name: "Utilities", value: 1450, color: "#10b981" },
  { name: "Taxes", value: 1800, color: "#f59e0b" },
  { name: "Insurance", value: 900, color: "#8b5cf6" },
  { name: "Management", value: 650, color: "#ec4899" },
];

export default function PropertyLifecycleDashboard() {
  const [selectedProperty, setSelectedProperty] = useState("Downtown Apartment");
  const [activeTab, setActiveTab] = useState("overview");

  const calculateROI = () => {
    const initialInvestment = 285000;
    const currentValue = 355000;
    const totalIncome = roiData.reduce((sum, year) => sum + year.income, 0);
    const totalExpenses = roiData.reduce((sum, year) => sum + year.expenses, 0);
    const netProfit = currentValue - initialInvestment + totalIncome - totalExpenses;
    const roi = ((netProfit / initialInvestment) * 100).toFixed(1);
    return { roi, netProfit, totalIncome, totalExpenses };
  };

  const roiStats = calculateROI();

  const getWarrantyIcon = (category: string) => {
    switch (category) {
      case "Appliances":
        return WashingMachine;
      case "Structure":
        return Home;
      case "Plumbing":
        return Droplet;
      case "Electrical":
        return Zap;
      default:
        return Package;
    }
  };

  const getMaintenanceIcon = (category: string) => {
    switch (category) {
      case "HVAC":
        return Wind;
      case "Plumbing":
        return Droplet;
      case "Electrical":
        return Zap;
      case "Safety":
        return Shield;
      default:
        return Wrench;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "expiring-soon":
      case "due":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "expired":
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-600 text-white";
      case "low":
        return "bg-blue-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">
                Property Lifecycle Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Comprehensive property management and tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-64 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Downtown Apartment">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Downtown Apartment
                    </div>
                  </SelectItem>
                  <SelectItem value="Suburban House">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Suburban House
                    </div>
                  </SelectItem>
                  <SelectItem value="Commercial Unit">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Commercial Unit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Alert Banner */}
          {alerts.filter((a) => a.priority === "critical" || a.priority === "high").length > 0 && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-red-900 mb-1">
                    {alerts.filter((a) => a.priority === "critical" || a.priority === "high").length}{" "}
                    Urgent Items Require Attention
                  </div>
                  <div className="text-sm text-red-700">
                    You have overdue maintenance tasks and expiring warranties
                  </div>
                </div>
                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700">
                  View All
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="warranties">Warranties</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="rental">Rental Income</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {warranties.filter((w) => w.status === "active").length} Active
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">
                  {warranties.length}
                </div>
                <div className="text-sm text-gray-600">Active Warranties</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-orange-600" />
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    {maintenanceTasks.filter((t) => t.status === "overdue" || t.status === "due").length} Due
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">
                  {maintenanceTasks.length}
                </div>
                <div className="text-sm text-gray-600">Maintenance Tasks</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8.2%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">$2,630</div>
                <div className="text-sm text-gray-600">Monthly Net Income</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    +{roiStats.roi}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">
                  ${(roiStats.netProfit / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-gray-600">Total ROI</div>
              </Card>
            </div>

            {/* Alerts & Reminders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Alerts & Reminders</h2>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Settings
                </Button>
              </div>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`p-4 border-2 ${
                      alert.priority === "critical"
                        ? "border-red-200 bg-red-50"
                        : alert.priority === "high"
                        ? "border-orange-200 bg-orange-50"
                        : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          alert.priority === "critical"
                            ? "bg-red-600"
                            : alert.priority === "high"
                            ? "bg-orange-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {alert.type === "warranty" ? (
                          <Shield className="w-5 h-5 text-white" />
                        ) : alert.type === "maintenance" ? (
                          <Wrench className="w-5 h-5 text-white" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{alert.title}</h3>
                              <Badge className={getPriorityColor(alert.priority)}>
                                {alert.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{alert.description}</p>
                            <div className="text-xs text-gray-600">
                              Due: {new Date(alert.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {alert.actionRequired && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                              Take Action
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-300">
                              Snooze
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Upcoming Maintenance */}
              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Upcoming Maintenance</h3>
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {maintenanceTasks.slice(0, 4).map((task) => {
                    const Icon = getMaintenanceIcon(task.category);
                    return (
                      <div key={task.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{task.title}</div>
                            <div className="text-xs text-gray-500">
                              Due: {new Date(task.nextDue).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Expiring Warranties */}
              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Warranty Status</h3>
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {warranties.slice(0, 4).map((warranty) => {
                    const Icon = getWarrantyIcon(warranty.category);
                    return (
                      <div key={warranty.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{warranty.item}</div>
                            <div className="text-xs text-gray-500">
                              {warranty.daysUntilExpiry > 0
                                ? `${warranty.daysUntilExpiry} days left`
                                : warranty.daysUntilExpiry === 0
                                ? "Expires today"
                                : "Expired"}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(warranty.status)}>
                          {warranty.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Warranties Tab */}
          <TabsContent value="warranties" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Warranty Tracker</h2>
                <p className="text-sm text-gray-600">
                  Monitor and manage all property warranties
                </p>
              </div>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Warranty
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Active Warranties</div>
                <div className="text-2xl font-bold text-green-600">
                  {warranties.filter((w) => w.status === "active").length}
                </div>
              </Card>
              <Card className="p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Expiring Soon</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {warranties.filter((w) => w.status === "expiring-soon").length}
                </div>
              </Card>
              <Card className="p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Coverage</div>
                <div className="text-2xl font-bold text-black">
                  ${warranties.reduce((sum, w) => sum + w.coverageAmount, 0).toLocaleString()}
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              {warranties.map((warranty) => {
                const Icon = getWarrantyIcon(warranty.category);
                return (
                  <Card key={warranty.id} className="p-5 border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{warranty.item}</h3>
                              <Badge className={getStatusColor(warranty.status)}>
                                {warranty.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">{warranty.provider}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Coverage</div>
                            <div className="font-semibold text-black">
                              ${warranty.coverageAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Start Date</div>
                            <div className="text-sm font-medium">
                              {new Date(warranty.startDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Expiry Date</div>
                            <div className="text-sm font-medium">
                              {new Date(warranty.expiryDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Days Remaining</div>
                            <div
                              className={`text-sm font-medium ${
                                warranty.daysUntilExpiry < 0
                                  ? "text-red-600"
                                  : warranty.daysUntilExpiry < 30
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {warranty.daysUntilExpiry < 0
                                ? "Expired"
                                : warranty.daysUntilExpiry === 0
                                ? "Today"
                                : `${warranty.daysUntilExpiry} days`}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Category</div>
                            <div className="text-sm font-medium">{warranty.category}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-gray-300">
                            <Eye className="w-3 h-3 mr-2" />
                            View Document
                          </Button>
                          <Button variant="outline" size="sm" className="border-gray-300">
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                          </Button>
                          {warranty.status === "expiring-soon" || warranty.status === "expired" ? (
                            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Renew Warranty
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Maintenance Schedule</h2>
                <p className="text-sm text-gray-600">
                  Track and schedule property maintenance tasks
                </p>
              </div>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-600">
                  {maintenanceTasks.filter((t) => t.status === "overdue").length}
                </div>
              </Card>
              <Card className="p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Due Soon</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {maintenanceTasks.filter((t) => t.status === "due").length}
                </div>
              </Card>
              <Card className="p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Upcoming</div>
                <div className="text-2xl font-bold text-blue-600">
                  {maintenanceTasks.filter((t) => t.status === "upcoming").length}
                </div>
              </Card>
              <Card className="p-4 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Est. Annual Cost</div>
                <div className="text-2xl font-bold text-black">
                  $
                  {maintenanceTasks
                    .reduce((sum, t) => {
                      const frequency = t.frequency.includes("Quarterly")
                        ? 4
                        : t.frequency.includes("Monthly")
                        ? 12
                        : t.frequency.includes("Bi-annually")
                        ? 2
                        : 1;
                      return sum + t.estimatedCost * frequency;
                    }, 0)
                    .toLocaleString()}
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              {maintenanceTasks.map((task) => {
                const Icon = getMaintenanceIcon(task.category);
                return (
                  <Card key={task.id} className="p-5 border-gray-200">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                          task.status === "overdue"
                            ? "bg-red-100"
                            : task.status === "due"
                            ? "bg-yellow-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            task.status === "overdue"
                              ? "text-red-600"
                              : task.status === "due"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{task.title}</h3>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              {task.priority === "high" && (
                                <Badge className="bg-red-100 text-red-800">
                                  High Priority
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{task.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Est. Cost</div>
                            <div className="font-semibold text-black">
                              ${task.estimatedCost}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Frequency</div>
                            <div className="text-sm font-medium">{task.frequency}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Last Completed</div>
                            <div className="text-sm font-medium">
                              {new Date(task.lastCompleted).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Next Due</div>
                            <div
                              className={`text-sm font-medium ${
                                task.status === "overdue"
                                  ? "text-red-600"
                                  : task.status === "due"
                                  ? "text-yellow-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {new Date(task.nextDue).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Priority</div>
                            <div className="text-sm font-medium capitalize">{task.priority}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-2" />
                            Mark Complete
                          </Button>
                          <Button variant="outline" size="sm" className="border-gray-300">
                            <CalendarIcon className="w-3 h-3 mr-2" />
                            Reschedule
                          </Button>
                          <Button variant="outline" size="sm" className="border-gray-300">
                            <Edit className="w-3 h-3 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Rental Income Tab */}
          <TabsContent value="rental" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Rental Income Tracker</h2>
                <p className="text-sm text-gray-600">
                  Monitor rental income and expenses
                </p>
              </div>
              <div className="flex gap-2">
                <Select defaultValue="6months">
                  <SelectTrigger className="w-40 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="12months">Last 12 Months</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-black mb-1">$21,000</div>
                <div className="text-sm text-gray-600">Total Income (6mo)</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-red-600" />
                  </div>
                  <TrendingDown className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-black mb-1">$5,220</div>
                <div className="text-sm text-gray-600">Total Expenses (6mo)</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">+8.2%</Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">$15,780</div>
                <div className="text-sm text-gray-600">Net Income (6mo)</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">75%</Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">75%</div>
                <div className="text-sm text-gray-600">Profit Margin</div>
              </Card>
            </div>

            {/* Income vs Expenses Chart */}
            <Card className="p-6 border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Income vs Expenses</h3>
                <p className="text-sm text-gray-600">Monthly breakdown over the last 6 months</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={rentalIncomeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="rent" fill="#10b981" name="Rental Income" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="maintenance"
                    stackId="expenses"
                    fill="#ef4444"
                    name="Maintenance"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="utilities"
                    stackId="expenses"
                    fill="#f59e0b"
                    name="Utilities"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="taxes"
                    stackId="expenses"
                    fill="#8b5cf6"
                    name="Taxes"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="insurance"
                    stackId="expenses"
                    fill="#3b82f6"
                    name="Insurance"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="net"
                    stroke="#059669"
                    strokeWidth={3}
                    name="Net Income"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            {/* Expense Breakdown */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 border-gray-200">
                <h3 className="font-semibold mb-4">Expense Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: $${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 border-gray-200">
                <h3 className="font-semibold mb-4">Monthly Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Rental Income</span>
                    </div>
                    <span className="font-semibold text-green-600">$3,500</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-gray-600">Utilities</span>
                    <span className="font-medium">-$300</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-gray-600">Maintenance</span>
                    <span className="font-medium">-$120</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-gray-600">Taxes</span>
                    <span className="font-medium">-$300</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-gray-600">Insurance</span>
                    <span className="font-medium">-$150</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-semibold">Net Income</span>
                    <span className="text-lg font-bold text-blue-600">$2,630</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ROI Analysis Tab */}
          <TabsContent value="roi" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Return on Investment (ROI)</h2>
                <p className="text-sm text-gray-600">
                  Comprehensive property investment analysis
                </p>
              </div>
              <Select defaultValue="lifetime">
                <SelectTrigger className="w-40 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="3years">Last 3 Years</SelectItem>
                  <SelectItem value="5years">Last 5 Years</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ROI Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{roiStats.roi}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">{roiStats.roi}%</div>
                <div className="text-sm text-gray-600">Total ROI</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CircleDollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-black mb-1">
                  ${(roiStats.netProfit / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-gray-600">Net Profit</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-800">+24.6%</Badge>
                </div>
                <div className="text-2xl font-bold text-black mb-1">$355k</div>
                <div className="text-sm text-gray-600">Current Value</div>
              </Card>

              <Card className="p-5 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-black mb-1">12.3%</div>
                <div className="text-sm text-gray-600">Annual Return</div>
              </Card>
            </div>

            {/* Property Value Trend */}
            <Card className="p-6 border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Property Value Growth</h3>
                <p className="text-sm text-gray-600">Historical value appreciation over time</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={roiData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    name="Property Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Income vs Expenses Over Time */}
            <Card className="p-6 border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Cumulative Cash Flow</h3>
                <p className="text-sm text-gray-600">
                  Total rental income and expenses over property lifetime
                </p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Rental Income" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Investment Summary */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 border-gray-200">
                <h3 className="font-semibold mb-4">Investment Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Initial Investment</span>
                    <span className="font-semibold">$285,000</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Market Value</span>
                    <span className="font-semibold text-blue-600">$355,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Appreciation</span>
                    <span className="font-semibold text-green-600">+$70,000</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Rental Income</span>
                    <span className="font-semibold">$189,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Expenses</span>
                    <span className="font-semibold text-red-600">-$82,150</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Net Rental Income</span>
                    <span className="font-semibold text-green-600">$106,850</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-semibold">Total Gain</span>
                    <span className="text-xl font-bold text-purple-600">
                      ${(roiStats.netProfit / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-gray-200">
                <h3 className="font-semibold mb-4">Key Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Cap Rate</span>
                      <span className="font-semibold">5.8%</span>
                    </div>
                    <Progress value={58} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Cash-on-Cash Return</span>
                      <span className="font-semibold">7.2%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Occupancy Rate</span>
                      <span className="font-semibold">95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Debt Service Coverage</span>
                      <span className="font-semibold">1.45x</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <Separator />
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Projected Annual Return</div>
                    <div className="text-2xl font-bold text-green-600">12.3%</div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
