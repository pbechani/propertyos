'use client';

import { useState } from "react";
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  CircleDashed, 
  Clock, 
  DollarSign, 
  FileText, 
  Hammer, 
  HardHat, 
  Image as ImageIcon, 
  LayoutDashboard, 
  MapPin, 
  MoreHorizontal, 
  Paperclip, 
  Plus, 
  ShieldCheck, 
  Signal, 
  Smartphone, 
  Upload, 
  Wifi, 
  WifiOff
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";

// Mock Data
const budgetData = [
  { name: "Foundation", budget: 45000, actual: 48000 },
  { name: "Framing", budget: 35000, actual: 32000 },
  { name: "Plumbing", budget: 25000, actual: 28000 },
  { name: "Electrical", budget: 20000, actual: 19500 },
  { name: "Drywall", budget: 15000, actual: 12000 },
  { name: "Finish", budget: 40000, actual: 15000 }, // In progress
];

const milestones = [
  { 
    id: 1, 
    title: "Site Preparation & Excavation", 
    status: "completed", 
    date: "Oct 15, 2023", 
    budget: 15000, 
    spent: 14800,
    evidence: [
      "https://images.unsplash.com/photo-1768223903619-637df53d3908?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwYnVpbGRpbmclMjBtb2Rlcm58ZW58MXx8fHwxNzcxNzU2MjY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      "https://images.unsplash.com/photo-1756916078091-c8dcd0e75ce5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGZvdW5kYXRpb258ZW58MXx8fHwxNzcxNzU2MjY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    ]
  },
  { 
    id: 2, 
    title: "Foundation Pouring", 
    status: "completed", 
    date: "Nov 02, 2023", 
    budget: 45000, 
    spent: 48000,
    evidence: [
      "https://images.unsplash.com/photo-1756916078091-c8dcd0e75ce5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGZvdW5kYXRpb258ZW58MXx8fHwxNzcxNzU2MjY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    ]
  },
  { 
    id: 3, 
    title: "Structural Framing", 
    status: "in-progress", 
    date: "Dec 10, 2023", 
    budget: 35000, 
    spent: 32000,
    progress: 85,
    evidence: []
  },
  { 
    id: 4, 
    title: "Roofing & Siding", 
    status: "pending", 
    date: "Jan 15, 2024", 
    budget: 28000, 
    spent: 0,
    evidence: []
  },
  { 
    id: 5, 
    title: "Interior Systems", 
    status: "pending", 
    date: "Feb 20, 2024", 
    budget: 45000, 
    spent: 0,
    evidence: []
  },
];

const escrowPayments = [
  { id: 101, title: "Initial Deposit", amount: 15000, status: "Released", date: "Oct 01, 2023" },
  { id: 102, title: "Foundation Milestone", amount: 45000, status: "Released", date: "Nov 05, 2023" },
  { id: 103, title: "Framing Milestone", amount: 35000, status: "Locked", date: "Est. Dec 15, 2023" },
  { id: 104, title: "Roofing Milestone", amount: 28000, status: "Locked", date: "Est. Jan 20, 2024" },
];

export default function ConstructionProjectDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "field-app">("overview");
  const [isOffline, setIsOffline] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<typeof milestones[0] | null>(null);

  // Toggle offline mode simulation
  const toggleOffline = () => setIsOffline(!isOffline);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">Luxury Apartment Complex - Phase 1</h1>
              <p className="text-sm text-gray-500">Construction Project Dashboard</p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link to="/inspection-verification">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Inspections
                </Button>
              </Link>
              <Link to="/boq-workspace">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <FileText className="w-4 h-4 mr-2" />
                  BOQ
                </Button>
              </Link>
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Update
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="Total Budget" value="$450,000" sub="72% Committed" icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
                <Card title="Timeline" value="Week 14" sub="of 24 Weeks" icon={Calendar} color="text-purple-600" bg="bg-purple-50" />
                <Card title="Completion" value="58%" sub="+2% this week" icon={CheckCircle2} color="text-green-600" bg="bg-green-50" />
                <Card title="Issues" value="3 Active" sub="1 Critical" icon={ShieldCheck} color="text-orange-600" bg="bg-orange-50" />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Budget vs Actual Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Budget vs Actual Costs</h3>
                    <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option>All Phases</option>
                      <option>Completed Only</option>
                    </select>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, "Amount"]}
                          contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        />
                        <Bar dataKey="budget" name="Budget" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="actual" name="Actual Spent" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Escrow Payments */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Escrow Linked Payments</h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {escrowPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">{payment.title}</p>
                          <p className="text-xs text-gray-500">{payment.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${payment.amount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            payment.status === "Released" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link to="/escrow" className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center justify-center gap-1">
                      View Full Escrow Details <MoreHorizontal className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Activity / Milestone Tracker Preview */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h3>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-8">
                    {milestones.slice(0, 3).map((milestone, index) => (
                      <div key={milestone.id} className="relative flex items-start gap-6">
                        <div className={`z-10 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${
                          milestone.status === "completed" ? "bg-green-500 text-white" :
                          milestone.status === "in-progress" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                        }`}>
                          {milestone.status === "completed" ? <CheckCircle2 className="w-6 h-6" /> :
                           milestone.status === "in-progress" ? <Hammer className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                              <p className="text-sm text-gray-500">{milestone.date}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${
                              milestone.status === "completed" ? "bg-green-100 text-green-700" :
                              milestone.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"
                            }`}>
                              {milestone.status.replace('-', ' ')}
                            </span>
                          </div>
                          {milestone.status === "in-progress" && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{milestone.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${milestone.progress}%` }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "milestones" && (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Milestone List */}
              <div className="lg:col-span-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Stages</h3>
                {milestones.map((milestone) => (
                  <button
                    key={milestone.id}
                    onClick={() => setSelectedMilestone(milestone)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedMilestone?.id === milestone.id
                        ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500"
                        : "bg-white border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-medium ${selectedMilestone?.id === milestone.id ? "text-blue-900" : "text-gray-900"}`}>
                        {milestone.title}
                      </h4>
                      {milestone.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{milestone.date}</span>
                      <span className={`${
                        milestone.spent > milestone.budget ? "text-red-600" : "text-gray-600"
                      }`}>
                        ${milestone.spent.toLocaleString()} / ${milestone.budget.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Detailed View */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8">
                {selectedMilestone ? (
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-gray-900">{selectedMilestone.title}</h2>
                          <span className={`px-3 py-1 text-sm rounded-full font-medium capitalize ${
                            selectedMilestone.status === "completed" ? "bg-green-100 text-green-700" :
                            selectedMilestone.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {selectedMilestone.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-500">Scheduled Completion: {selectedMilestone.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Contracts
                        </Button>
                        {selectedMilestone.status === "in-progress" && (
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Request Approval
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-500 mb-1">Budget Allocation</h5>
                        <p className="text-2xl font-bold text-gray-900">${selectedMilestone.budget.toLocaleString()}</p>
                        <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${selectedMilestone.spent > selectedMilestone.budget ? "bg-red-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min((selectedMilestone.spent / selectedMilestone.budget) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((selectedMilestone.spent / selectedMilestone.budget) * 100)}% utilized
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-500 mb-1">Inspection Status</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-gray-900">Passed - Grade A</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Verified by City Inspector on Oct 30</p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-500" />
                        Evidence & Photos
                      </h4>
                      {selectedMilestone.evidence.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {selectedMilestone.evidence.map((img, idx) => (
                            <div key={idx} className="aspect-video relative rounded-lg overflow-hidden group">
                              <img src={img} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" size="sm" className="h-8 w-8 p-0 rounded-full">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <button className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors bg-gray-50 hover:bg-blue-50">
                            <Upload className="w-6 h-6 mb-2" />
                            <span className="text-xs font-medium">Add Photo</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No evidence uploaded yet.</p>
                          <Button variant="link" className="text-blue-600">Upload Photos</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
                    <p>Select a milestone to view details</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "field-app" && (
            <motion.div
              key="field-app"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto"
            >
              {/* Mobile Field App Simulation Container */}
              <div className="bg-white border-x border-gray-200 min-h-[calc(100vh-8rem)] shadow-2xl relative flex flex-col">
                {/* Field App Header */}
                <div className="bg-slate-900 text-white p-4 sticky top-0 z-20">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-6 h-6 text-yellow-400" />
                      <span className="font-bold text-lg">Field Ops</span>
                    </div>
                    <button 
                      onClick={toggleOffline}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isOffline ? "bg-orange-500 text-white" : "bg-green-500/20 text-green-300 border border-green-500/30"
                      }`}
                    >
                      {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                      {isOffline ? "Offline Mode" : "Sync Active"}
                    </button>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      MS
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Marcus Sterling</p>
                      <p className="text-xs text-slate-400">Site Supervisor</p>
                    </div>
                  </div>
                </div>

                {/* Field App Content */}
                <div className="flex-1 p-4 space-y-6 bg-gray-50">
                  {/* Current Task */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">Current Phase</h4>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">In Progress</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Structural Framing - Level 2</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Started 2 days ago</span>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Add Photo</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Daily Log</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                      <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Check In</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-2">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Issue</span>
                    </button>
                  </div>

                  {/* Recent Uploads */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 ml-1">Recent Evidence</h4>
                    <div className="space-y-3">
                      <div className="flex gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <img 
                          src="https://images.unsplash.com/photo-1714575600356-6635434699f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjB0YWJsZXR8ZW58MXx8fHwxNzcxNzEyODE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                          className="w-16 h-16 rounded-lg object-cover" 
                          alt="Recent work"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">Foundation Check #42</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            Lat: 34.05, Long: -118.24
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Synced
                          </div>
                        </div>
                      </div>
                      
                      {/* Simulating a pending upload if offline */}
                      {isOffline && (
                        <div className="flex gap-3 bg-white p-3 rounded-lg shadow-sm border border-orange-200">
                          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Framing Corner Detail</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              Lat: 34.05, Long: -118.24
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <CircleDashed className="w-3 h-3 animate-spin" />
                              Waiting for connection...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="bg-white p-4 border-t border-gray-200 sticky bottom-0">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg">
                    <Plus className="w-5 h-5 mr-2" />
                    New Entry
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Card({ title, value, sub, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-xs text-gray-500 mt-1">{sub}</p>
      </div>
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}