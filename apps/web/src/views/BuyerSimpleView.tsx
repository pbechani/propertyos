'use client';

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Home, Clock, CheckCircle2, Circle, FileText, Upload, MessageSquare,
  Phone, Calendar, DollarSign, AlertCircle, ChevronRight, Info, Shield
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BuyerSimpleView() {
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const property = {
    address: "88 Sunset Boulevard, Camps Bay",
    price: "R 12,500,000",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=400&fit=crop",
  };

  const stages = [
    { id: 1, name: "Offer Accepted", status: "completed", date: "Feb 1, 2024" },
    { id: 2, name: "Deposit Paid", status: "completed", date: "Feb 4, 2024" },
    { id: 3, name: "Legal Team Appointed", status: "completed", date: "Feb 5, 2024" },
    { id: 4, name: "Property Checks", status: "completed", date: "Feb 10, 2024" },
    { id: 5, name: "Bond Application", status: "completed", date: "Feb 17, 2024" },
    { id: 6, name: "Bond Approved", status: "completed", date: "Mar 3, 2024" },
    { id: 7, name: "Compliance Certificates", status: "in-progress", date: null },
    { id: 8, name: "Legal Documents", status: "in-progress", date: null },
    { id: 9, name: "Your Documents", status: "pending", date: null },
    { id: 10, name: "Municipality Clearance", status: "pending", date: null },
    { id: 11, name: "Transfer Payment", status: "pending", date: null },
    { id: 12, name: "Registration Filing", status: "pending", date: null },
    { id: 13, name: "Property Registration", status: "pending", date: null },
    { id: 14, name: "Keys & Handover", status: "pending", date: null },
  ];

  const outstandingTasks = [
    {
      id: 1,
      title: "Upload FICA Documents",
      description: "We need copies of your ID, proof of residence, and recent bank statements.",
      dueDate: "Mar 25, 2024",
      priority: "high",
      category: "documents",
      documents: [
        { name: "Certified ID Copy", uploaded: false },
        { name: "Proof of Residence (not older than 3 months)", uploaded: false },
        { name: "Bank Statements (last 3 months)", uploaded: false },
      ],
    },
    {
      id: 2,
      title: "Review Transfer Documents",
      description: "Your conveyancer has prepared the transfer documents. Please review and approve.",
      dueDate: "Mar 28, 2024",
      priority: "medium",
      category: "review",
    },
    {
      id: 3,
      title: "Schedule Final Inspection",
      description: "Book a time to do a final walk-through of the property before registration.",
      dueDate: "Apr 10, 2024",
      priority: "medium",
      category: "action",
    },
  ];

  const upcomingPayments = [
    { name: "Transfer Duty", amount: "R 768,000", dueDate: "Apr 15, 2024", status: "upcoming" },
    { name: "Transfer Costs", amount: "R 85,000", dueDate: "Apr 20, 2024", status: "upcoming" },
    { name: "Balance Payment", amount: "R 1,522,000", dueDate: "Registration Day", status: "future" },
  ];

  const contacts = [
    { 
      role: "Your Agent", 
      name: "Sarah Jenkins", 
      company: "PRIBEC Premier", 
      phone: "+27 84 345 6789",
      available: true
    },
    { 
      role: "Conveyancer", 
      name: "Cape Legal Services", 
      contact: "Adv. Maria Santos", 
      phone: "+27 21 555 0000",
      available: true
    },
    { 
      role: "Bond Consultant", 
      name: "Standard Bank", 
      contact: "John Ndlovu", 
      phone: "0860 123 000",
      available: false
    },
  ];

  const currentStage = stages.find(s => s.status === "in-progress")?.id || 7;
  const completedStages = stages.filter(s => s.status === "completed").length;
  const progressPercentage = (completedStages / stages.length) * 100;

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    if (status === "in-progress") return <Clock className="w-6 h-6 text-blue-600" />;
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-red-200 bg-red-50";
      case "medium": return "border-yellow-200 bg-yellow-50";
      case "low": return "border-green-200 bg-green-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Property */}
      <div className="bg-white border-b border-gray-200">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img 
            src={property.image} 
            alt={property.address}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 text-white">
            <Badge className="bg-green-500 mb-3">
              <Shield className="w-3 h-3 mr-1" />
              Purchase In Progress
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{property.address}</h1>
            <div className="text-xl md:text-2xl font-bold">{property.price}</div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Purchase Progress</h2>
              <span className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-700">
              {completedStages} of {stages.length} stages completed • Estimated completion: April 30, 2024
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 md:px-8 py-8 space-y-8">
        {/* Outstanding Tasks */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Your Action Required</h2>
              <p className="text-sm text-gray-600">{outstandingTasks.length} tasks need your attention</p>
            </div>
          </div>

          <div className="space-y-4">
            {outstandingTasks.map((task) => (
              <Card 
                key={task.id} 
                className={`p-6 border-2 ${getPriorityColor(task.priority)}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge 
                        className={
                          task.priority === "high" ? "bg-red-100 text-red-700" :
                          task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }
                      >
                        {task.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-3">{task.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Due by {task.dueDate}
                    </div>
                  </div>
                  <Button
                    variant={expandedTask === task.id ? "outline" : "default"}
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    className={task.priority === "high" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    {task.category === "documents" ? (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    ) : task.category === "review" ? (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Review
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule
                      </>
                    )}
                  </Button>
                </div>

                {expandedTask === task.id && task.documents && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <h4 className="font-medium text-sm mb-3">Required Documents:</h4>
                    {task.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Circle className="w-5 h-5 text-gray-300" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Timeline */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6">Purchase Timeline</h2>
            <Card className="p-6">
              <div className="space-y-4">
                {stages.map((stage, idx) => (
                  <div key={stage.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`
                        flex items-center justify-center rounded-full
                        ${stage.status === "completed" ? "bg-green-100" : 
                          stage.status === "in-progress" ? "bg-blue-100" : "bg-gray-100"}
                      `}>
                        {getStatusIcon(stage.status)}
                      </div>
                      {idx < stages.length - 1 && (
                        <div className={`
                          w-0.5 h-12 my-1
                          ${stage.status === "completed" ? "bg-green-300" : "bg-gray-200"}
                        `}></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-medium ${
                          stage.status === "completed" ? "text-gray-900" :
                          stage.status === "in-progress" ? "text-blue-600" :
                          "text-gray-400"
                        }`}>
                          {stage.name}
                        </h3>
                        {stage.status === "completed" && stage.date && (
                          <span className="text-sm text-gray-500">{stage.date}</span>
                        )}
                        {stage.status === "in-progress" && (
                          <Badge className="bg-blue-100 text-blue-700">IN PROGRESS</Badge>
                        )}
                      </div>
                      {stage.status === "in-progress" && (
                        <p className="text-sm text-gray-600 mt-2">
                          Our team is working on this stage. We'll notify you when action is needed.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Payments */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Upcoming Payments</h3>
              <div className="space-y-3">
                {upcomingPayments.map((payment, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{payment.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {payment.status === "upcoming" ? "SOON" : "LATER"}
                      </Badge>
                    </div>
                    <div className="font-bold text-blue-600 mb-1">{payment.amount}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {payment.dueDate}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Info className="w-4 h-4 mr-2" />
                Payment Details
              </Button>
            </Card>

            {/* Quick Contacts */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <div className="space-y-3">
                {contacts.map((contact, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">{contact.role}</div>
                        <div className="font-medium text-sm">{contact.name}</div>
                        {contact.contact && (
                          <div className="text-xs text-gray-600">{contact.contact}</div>
                        )}
                        {contact.company && (
                          <div className="text-xs text-gray-600">{contact.company}</div>
                        )}
                      </div>
                      <div className={`
                        w-2 h-2 rounded-full mt-1.5
                        ${contact.available ? "bg-green-500" : "bg-gray-300"}
                      `}></div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Help Center */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <h3 className="font-semibold mb-2">First Time Buyer?</h3>
              <p className="text-sm text-gray-700 mb-4">
                We're here to guide you through every step of the process.
              </p>
              <Button variant="outline" className="w-full">
                <Info className="w-4 h-4 mr-2" />
                View Help Guide
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
