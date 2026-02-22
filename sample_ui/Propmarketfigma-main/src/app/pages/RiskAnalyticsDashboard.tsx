import { useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  DollarSign,
  Clock,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Eye,
  Bell,
  Filter,
  Download,
  Calendar,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Flame,
  Info,
  ChevronRight,
  MapPin,
  FileText,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
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
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from "recharts";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// Type definitions
interface RiskScore {
  score: number;
  trend: "up" | "down" | "stable";
  factors: Array<{ name: string; impact: number; status: "critical" | "warning" | "good" }>;
}

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "fraud" | "budget" | "timeline" | "compliance" | "quality";
  title: string;
  description: string;
  timestamp: string;
  actionRequired: boolean;
  affectedEntity: string;
}

interface Anomaly {
  id: string;
  type: string;
  description: string;
  confidence: number;
  timestamp: string;
  status: "investigating" | "resolved" | "dismissed";
}

// Mock data
const contractorRiskScore: RiskScore = {
  score: 68,
  trend: "down",
  factors: [
    { name: "Payment History", impact: 15, status: "good" },
    { name: "Project Completion Rate", impact: 10, status: "warning" },
    { name: "Insurance Coverage", impact: 5, status: "good" },
    { name: "License Verification", impact: 0, status: "good" },
    { name: "Customer Complaints", impact: 8, status: "warning" },
    { name: "Financial Stability", impact: 12, status: "critical" },
  ],
};

const propertyRiskScore: RiskScore = {
  score: 82,
  trend: "stable",
  factors: [
    { name: "Market Volatility", impact: 7, status: "warning" },
    { name: "Documentation Complete", impact: 2, status: "good" },
    { name: "Legal Issues", impact: 0, status: "good" },
    { name: "Environmental Risks", impact: 3, status: "good" },
    { name: "Valuation Accuracy", impact: 6, status: "warning" },
  ],
};

const projectHealthScore: RiskScore = {
  score: 74,
  trend: "up",
  factors: [
    { name: "Budget Adherence", impact: 12, status: "warning" },
    { name: "Timeline Progress", impact: 8, status: "warning" },
    { name: "Quality Metrics", impact: 4, status: "good" },
    { name: "Stakeholder Satisfaction", impact: 5, status: "good" },
    { name: "Resource Availability", impact: 3, status: "good" },
  ],
};

const budgetVarianceData = [
  { month: "Jan", planned: 45000, actual: 48000, variance: 3000 },
  { month: "Feb", planned: 52000, actual: 49500, variance: -2500 },
  { month: "Mar", planned: 48000, actual: 52000, variance: 4000 },
  { month: "Apr", planned: 55000, actual: 58000, variance: 3000 },
  { month: "May", planned: 60000, actual: 57000, variance: -3000 },
  { month: "Jun", planned: 50000, actual: 53500, variance: 3500 },
];

const timelineVarianceData = [
  { phase: "Foundation", planned: 20, actual: 23, variance: 3 },
  { phase: "Framing", planned: 15, actual: 14, variance: -1 },
  { phase: "Electrical", planned: 10, actual: 13, variance: 3 },
  { phase: "Plumbing", planned: 12, actual: 15, variance: 3 },
  { phase: "Finishing", planned: 18, actual: 16, variance: -2 },
];

const fraudAlerts: Alert[] = [
  {
    id: "FA-001",
    severity: "critical",
    category: "fraud",
    title: "Duplicate Invoice Detected",
    description: "Invoice #INV-4567 appears to be a duplicate of INV-4532 from the same contractor. Amount: $12,500.",
    timestamp: "2026-02-22T10:30:00",
    actionRequired: true,
    affectedEntity: "Contractor: Swift Construction Co.",
  },
  {
    id: "FA-002",
    severity: "high",
    category: "fraud",
    title: "Suspicious Login Pattern",
    description: "Multiple failed login attempts from unusual location (IP: 192.168.x.x) targeting admin accounts.",
    timestamp: "2026-02-22T09:15:00",
    actionRequired: true,
    affectedEntity: "System: Admin Portal",
  },
  {
    id: "FA-003",
    severity: "medium",
    category: "compliance",
    title: "Missing Documentation",
    description: "Property listing #PROP-8901 missing required environmental clearance certificate.",
    timestamp: "2026-02-21T16:45:00",
    actionRequired: true,
    affectedEntity: "Property: Downtown Office Complex",
  },
];

const platformKPIs = [
  { name: "Total Users", value: "24,567", change: "+12.5%", trend: "up" },
  { name: "Active Projects", value: "1,247", change: "+8.2%", trend: "up" },
  { name: "Platform Revenue", value: "$2.4M", change: "+15.3%", trend: "up" },
  { name: "Avg Response Time", value: "1.2s", change: "-18.5%", trend: "down" },
  { name: "Fraud Detection Rate", value: "99.2%", change: "+2.1%", trend: "up" },
  { name: "User Satisfaction", value: "4.7/5", change: "+0.3", trend: "up" },
];

const anomalyAlerts: Anomaly[] = [
  {
    id: "AN-001",
    type: "Transaction Pattern",
    description: "Unusual spike in transaction volume from contractor ID: CT-4523",
    confidence: 94,
    timestamp: "2026-02-22T11:20:00",
    status: "investigating",
  },
  {
    id: "AN-002",
    type: "Pricing Anomaly",
    description: "Property valuation 35% below market average for similar properties in area",
    confidence: 87,
    timestamp: "2026-02-22T10:05:00",
    status: "investigating",
  },
  {
    id: "AN-003",
    type: "User Behavior",
    description: "Account CT-1829 accessing sensitive data outside normal hours",
    confidence: 91,
    timestamp: "2026-02-21T23:45:00",
    status: "resolved",
  },
];

const heatmapData = [
  { region: "North District", risk: 85, volume: 234, fraud: 2 },
  { region: "South District", risk: 45, volume: 456, fraud: 0 },
  { region: "East District", risk: 62, volume: 189, fraud: 1 },
  { region: "West District", risk: 38, volume: 312, fraud: 0 },
  { region: "Central Business", risk: 72, volume: 567, fraud: 3 },
  { region: "Suburban Area", risk: 28, volume: 145, fraud: 0 },
];

const riskTrendData = [
  { date: "W1", contractor: 72, property: 78, project: 70 },
  { date: "W2", contractor: 70, property: 80, project: 72 },
  { date: "W3", contractor: 69, property: 82, project: 73 },
  { date: "W4", contractor: 68, property: 82, project: 74 },
];

export default function RiskAnalyticsDashboard() {
  const [activeView, setActiveView] = useState<"overview" | "admin">("overview");
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return "Low Risk";
    if (score >= 60) return "Medium Risk";
    return "High Risk";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const RiskGauge = ({ score, label }: { score: number; label: string }) => {
    const data = [{ name: label, value: score, fill: score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626" }];
    
    return (
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="100%"
            barSize={20}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl font-bold ${getRiskColor(score)}`}>{score}</div>
          <div className="text-sm text-gray-500 mt-1">{getRiskLabel(score)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">
                Risk & Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Real-time monitoring and early warning system
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Alert Banner */}
          {fraudAlerts.filter((a) => a.severity === "critical").length > 0 && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-red-900 mb-1">
                    {fraudAlerts.filter((a) => a.severity === "critical").length} Critical Alerts
                    Require Immediate Attention
                  </div>
                  <div className="text-sm text-red-700">
                    Review critical issues in the fraud alerts section below
                  </div>
                </div>
                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700">
                  Review Now
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Risk Overview</TabsTrigger>
            <TabsTrigger value="admin">Admin Analytics</TabsTrigger>
          </TabsList>

          {/* Risk Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Risk Scores */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Risk Scores</h2>
              <div className="grid grid-cols-3 gap-6">
                {/* Contractor Risk */}
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold">Contractor Risk</h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        contractorRiskScore.trend === "up"
                          ? "bg-green-100 text-green-800"
                          : contractorRiskScore.trend === "down"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {contractorRiskScore.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : contractorRiskScore.trend === "down" ? (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      ) : null}
                      {contractorRiskScore.trend}
                    </Badge>
                  </div>
                  <RiskGauge score={contractorRiskScore.score} label="Contractor" />
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Risk Factors:</div>
                    {contractorRiskScore.factors.slice(0, 3).map((factor) => (
                      <div key={factor.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              factor.status === "critical"
                                ? "bg-red-600"
                                : factor.status === "warning"
                                ? "bg-yellow-600"
                                : "bg-green-600"
                            }`}
                          />
                          <span className="text-gray-700">{factor.name}</span>
                        </div>
                        <span className="text-gray-500">+{factor.impact}%</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Property Risk */}
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold">Property Risk</h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        propertyRiskScore.trend === "up"
                          ? "bg-green-100 text-green-800"
                          : propertyRiskScore.trend === "down"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {propertyRiskScore.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : propertyRiskScore.trend === "down" ? (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      ) : null}
                      {propertyRiskScore.trend}
                    </Badge>
                  </div>
                  <RiskGauge score={propertyRiskScore.score} label="Property" />
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Risk Factors:</div>
                    {propertyRiskScore.factors.slice(0, 3).map((factor) => (
                      <div key={factor.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              factor.status === "critical"
                                ? "bg-red-600"
                                : factor.status === "warning"
                                ? "bg-yellow-600"
                                : "bg-green-600"
                            }`}
                          />
                          <span className="text-gray-700">{factor.name}</span>
                        </div>
                        <span className="text-gray-500">+{factor.impact}%</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Project Health */}
                <Card className="p-6 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold">Project Health</h3>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        projectHealthScore.trend === "up"
                          ? "bg-green-100 text-green-800"
                          : projectHealthScore.trend === "down"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {projectHealthScore.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : projectHealthScore.trend === "down" ? (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      ) : null}
                      {projectHealthScore.trend}
                    </Badge>
                  </div>
                  <RiskGauge score={projectHealthScore.score} label="Project" />
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Health Factors:</div>
                    {projectHealthScore.factors.slice(0, 3).map((factor) => (
                      <div key={factor.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              factor.status === "critical"
                                ? "bg-red-600"
                                : factor.status === "warning"
                                ? "bg-yellow-600"
                                : "bg-green-600"
                            }`}
                          />
                          <span className="text-gray-700">{factor.name}</span>
                        </div>
                        <span className="text-gray-500">+{factor.impact}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Variance Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Budget Variance */}
              <Card className="p-6 border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Budget Variance</h3>
                    <p className="text-sm text-gray-600">Planned vs. Actual spending</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    +8.2% Overrun
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={budgetVarianceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: any) => [`$${value.toLocaleString()}`, ""]}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Legend />
                    <Bar dataKey="planned" fill="#E5E7EB" name="Planned" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="variance" stroke="#ef4444" strokeWidth={2} name="Variance" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>

              {/* Timeline Variance */}
              <Card className="p-6 border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Timeline Variance</h3>
                    <p className="text-sm text-gray-600">Planned vs. Actual timeline (days)</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    +6 days behind
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timelineVarianceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="phase" type="category" axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Legend />
                    <Bar dataKey="planned" fill="#E5E7EB" name="Planned (days)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="actual" fill="#f59e0b" name="Actual (days)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Risk Trend Over Time */}
            <Card className="p-6 border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Risk Score Trends</h3>
                <p className="text-sm text-gray-600">4-week historical comparison</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="contractor" stroke="#ef4444" strokeWidth={2} name="Contractor Risk" />
                  <Line type="monotone" dataKey="property" stroke="#3b82f6" strokeWidth={2} name="Property Risk" />
                  <Line type="monotone" dataKey="project" stroke="#f59e0b" strokeWidth={2} name="Project Health" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Fraud Alerts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Fraud & Compliance Alerts</h2>
                <Badge className="bg-red-600 text-white">
                  {fraudAlerts.filter((a) => a.actionRequired).length} Action Required
                </Badge>
              </div>
              <div className="space-y-3">
                {fraudAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`p-5 border-2 ${
                      alert.severity === "critical"
                        ? "border-red-200 bg-red-50"
                        : alert.severity === "high"
                        ? "border-orange-200 bg-orange-50"
                        : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          alert.severity === "critical"
                            ? "bg-red-600"
                            : alert.severity === "high"
                            ? "bg-orange-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {alert.category === "fraud" ? (
                          <Shield className="w-6 h-6 text-white" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{alert.title}</h3>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                            <div className="text-xs text-gray-600">
                              {alert.affectedEntity} • {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {alert.actionRequired && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                              <Eye className="w-3 h-3 mr-2" />
                              Investigate
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-300">
                              <Bell className="w-3 h-3 mr-2" />
                              Notify Admin
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-300">
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Admin Analytics Tab */}
          <TabsContent value="admin" className="space-y-6">
            {/* Platform KPIs */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Platform KPIs</h2>
              <div className="grid grid-cols-3 gap-4">
                {platformKPIs.map((kpi) => (
                  <Card key={kpi.name} className="p-5 border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-gray-600">{kpi.name}</div>
                      <Badge
                        variant="secondary"
                        className={
                          (kpi.trend === "up" && !kpi.name.includes("Response Time")) ||
                          (kpi.trend === "down" && kpi.name.includes("Response Time"))
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {kpi.change}
                      </Badge>
                    </div>
                    <div className="text-3xl font-bold text-black mb-1">{kpi.value}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {kpi.trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>vs. last period</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Anomaly Alerts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Anomaly Detection</h2>
                  <p className="text-sm text-gray-600">
                    AI-powered detection of unusual patterns and behaviors
                  </p>
                </div>
                <Badge className="bg-purple-600 text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  ML-Powered
                </Badge>
              </div>
              <div className="space-y-3">
                {anomalyAlerts.map((anomaly) => (
                  <Card key={anomaly.id} className="p-5 border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{anomaly.type}</h3>
                              <Badge
                                variant="secondary"
                                className={
                                  anomaly.status === "investigating"
                                    ? "bg-orange-100 text-orange-800"
                                    : anomaly.status === "resolved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {anomaly.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{anomaly.description}</p>
                          </div>
                        </div>
                        <div className="ml-12 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-semibold text-purple-600">{anomaly.confidence}%</span>
                          </div>
                          <div className="text-gray-500">
                            {new Date(anomaly.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" className="border-gray-300">
                          <Eye className="w-3 h-3 mr-2" />
                          Review
                        </Button>
                        {anomaly.status === "investigating" && (
                          <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Geographic Heatmap */}
            <Card className="p-6 border-gray-200">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Risk Heatmap by Region</h3>
                <p className="text-sm text-gray-600">
                  Geographic distribution of risk scores and activity volume
                </p>
              </div>

              <div className="space-y-3">
                {heatmapData.map((region) => (
                  <div key={region.region} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{region.region}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>Volume: {region.volume}</span>
                        <span>Fraud: {region.fraud}</span>
                        <Badge
                          className={
                            region.risk >= 70
                              ? "bg-red-600 text-white"
                              : region.risk >= 40
                              ? "bg-yellow-600 text-white"
                              : "bg-green-600 text-white"
                          }
                        >
                          Risk: {region.risk}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all ${
                          region.risk >= 70
                            ? "bg-red-600"
                            : region.risk >= 40
                            ? "bg-yellow-600"
                            : "bg-green-600"
                        }`}
                        style={{ width: `${region.risk}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                        Risk Score: {region.risk}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-xs text-gray-600 mt-1">Low Risk Regions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">2</div>
                  <div className="text-xs text-gray-600 mt-1">Medium Risk Regions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">1</div>
                  <div className="text-xs text-gray-600 mt-1">High Risk Regions</div>
                </div>
              </div>
            </Card>

            {/* System Health Indicators */}
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Security Status</h3>
                    <p className="text-xs text-gray-600">All systems operational</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Firewall Status</span>
                    <Badge className="bg-green-600 text-white">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">SSL Certificate</span>
                    <Badge className="bg-green-600 text-white">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">DDoS Protection</span>
                    <Badge className="bg-green-600 text-white">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Intrusion Detection</span>
                    <Badge className="bg-green-600 text-white">Active</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Performance Metrics</h3>
                    <p className="text-xs text-gray-600">Real-time system performance</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">API Response Time</span>
                      <span className="font-semibold text-green-600">142ms</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Database Load</span>
                      <span className="font-semibold text-yellow-600">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Server Uptime</span>
                      <span className="font-semibold text-green-600">99.98%</span>
                    </div>
                    <Progress value={99.98} className="h-2" />
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
