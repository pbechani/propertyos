import { useState } from "react";
import { Link } from "react-router";
import {
  Shield,
  CheckCircle,
  Star,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Award,
  TrendingUp,
  Lock,
  Bell,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { RoleBadge } from "../components/ui/role-badge";
import { VerificationBadge } from "../components/ui/verification-badge";
import { ActivityTimeline } from "../components/ui/activity-timeline";

export default function ProfileDashboard() {
  const [showEditPanel, setShowEditPanel] = useState(false);

  const verificationLevel = 3; // 1-4 levels
  const trustScore = 94; // 0-100

  const completedSteps = [
    { id: 1, title: "Account Created", completed: true, date: "Feb 15, 2024" },
    { id: 2, title: "Email Verified", completed: true, date: "Feb 15, 2024" },
    { id: 3, title: "Phone Verified", completed: true, date: "Feb 15, 2024" },
    { id: 4, title: "Identity Documents Uploaded", completed: true, date: "Feb 18, 2024" },
    { id: 5, title: "Identity Verified", completed: true, date: "Feb 20, 2024" },
    { id: 6, title: "Business License Verified", completed: true, date: "Feb 20, 2024" },
    { id: 7, title: "Background Check", completed: false, date: "In Progress" },
    { id: 8, title: "Professional References", completed: false, date: "Pending" },
  ];

  const recentActivity = [
    {
      id: "1",
      title: "Verification Approved",
      description: "Your identity documents have been verified",
      timestamp: "2 hours ago",
      type: "success" as const,
      user: "Verification Team",
    },
    {
      id: "2",
      title: "Profile Updated",
      description: "Business information updated successfully",
      timestamp: "5 hours ago",
      type: "info" as const,
      user: "You",
    },
    {
      id: "3",
      title: "Document Uploaded",
      description: "Business license uploaded for verification",
      timestamp: "Yesterday",
      type: "pending" as const,
      user: "You",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profile Dashboard</h1>
              <p className="text-gray-600">
                Manage your account and verification status
              </p>
            </div>
            <Link to="/admin">
              <Button variant="outline" size="sm">
                Admin Panel
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    AT
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <h2 className="text-xl font-bold mb-1">Alex Thompson</h2>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <RoleBadge role="agent" size="sm" />
                  <VerificationBadge status="verified" size="sm" />
                </div>
                <p className="text-sm text-gray-600">Member since Feb 2024</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">alex.thompson@email.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">Los Angeles, CA</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">Premium Realty Group</span>
                </div>
              </div>

              <Button
                onClick={() => setShowEditPanel(!showEditPanel)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Card>

            {/* Trust Score Card */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Trust Score</div>
                    <div className="font-semibold text-gray-900">Excellent</div>
                  </div>
                </div>
                <div className="text-4xl font-bold text-green-600">{trustScore}</div>
              </div>

              <div className="w-full h-3 bg-green-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  style={{ width: `${trustScore}%` }}
                ></div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Verification Level</span>
                  <span className="font-medium text-gray-900">Level {verificationLevel}/4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Documents Verified</span>
                  <span className="font-medium text-gray-900">6/6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium text-gray-900">98%</span>
                </div>
              </div>
            </Card>

            {/* Verification Level */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Verification Level
              </h3>

              <div className="space-y-4">
                {[
                  {
                    level: 1,
                    name: "Basic",
                    description: "Email & Phone verified",
                    completed: true,
                  },
                  {
                    level: 2,
                    name: "Identity",
                    description: "Government ID verified",
                    completed: true,
                  },
                  {
                    level: 3,
                    name: "Professional",
                    description: "Business license verified",
                    completed: true,
                  },
                  {
                    level: 4,
                    name: "Premium",
                    description: "Background check complete",
                    completed: false,
                  },
                ].map((item) => (
                  <div
                    key={item.level}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      item.completed
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        item.completed
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {item.completed ? <CheckCircle className="w-5 h-5" /> : item.level}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-600">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.location.href = "/kyc-upload"}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Verification
              </Button>
            </Card>
          </div>

          {/* Right Column - Details & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">Verified</div>
                <div className="text-sm text-blue-100">Identity Status</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">6/6</div>
                <div className="text-sm text-green-100">Documents Verified</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">{trustScore}/100</div>
                <div className="text-sm text-purple-100">Trust Score</div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8" />
                </div>
                <div className="text-2xl font-bold mb-1">Level {verificationLevel}</div>
                <div className="text-sm text-orange-100">Verification Level</div>
              </Card>
            </div>

            {/* Completed Steps Checklist */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Verification Progress</h3>
              <div className="space-y-3">
                {completedSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      step.completed
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.completed
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${step.completed ? "text-gray-900" : "text-gray-600"}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.date}</div>
                    </div>
                    {step.completed && (
                      <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
              <ActivityTimeline items={recentActivity} />
            </Card>

            {/* Security Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Security & Privacy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Two-Factor Auth
                </Button>
                <Button variant="outline" className="justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Settings
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Privacy Settings
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Panel - Side Drawer */}
      {showEditPanel && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setShowEditPanel(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Edit Profile</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditPanel(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Alex"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Thompson"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="alex.thompson@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    defaultValue="Premium Realty Group"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowEditPanel(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
