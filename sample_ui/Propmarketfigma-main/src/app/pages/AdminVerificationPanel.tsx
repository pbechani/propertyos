import { useState } from "react";
import { Link } from "react-router";
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
  MessageSquare,
  ChevronRight,
  X,
  ZoomIn,
  RotateCw,
  Flag,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { RoleBadge } from "../components/ui/role-badge";
import { VerificationBadge } from "../components/ui/verification-badge";
import { StatusChip } from "../components/ui/status-chip";
import { ActivityTimeline } from "../components/ui/activity-timeline";

export default function AdminVerificationPanel() {
  const [currentTab, setCurrentTab] = useState("verification");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showFraudReport, setShowFraudReport] = useState(false);

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
      label: "Verified Today",
      value: "28",
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
      submittedDate: "2024-02-21 10:30 AM",
      documents: [
        { id: "doc1", name: "Government ID", type: "Passport", status: "uploaded" },
        { id: "doc2", name: "Business License", type: "PDF", status: "uploaded" },
        { id: "doc3", name: "Proof of Address", type: "Utility Bill", status: "uploaded" },
      ],
      status: "pending" as const,
      avatar: "MC",
      phone: "+1 (555) 123-4567",
      location: "Los Angeles, CA",
    },
    {
      id: "2",
      name: "Sarah Williams",
      email: "sarah.w@email.com",
      role: "contractor" as const,
      submittedDate: "2024-02-21 09:15 AM",
      documents: [
        { id: "doc4", name: "Government ID", type: "Driver's License", status: "uploaded" },
        { id: "doc5", name: "Business License", type: "PDF", status: "uploaded" },
      ],
      status: "pending" as const,
      avatar: "SW",
      phone: "+1 (555) 987-6543",
      location: "San Francisco, CA",
    },
    {
      id: "3",
      name: "John Martinez",
      email: "john.m@email.com",
      role: "inspector" as const,
      submittedDate: "2024-02-20 04:45 PM",
      documents: [
        { id: "doc6", name: "Government ID", type: "Passport", status: "uploaded" },
        { id: "doc7", name: "Professional Certificate", type: "PDF", status: "uploaded" },
        { id: "doc8", name: "Insurance Certificate", type: "PDF", status: "uploaded" },
      ],
      status: "pending" as const,
      avatar: "JM",
      phone: "+1 (555) 246-8135",
      location: "San Diego, CA",
    },
  ];

  const auditLogs = [
    {
      id: "1",
      title: "User Verification Approved",
      description: "Approved verification for Michael Chen (Agent) - All documents validated",
      timestamp: "2 hours ago",
      type: "success" as const,
      user: "Admin: John Smith",
    },
    {
      id: "2",
      title: "Fraud Report Created",
      description: "New fraud report filed for suspicious listing activity",
      timestamp: "3 hours ago",
      type: "error" as const,
      user: "Admin: Sarah Johnson",
    },
    {
      id: "3",
      title: "Document Rejected",
      description: "Rejected business license for invalid expiration date",
      timestamp: "4 hours ago",
      type: "error" as const,
      user: "Admin: John Smith",
    },
    {
      id: "4",
      title: "User Account Suspended",
      description: "Suspended account due to fraudulent activity detection",
      timestamp: "5 hours ago",
      type: "error" as const,
      user: "Admin: Sarah Johnson",
    },
    {
      id: "5",
      title: "Verification Requested - Additional Info",
      description: "Requested clearer photo of government ID from user",
      timestamp: "6 hours ago",
      type: "pending" as const,
      user: "Admin: John Smith",
    },
  ];

  const selectedUserData = pendingVerifications.find((u) => u.id === selectedUser);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-6 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Verification Panel</h1>
                  <p className="text-xs text-gray-500">Document Review & User Verification</p>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
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
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search users, reports..."
                  className="w-64 lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold">
                AS
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-4 md:p-6">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">User Verification</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Audit Logs</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queue List */}
              <Card className={selectedUser ? "lg:col-span-1" : "lg:col-span-3"}>
                <div className="p-4 md:p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Verification Queue</h2>
                  <p className="text-sm text-gray-600">
                    {pendingVerifications.length} users pending review
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingVerifications.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedUser === user.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          {user.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold truncate">{user.name}</h3>
                            <RoleBadge role={user.role} size="sm" />
                          </div>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.submittedDate}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Document Viewer & Actions */}
              {selectedUser && selectedUserData && (
                <Card className="lg:col-span-2">
                  <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                          {selectedUserData.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold">{selectedUserData.name}</h2>
                            <RoleBadge role={selectedUserData.role} size="md" />
                          </div>
                          <p className="text-sm text-gray-600">{selectedUserData.email}</p>
                          <p className="text-sm text-gray-600">{selectedUserData.phone}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                        className="lg:hidden"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="p-4 md:p-6">
                    <h3 className="font-semibold mb-4">Submitted Documents</h3>
                    <div className="space-y-4">
                      {selectedUserData.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between p-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <div className="font-medium text-gray-900">{doc.name}</div>
                                <div className="text-xs text-gray-500">{doc.type}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="bg-gray-100 p-8 flex items-center justify-center min-h-[200px]">
                            <div className="text-center">
                              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">Document Preview: {doc.name}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Click zoom to view full size
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Audit Trail */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        Audit Trail
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Submitted:</span>
                          <span className="font-medium">{selectedUserData.submittedDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Status:</span>
                          <StatusChip status="pending" size="sm" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Documents:</span>
                          <span className="font-medium">{selectedUserData.documents.length} files</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Last Reviewed:</span>
                          <span className="font-medium">Not yet reviewed</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => alert("User approved successfully")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Request Info
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => alert("User verification rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>

                    {/* Fraud Report Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-3 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setShowFraudReport(true)}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report Fraud / Suspicious Activity
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="p-4 md:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1">System Audit Logs</h2>
                <p className="text-sm text-gray-600">
                  Complete trail of all administrative actions and verification decisions
                </p>
              </div>
              <ActivityTimeline items={auditLogs} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fraud Report Modal */}
      {showFraudReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  Report Fraud / Suspicious Activity
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowFraudReport(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>Low - Minor concern</option>
                    <option>Medium - Requires attention</option>
                    <option>High - Urgent review needed</option>
                    <option>Critical - Immediate action required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Category
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>Fake Documents</option>
                    <option>Identity Theft</option>
                    <option>Impersonation</option>
                    <option>Falsified Information</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed information about the suspicious activity..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                <div className="flex items-start gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Important:</strong> All fraud reports are logged and investigated. False reports may result in disciplinary action.
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowFraudReport(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    alert("Fraud report submitted successfully");
                    setShowFraudReport(false);
                  }}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
