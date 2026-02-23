'use client';

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  ChevronLeft, Clock, CheckCircle2, AlertCircle, Circle,
  FileText, Users, DollarSign, AlertTriangle, MessageSquare, Calendar,
  Download, Upload, Eye, MoreVertical, Shield, X, Phone, Plus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StageStatus = "not-started" | "in-progress" | "completed" | "blocked";

interface Stage {
  id: number;
  name: string;
  status: StageStatus;
  daysInStage: number;
  completedDate?: string;
}

interface Document {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  uploadedBy?: string;
  uploadedDate?: string;
}

export default function PropertySaleWorkspace() {
  const [selectedTab, setSelectedTab] = useState<"timeline" | "documents" | "parties" | "escrow" | "issues" | "communication">("timeline");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const property = {
    address: "88 Sunset Boulevard, Camps Bay",
    price: "R 12,500,000",
    buyer: "John & Mary Smith",
    seller: "David Thompson",
    agent: "Sarah Jenkins",
    conveyancer: "Cape Legal Services",
  };

  const stages: Stage[] = [
    { id: 1, name: "Offer Accepted", status: "completed", daysInStage: 2, completedDate: "2024-02-01" },
    { id: 2, name: "Deposit Received", status: "completed", daysInStage: 3, completedDate: "2024-02-04" },
    { id: 3, name: "Conveyancer Appointed", status: "completed", daysInStage: 1, completedDate: "2024-02-05" },
    { id: 4, name: "Title Deed Search", status: "completed", daysInStage: 5, completedDate: "2024-02-10" },
    { id: 5, name: "Bond Application", status: "completed", daysInStage: 7, completedDate: "2024-02-17" },
    { id: 6, name: "Bond Approval", status: "completed", daysInStage: 14, completedDate: "2024-03-03" },
    { id: 7, name: "Compliance Certificates", status: "in-progress", daysInStage: 8 },
    { id: 8, name: "Draft Transfer Docs", status: "in-progress", daysInStage: 3 },
    { id: 9, name: "FICA Documents", status: "not-started", daysInStage: 0 },
    { id: 10, name: "Rates Clearance", status: "not-started", daysInStage: 0 },
    { id: 11, name: "Transfer Duty Payment", status: "not-started", daysInStage: 0 },
    { id: 12, name: "Lodgement at Deeds", status: "not-started", daysInStage: 0 },
    { id: 13, name: "Registration", status: "not-started", daysInStage: 0 },
    { id: 14, name: "Keys Handover", status: "not-started", daysInStage: 0 },
  ];

  const documents: Record<number, Document[]> = {
    7: [
      { id: "1", name: "Electrical Compliance Certificate", required: true, uploaded: true, uploadedBy: "Seller", uploadedDate: "2024-03-15" },
      { id: "2", name: "Plumbing Compliance Certificate", required: true, uploaded: false },
      { id: "3", name: "Gas Installation Certificate", required: false, uploaded: true, uploadedBy: "Seller", uploadedDate: "2024-03-16" },
      { id: "4", name: "Beetle Certificate", required: true, uploaded: false },
    ],
    8: [
      { id: "5", name: "Transfer Duty Calculation", required: true, uploaded: true, uploadedBy: "Conveyancer", uploadedDate: "2024-03-18" },
      { id: "6", name: "Draft Deed of Sale", required: true, uploaded: true, uploadedBy: "Conveyancer", uploadedDate: "2024-03-20" },
    ],
    9: [
      { id: "7", name: "Buyer ID Documents", required: true, uploaded: false },
      { id: "8", name: "Proof of Residence", required: true, uploaded: false },
      { id: "9", name: "Bank Statements", required: true, uploaded: false },
    ],
  };

  const parties = [
    { role: "Buyer", name: "John & Mary Smith", email: "john.smith@email.com", phone: "+27 82 123 4567", verified: true },
    { role: "Seller", name: "David Thompson", email: "david.t@email.com", phone: "+27 83 234 5678", verified: true },
    { role: "Agent", name: "Sarah Jenkins", company: "PRIBEC Premier", email: "sarah@pribec.co.za", phone: "+27 84 345 6789", verified: true },
    { role: "Conveyancer", name: "Cape Legal Services", contact: "Adv. Maria Santos", email: "maria@capelegal.co.za", phone: "+27 21 555 0000", verified: true },
    { role: "Bank", name: "Standard Bank", contact: "Bond Department", email: "bonds@standardbank.co.za", phone: "0860 123 000", verified: true },
  ];

  const activityLog = [
    { date: "2024-03-20", time: "14:30", user: "Conveyancer", action: "Uploaded Draft Deed of Sale", stage: 8 },
    { date: "2024-03-18", time: "10:15", user: "Conveyancer", action: "Uploaded Transfer Duty Calculation", stage: 8 },
    { date: "2024-03-16", time: "16:45", user: "Seller", action: "Uploaded Gas Installation Certificate", stage: 7 },
    { date: "2024-03-15", time: "09:20", user: "Seller", action: "Uploaded Electrical Compliance Certificate", stage: 7 },
    { date: "2024-03-10", time: "11:00", user: "System", action: "Stage 7 entered: Compliance Certificates", stage: 7 },
    { date: "2024-03-03", time: "15:30", user: "Bank", action: "Bond Approved - R 10,000,000", stage: 6 },
  ];

  const getStatusIcon = (status: StageStatus) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in-progress": return <Clock className="w-5 h-5 text-blue-600" />;
      case "blocked": return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusColor = (status: StageStatus) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700 border-green-300";
      case "in-progress": return "bg-blue-100 text-blue-700 border-blue-300";
      case "blocked": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-500 border-gray-300";
    }
  };

  const completedStages = stages.filter(s => s.status === "completed").length;
  const progressPercentage = (completedStages / stages.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <Link to="/app/agent" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{property.address}</h1>
              <Badge className="bg-blue-100 text-blue-700">
                <Shield className="w-3 h-3 mr-1" />
                Active Sale
              </Badge>
            </div>
            <div className="text-xl font-bold text-blue-600 mb-3">{property.price}</div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div>Buyer: <span className="font-medium text-gray-900">{property.buyer}</span></div>
              <div className="hidden sm:block">•</div>
              <div>Seller: <span className="font-medium text-gray-900">{property.seller}</span></div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="font-bold text-lg">{Math.round(progressPercentage)}%</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {completedStages} of {stages.length} stages completed
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Timeline - Horizontal Scroll */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6 overflow-x-auto">
        <div className="min-w-max">
          <div className="flex items-start gap-2">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-start">
                <div 
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => {
                    setSelectedStage(stage.id);
                    setShowProgressModal(true);
                  }}
                >
                  {/* Stage Circle */}
                  <div 
                    className={`
                      w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2
                      transition-all duration-200 group-hover:scale-110
                      ${getStatusColor(stage.status)}
                    `}
                  >
                    {getStatusIcon(stage.status)}
                  </div>
                  
                  {/* Stage Info */}
                  <div className="text-center w-32">
                    <div className="font-semibold text-xs mb-1 line-clamp-2">{stage.name}</div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(stage.status)}`}
                    >
                      {stage.status.replace("-", " ").toUpperCase()}
                    </Badge>
                    {stage.daysInStage > 0 && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stage.daysInStage}d
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Connector Line */}
                {idx < stages.length - 1 && (
                  <div className="flex items-center pt-6 px-2">
                    <div 
                      className={`h-0.5 w-8 ${
                        stage.status === "completed" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: "timeline", label: "Timeline", icon: Calendar },
            { id: "documents", label: "Documents", icon: FileText },
            { id: "parties", label: "Parties", icon: Users },
            { id: "escrow", label: "Escrow", icon: DollarSign },
            { id: "issues", label: "Issues", icon: AlertTriangle },
            { id: "communication", label: "Communication", icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setSelectedTab(
                  tab.id as "timeline" | "documents" | "parties" | "escrow" | "issues" | "communication"
                )
              }
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap
                transition-colors
                ${selectedTab === tab.id 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-600 hover:text-gray-900"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-8">
        {/* Timeline Tab */}
        {selectedTab === "timeline" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Activity Log</h3>
                <div className="space-y-4">
                  {activityLog.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-medium text-sm">{activity.action}</div>
                          <Badge variant="secondary" className="text-xs">Stage {activity.stage}</Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          {activity.user} • {activity.date} at {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Current Stage</h3>
                <div className="text-center py-6 px-4 bg-blue-50 rounded-lg mb-4">
                  <div className="text-4xl font-bold text-blue-600 mb-2">7</div>
                  <div className="font-medium mb-1">Compliance Certificates</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days in stage:</span>
                    <span className="font-medium">8 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected duration:</span>
                    <span className="font-medium">10-15 days</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Key Dates</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Offer Accepted:</span>
                    <span className="font-medium">Feb 1, 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bond Approved:</span>
                    <span className="font-medium">Mar 3, 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Est. Registration:</span>
                    <span className="font-medium text-blue-600">Apr 30, 2024</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {selectedTab === "documents" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Document Checklist</h3>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>

            <div className="space-y-8">
              {Object.entries(documents).map(([stageId, docs]) => {
                const stage = stages.find(s => s.id === parseInt(stageId));
                return (
                  <div key={stageId}>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={getStatusColor(stage?.status || "not-started")}>
                        Stage {stageId}
                      </Badge>
                      <h4 className="font-medium">{stage?.name}</h4>
                    </div>
                    <div className="space-y-3 ml-4">
                      {docs.map((doc) => (
                        <div 
                          key={doc.id} 
                          className={`
                            flex items-center justify-between p-4 rounded-lg border-2
                            ${doc.uploaded 
                              ? "bg-green-50 border-green-200" 
                              : doc.required 
                                ? "bg-yellow-50 border-yellow-200" 
                                : "bg-gray-50 border-gray-200"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                              ${doc.uploaded ? "bg-green-100" : "bg-gray-100"}
                            `}>
                              {doc.uploaded ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <FileText className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{doc.name}</span>
                                {doc.required && !doc.uploaded && (
                                  <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {doc.uploaded && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Uploaded by {doc.uploadedBy} on {doc.uploadedDate}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.uploaded ? (
                              <>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                                <Upload className="w-4 h-4 mr-2" />
                                Upload
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Parties Tab */}
        {selectedTab === "parties" && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-6">Transaction Parties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parties.map((party, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="secondary" className="mb-2">{party.role}</Badge>
                      <h4 className="font-semibold">{party.name}</h4>
                      {party.company && (
                        <div className="text-sm text-gray-600">{party.company}</div>
                      )}
                      {party.contact && (
                        <div className="text-sm text-gray-600">{party.contact}</div>
                      )}
                    </div>
                    {party.verified && (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      {party.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {party.phone}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Escrow Tab */}
        {selectedTab === "escrow" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-6">Payment Schedule</h3>
              <div className="space-y-4">
                {[
                  { name: "Initial Deposit", amount: "R 125,000", status: "paid", date: "Feb 4, 2024" },
                  { name: "Bond Amount", amount: "R 10,000,000", status: "approved", date: "Mar 3, 2024" },
                  { name: "Transfer Duty", amount: "R 768,000", status: "pending", date: "Due: Apr 15, 2024" },
                  { name: "Transfer Costs", amount: "R 85,000", status: "pending", date: "Due: Apr 20, 2024" },
                  { name: "Balance from Buyer", amount: "R 1,522,000", status: "pending", date: "Due: Registration" },
                ].map((payment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{payment.name}</div>
                      <div className="text-sm text-gray-600">{payment.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{payment.amount}</div>
                      <Badge 
                        className={
                          payment.status === "paid" ? "bg-green-100 text-green-700" :
                          payment.status === "approved" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {payment.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-6">Financial Summary</h3>
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Purchase Price</div>
                  <div className="text-3xl font-bold text-blue-600">R 12,500,000</div>
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit Paid</span>
                    <span className="font-medium text-green-600">R 125,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bond Approved</span>
                    <span className="font-medium text-blue-600">R 10,000,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Duty</span>
                    <span className="font-medium">R 768,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Legal Costs</span>
                    <span className="font-medium">R 85,000</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-semibold">Balance Outstanding</span>
                    <span className="font-bold text-lg">R 1,522,000</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Issues Tab */}
        {selectedTab === "issues" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Open Issues</h3>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
            <div className="space-y-4">
              {[
                { 
                  id: 1, 
                  title: "Electrical Certificate Delayed", 
                  stage: 7, 
                  severity: "high", 
                  reported: "Mar 18, 2024",
                  description: "Electrician has delayed inspection. Rescheduled for Mar 25.",
                  status: "open"
                },
                { 
                  id: 2, 
                  title: "Missing Beetle Certificate", 
                  stage: 7, 
                  severity: "medium", 
                  reported: "Mar 15, 2024",
                  description: "Seller needs to arrange pest inspection. Waiting on quote.",
                  status: "open"
                },
              ].map((issue) => (
                <div 
                  key={issue.id} 
                  className={`
                    p-5 rounded-lg border-2
                    ${issue.severity === "high" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${issue.severity === "high" ? "text-red-600" : "text-yellow-600"}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{issue.title}</h4>
                          <Badge className={issue.severity === "high" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                            {issue.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{issue.description}</p>
                        <div className="text-xs text-gray-600">
                          Stage {issue.stage} • Reported {issue.reported}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}

              {/* Resolved Issues */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-600 mb-4">Resolved Issues (2)</h4>
                <div className="space-y-3">
                  {[
                    { title: "Bank required additional documents", resolved: "Mar 2, 2024" },
                    { title: "Title deed name mismatch", resolved: "Feb 28, 2024" },
                  ].map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="flex-1">{issue.title}</span>
                      <span className="text-xs">{issue.resolved}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Communication Tab */}
        {selectedTab === "communication" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-6">Messages</h3>
                <div className="space-y-4 mb-6">
                  {[
                    { from: "Conveyancer", message: "All compliance certificates must be received by March 25 to stay on schedule.", time: "2 hours ago" },
                    { from: "Agent", message: "Seller has confirmed electrician appointment for tomorrow.", time: "5 hours ago" },
                    { from: "Bank", message: "Bond grant letter has been issued. Please find attached.", time: "1 day ago" },
                  ].map((msg, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{msg.from}</span>
                          <span className="text-xs text-gray-500">{msg.time}</span>
                        </div>
                        <p className="text-sm text-gray-700">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      Send
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message All Parties
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Request Documents
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Notifications</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium">Stage Update</div>
                      <div className="text-gray-600 text-xs">Stage 8 progress updated</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium">Document Uploaded</div>
                      <div className="text-gray-600 text-xs">Gas certificate received</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Stage Progression Modal */}
      {showProgressModal && selectedStage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl">Stage {selectedStage} Details</h3>
              <button 
                onClick={() => setShowProgressModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  {stages.find(s => s.id === selectedStage)?.name}
                </h4>
                <Badge className={getStatusColor(stages.find(s => s.id === selectedStage)?.status || "not-started")}>
                  {stages.find(s => s.id === selectedStage)?.status.replace("-", " ").toUpperCase()}
                </Badge>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Days in Stage:</span>
                  <span className="font-medium">{stages.find(s => s.id === selectedStage)?.daysInStage} days</span>
                </div>
                {stages.find(s => s.id === selectedStage)?.completedDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">{stages.find(s => s.id === selectedStage)?.completedDate}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3">Required Documents:</h4>
                <div className="space-y-2">
                  {documents[selectedStage]?.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm">
                      {doc.uploaded ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={doc.uploaded ? "text-gray-900" : "text-gray-600"}>
                        {doc.name}
                      </span>
                    </div>
                  )) || <p className="text-sm text-gray-500">No documents required for this stage</p>}
                </div>
              </div>

              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => setShowProgressModal(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}