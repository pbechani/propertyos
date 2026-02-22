'use client';

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Shield,
  Users,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleBadge } from "@/components/ui/role-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { StatusChip } from "@/components/ui/status-chip";
import { ActivityTimeline } from "@/components/ui/activity-timeline";

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState("verification");

  const stats = [
    {
      label: "Pending Verifications",
      value: "42",
      change: "+12 today",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Active Fraud Reports",
      value: "8",
      change: "3 urgent",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Total Users",
      value: "15,248",
      change: "+324 this week",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Verified Agents",
      value: "2,547",
      change: "98% approval rate",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const pendingVerifications = [
    {
      id: "1",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      role: "agent" as const,
      submittedDate: "2024-02-20",
      documents: 3,
      status: "pending" as const,
      avatar: "MC",
    },
    {
      id: "2",
      name: "Sarah Williams",
      email: "sarah.w@email.com",
      role: "contractor" as const,
      submittedDate: "2024-02-20",
      documents: 2,
      status: "pending" as const,
      avatar: "SW",
    },
    {
      id: "3",
      name: "John Martinez",
      email: "john.m@email.com",
      role: "property_manager" as const,
      submittedDate: "2024-02-19",
      documents: 3,
      status: "pending" as const,
      avatar: "JM",
    },
  ];

  const fraudReports = [
    {
      id: "FR-001",
      reportedBy: "Alex Thompson",
      subject: "Fake Property Listing",
      propertyId: "88 Sunset Boulevard",
      severity: "high",
      status: "active" as const,
      date: "2024-02-21",
      description: "Listing uses stolen images from another property",
    },
    {
      id: "FR-002",
      reportedBy: "Emma Davis",
      subject: "Impersonation Attempt",
      propertyId: "N/A",
      severity: "critical",
      status: "active" as const,
      date: "2024-02-21",
      description: "User impersonating a licensed agent",
    },
    {
      id: "FR-003",
      reportedBy: "James Wilson",
      subject: "Price Manipulation",
      propertyId: "204 Sky View",
      severity: "medium",
      status: "pending" as const,
      date: "2024-02-20",
      description: "Suspicious price changes to attract buyers",
    },
  ];

  const auditLogs = [
    {
      id: "1",
      title: "User Verification Approved",
      description: "Approved verification for Michael Chen (Agent)",
      timestamp: "2 hours ago",
      type: "success" as const,
      user: "Admin: John Smith",
    },
    {
      id: "2",
      title: "Fraud Report Investigated",
      description: "Closed fraud report FR-002 after investigation",
      timestamp: "3 hours ago",
      type: "info" as const,
      user: "Admin: Sarah Johnson",
    },
    {
      id: "3",
      title: "User Account Suspended",
      description: "Suspended account due to fraudulent activity",
      timestamp: "5 hours ago",
      type: "error" as const,
      user: "Admin: John Smith",
    },
    {
      id: "4",
      title: "Document Verification Failed",
      description: "Rejected verification for invalid business license",
      timestamp: "Yesterday",
      type: "error" as const,
      user: "Admin: Sarah Johnson",
    },
    {
      id: "5",
      title: "New Agent Registration",
      description: "New agent submitted verification documents",
      timestamp: "Yesterday",
      type: "pending" as const,
      user: "System",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Panel</h1>
                  <p className="text-xs text-gray-500">PropertyOS Administration</p>
                </div>
              </Link>

              <nav className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app">
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app/analytics">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Link>
                </Button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search users, reports..."
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">
                AS
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.change}</div>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Verification
              </TabsTrigger>
              <TabsTrigger value="fraud" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Fraud Reports
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* User Verification Tab */}
          <TabsContent value="verification">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Pending Verifications</h2>
                <p className="text-sm text-gray-600">
                  Review and approve user verification documents
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingVerifications.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{user.name}</h3>
                          <RoleBadge role={user.role} size="sm" />
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right mr-6">
                        <div className="text-sm text-gray-600 mb-1">Submitted</div>
                        <div className="text-sm font-medium">{user.submittedDate}</div>
                      </div>
                      <div className="text-right mr-6">
                        <div className="text-sm text-gray-600 mb-1">Documents</div>
                        <div className="text-sm font-medium">{user.documents} files</div>
                      </div>
                      <StatusChip status={user.status} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href="/admin/verification">
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </a>
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Fraud Reports Tab */}
          <TabsContent value="fraud">
            <Card>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Active Fraud Reports</h2>
                <p className="text-sm text-gray-600">
                  Investigate and resolve reported fraudulent activities
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {fraudReports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          report.severity === "critical"
                            ? "bg-red-100"
                            : report.severity === "high"
                            ? "bg-orange-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        <AlertTriangle
                          className={`w-6 h-6 ${
                            report.severity === "critical"
                              ? "text-red-600"
                              : report.severity === "high"
                              ? "text-orange-600"
                              : "text-yellow-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{report.subject}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              report.severity === "critical"
                                ? "bg-red-100 text-red-700"
                                : report.severity === "high"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {report.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">Report ID: {report.id}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Reported by: {report.reportedBy}</span>
                          <span>Property: {report.propertyId}</span>
                          <span>Date: {report.date}</span>
                        </div>
                      </div>
                      <StatusChip status={report.status} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          Investigate
                        </Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1">System Audit Logs</h2>
                <p className="text-sm text-gray-600">
                  Track all administrative actions and system events
                </p>
              </div>
              <ActivityTimeline items={auditLogs} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}